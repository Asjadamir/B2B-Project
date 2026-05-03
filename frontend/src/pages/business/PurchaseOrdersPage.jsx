import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPurchaseOrders, updatePurchaseOrderStatusThunk } from "@/store/purchaseOrderSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, XCircle, CheckCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { STATUS_COLORS } from "@/lib/constants";

export default function PurchaseOrdersPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { orders, loading } = useSelector((s) => s.purchaseOrder);
    const [statusFilter, setStatusFilter] = useState("all");
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => { dispatch(fetchPurchaseOrders(id)); }, [id, dispatch]);

    async function handleStatusUpdate(orderId, status) {
        const r = await dispatch(updatePurchaseOrderStatusThunk({ id: orderId, status }));
        if (!r.error) { setConfirmAction(null); toast.success(`Order marked as ${status}`); dispatch(fetchPurchaseOrders(id)); }
        else toast.error(r.payload);
    }

    const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.Status === statusFilter);

    return (
        <div className="p-6 space-y-5 max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold">Purchase Orders</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{orders.length} total order{orders.length !== 1 ? "s" : ""}</p>
                </div>
                <Button onClick={() => navigate(`/business/${id}/purchase-orders/new`)}>
                    <Plus className="size-4 mr-1.5" /> New Order
                </Button>
            </div>

            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                    <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
                    <TabsTrigger value="Pending">Pending ({orders.filter((o) => o.Status === "Pending").length})</TabsTrigger>
                    <TabsTrigger value="Received">Received ({orders.filter((o) => o.Status === "Received").length})</TabsTrigger>
                    <TabsTrigger value="Cancelled">Cancelled ({orders.filter((o) => o.Status === "Cancelled").length})</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO #</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-28" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [1, 2, 3].map((i) => (
                                <TableRow key={i}>
                                    {[1, 2, 3, 4, 5, 6, 7].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                                </TableRow>
                            ))
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-16">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                                            <ShoppingCart className="size-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">
                                            {orders.length === 0 ? "No purchase orders yet." : "No orders match the filter."}
                                        </p>
                                        {orders.length === 0 && (
                                            <Button size="sm" onClick={() => navigate(`/business/${id}/purchase-orders/new`)}>
                                                <Plus className="size-3.5 mr-1.5" /> Create first order
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((o) => (
                                <TableRow key={o.POID} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/business/${id}/purchase-orders/${o.POID}`)}>
                                    <TableCell className="font-mono text-sm font-medium">PO-{String(o.POID).padStart(4, "0")}</TableCell>
                                    <TableCell className="text-muted-foreground">{o.SupplierName || "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">{o.WarehouseName || "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(o.OrderDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right font-medium">${Number(o.TotalValue || 0).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge className={`text-xs ${STATUS_COLORS[o.Status]}`} variant="outline">{o.Status}</Badge>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="size-7" onClick={() => navigate(`/business/${id}/purchase-orders/${o.POID}`)}>
                                                <Eye className="size-3.5" />
                                            </Button>
                                            {o.Status === "Pending" && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="size-7 text-green-500 hover:text-green-600"
                                                        onClick={() => setConfirmAction({ id: o.POID, status: "Received", label: `PO-${String(o.POID).padStart(4, "0")}` })}>
                                                        <CheckCircle className="size-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive"
                                                        onClick={() => setConfirmAction({ id: o.POID, status: "Cancelled", label: `PO-${String(o.POID).padStart(4, "0")}` })}>
                                                        <XCircle className="size-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {confirmAction?.status === "Received" ? "Mark as Received" : "Cancel Order"}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmAction?.status === "Received"
                                ? `Mark ${confirmAction?.label} as received? This will update inventory levels.`
                                : `Cancel ${confirmAction?.label}? This cannot be undone.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={loading}>Cancel</Button>
                        <Button
                            variant={confirmAction?.status === "Cancelled" ? "destructive" : "default"}
                            onClick={() => handleStatusUpdate(confirmAction.id, confirmAction.status)}
                            disabled={loading}
                        >
                            {loading ? "Updating…" : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
