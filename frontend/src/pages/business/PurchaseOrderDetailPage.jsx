import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPurchaseOrderById, updatePurchaseOrderStatusThunk, clearCurrentOrder } from "@/store/purchaseOrderSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { STATUS_COLORS } from "@/lib/constants";

export default function PurchaseOrderDetailPage() {
    const { id, poId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentOrder: order, loading } = useSelector((s) => s.purchaseOrder);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        dispatch(fetchPurchaseOrderById(poId));
        return () => dispatch(clearCurrentOrder());
    }, [poId, dispatch]);

    async function handleStatusUpdate(status) {
        const r = await dispatch(updatePurchaseOrderStatusThunk({ id: poId, status }));
        if (!r.error) { setConfirmAction(null); toast.success(`Order marked as ${status}`); dispatch(fetchPurchaseOrderById(poId)); }
        else toast.error(r.payload);
    }

    if (loading && !order) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-60 w-full" />
            </div>
        );
    }

    if (!order) return <div className="p-6 text-muted-foreground">Order not found.</div>;

    const items = order.items || [];
    const total = items.reduce((s, i) => s + Number(i.Quantity) * Number(i.UnitCost), 0);

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate(`/business/${id}/purchase-orders`)}>
                    <ArrowLeft className="size-4" /> Back
                </Button>
                <div className="flex-1 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">PO-{String(order.POID).padStart(4, "0")}</h1>
                        <p className="text-sm text-muted-foreground">Created {new Date(order.CreatedAt).toLocaleDateString()}</p>
                    </div>
                    <Badge className={`${STATUS_COLORS[order.Status]}`} variant="outline">{order.Status}</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Supplier</p>
                        <p className="font-medium text-sm">{order.SupplierName || "—"}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Warehouse</p>
                        <p className="font-medium text-sm">{order.WarehouseName || "—"}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Amount</p>
                        <p className="font-bold text-lg">${total.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Unit Cost</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No items</TableCell></TableRow>
                            ) : (
                                items.map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{item.ProductName || `Product #${item.ProductID}`}</TableCell>
                                        <TableCell className="text-right">{item.Quantity}</TableCell>
                                        <TableCell className="text-right">${Number(item.UnitCost).toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">${(Number(item.Quantity) * Number(item.UnitCost)).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <Separator />
                    <div className="p-4 flex justify-end">
                        <div className="text-right space-y-1">
                            <p className="text-sm text-muted-foreground">Grand Total</p>
                            <p className="text-xl font-bold">${total.toFixed(2)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {order.Status === "Pending" && (
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setConfirmAction("Cancelled")}>
                        <XCircle className="size-4" /> Cancel Order
                    </Button>
                    <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => setConfirmAction("Received")}>
                        <CheckCircle className="size-4" /> Mark as Received
                    </Button>
                </div>
            )}

            <Dialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{confirmAction === "Received" ? "Mark as Received" : "Cancel Order"}</DialogTitle>
                        <DialogDescription>
                            {confirmAction === "Received"
                                ? "This will update inventory levels in the destination warehouse."
                                : "This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={loading}>Cancel</Button>
                        <Button
                            variant={confirmAction === "Cancelled" ? "destructive" : "default"}
                            className={confirmAction === "Received" ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={() => handleStatusUpdate(confirmAction)}
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
