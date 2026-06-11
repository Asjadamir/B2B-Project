import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuditLogs } from "@/lib/api";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { ScrollText, ChevronLeft, ChevronRight, Download } from "lucide-react";

const ENTITY_TYPES = ["All", "Employee", "Product", "Supplier", "PurchaseOrder", "SaleOrder", "Warehouse", "Business", "Category"];
const ACTIONS = ["All", "CREATE", "UPDATE", "DELETE", "SEND_INVITE", "ACCEPT_INVITE", "EXPEL_EMPLOYEE", "UPDATE_ROLE", "STATUS_UPDATE"];

export default function AuditLogsPage() {
    const { id } = useParams();
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [entityFilter, setEntityFilter] = useState("All");
    const [actionFilter, setActionFilter] = useState("All");
    const limit = 20;

    useEffect(() => {
        setLoading(true);
        const params = {
            businessId: id,
            page,
            limit,
            ...(entityFilter !== "All" && { entityType: entityFilter }),
            ...(actionFilter !== "All" && { action: actionFilter }),
        };
        getAuditLogs(params)
            .then((d) => { setLogs(d.logs || []); setTotal(d.total || 0); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id, page, entityFilter, actionFilter]);

    function exportCSV() {
        const headers = ["Timestamp", "Action", "Entity Type", "Entity ID", "Actor ID", "Details"];
        const rows = logs.map((l) => [
            new Date(l.CreatedAt).toISOString(),
            l.Action,
            l.EntityType,
            l.EntityID || "",
            l.ActorID || "",
            (l.Details || "").replace(/,/g, ";"),
        ]);
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-page-${page}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6 space-y-5 max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold">Audit Logs</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{total} total entries</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
                    <Download className="size-3.5" /> Export CSV
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Entity type" />
                    </SelectTrigger>
                    <SelectContent>
                        {ENTITY_TYPES.map((e) => <SelectItem key={e} value={e}>{e === "All" ? "All entities" : e}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                        {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a === "All" ? "All actions" : a}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>{[1, 2, 3, 4].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                            ))
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-16">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                                            <ScrollText className="size-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">No audit logs found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log, i) => (
                                <TableRow key={i}>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(log.CreatedAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{log.Action}</span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <span className="text-muted-foreground">{log.EntityType}</span>
                                        {log.EntityID && <span className="text-xs text-muted-foreground/60 ml-1">#{log.EntityID}</span>}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.Details || "—"}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} ({total} entries)
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
