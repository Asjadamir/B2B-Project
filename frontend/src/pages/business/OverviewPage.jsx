import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/store/productSlice";
import { fetchPurchaseOrders } from "@/store/purchaseOrderSlice";
import { fetchSaleOrders } from "@/store/saleOrderSlice";
import { fetchEmployees } from "@/store/employeeSlice";
import { getAuditLogs } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShoppingCart, ClipboardList, Users, ArrowRight, Activity } from "lucide-react";
import { STATUS_COLORS } from "@/lib/constants";

function StatCard({ icon: Icon, label, value, sub, to, navigate }) {
    return (
        <Card className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => navigate(to)}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                    </div>
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="size-5 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function OverviewPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { products } = useSelector((s) => s.product);
    const { orders: poOrders, loading: poLoading } = useSelector((s) => s.purchaseOrder);
    const { orders: soOrders, loading: soLoading } = useSelector((s) => s.saleOrder);
    const { employees } = useSelector((s) => s.employee);
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(true);

    useEffect(() => {
        dispatch(fetchProducts(id));
        dispatch(fetchPurchaseOrders(id));
        dispatch(fetchSaleOrders(id));
        dispatch(fetchEmployees(id));
        getAuditLogs({ businessId: id, limit: 8 })
            .then((d) => setLogs(d.logs || []))
            .catch(() => {})
            .finally(() => setLogsLoading(false));
    }, [id, dispatch]);

    const pendingPO = poOrders.filter((o) => o.Status === "Pending").length;
    const pendingSO = soOrders.filter((o) => o.Status === "Pending").length;

    const base = `/business/${id}`;

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-xl font-bold">Overview</h1>
                <p className="text-sm text-muted-foreground mt-0.5">A snapshot of your business activity</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Package} label="Total Products" value={products.length} sub="in catalog" to={`${base}/products`} navigate={navigate} />
                <StatCard icon={ShoppingCart} label="Purchase Orders" value={pendingPO} sub="pending" to={`${base}/purchase-orders`} navigate={navigate} />
                <StatCard icon={ClipboardList} label="Sale Orders" value={pendingSO} sub="pending" to={`${base}/sale-orders`} navigate={navigate} />
                <StatCard icon={Users} label="Team Members" value={employees.length} sub="employees" to={`${base}/employees`} navigate={navigate} />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recent Purchase Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {poLoading ? (
                            [1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                        ) : poOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No purchase orders yet</p>
                        ) : (
                            poOrders.slice(0, 4).map((o) => (
                                <div key={o.POID} className="flex items-center justify-between py-1.5 text-sm">
                                    <span className="text-muted-foreground">PO #{o.POID}</span>
                                    <Badge className={`text-xs ${STATUS_COLORS[o.Status]}`} variant="outline">{o.Status}</Badge>
                                </div>
                            ))
                        )}
                        <Button variant="ghost" size="sm" className="w-full mt-1 gap-1" onClick={() => navigate(`${base}/purchase-orders`)}>
                            View all <ArrowRight className="size-3.5" />
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recent Sale Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {soLoading ? (
                            [1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                        ) : soOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No sale orders yet</p>
                        ) : (
                            soOrders.slice(0, 4).map((o) => (
                                <div key={o.SOID} className="flex items-center justify-between py-1.5 text-sm">
                                    <span className="text-muted-foreground truncate max-w-[140px]">{o.CustomerName || `SO #${o.SOID}`}</span>
                                    <Badge className={`text-xs ${STATUS_COLORS[o.Status]}`} variant="outline">{o.Status}</Badge>
                                </div>
                            ))
                        )}
                        <Button variant="ghost" size="sm" className="w-full mt-1 gap-1" onClick={() => navigate(`${base}/sale-orders`)}>
                            View all <ArrowRight className="size-3.5" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Audit log */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="size-4" /> Recent Activity
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate(`${base}/audit-logs`)}>
                        View all <ArrowRight className="size-3.5" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {logsLoading ? (
                        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                    ) : logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {logs.map((log, i) => (
                                <div key={i} className="py-2.5 flex items-start justify-between gap-2 text-sm">
                                    <div className="min-w-0">
                                        <span className="font-medium">{log.Action}</span>
                                        <span className="text-muted-foreground"> · {log.EntityType}</span>
                                        {log.Details && <p className="text-xs text-muted-foreground truncate mt-0.5">{log.Details}</p>}
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                        {new Date(log.CreatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
