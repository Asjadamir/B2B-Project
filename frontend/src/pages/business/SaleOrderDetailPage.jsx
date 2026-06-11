import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchSaleOrderById,
    updateSaleOrderStatusThunk,
    clearCurrentSaleOrder,
} from "@/store/saleOrderSlice.js";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.jsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    User,
    Phone,
    MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { STATUS_COLORS } from "@/lib/constants.js";

export default function SaleOrderDetailPage() {
    const { id, soId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentOrder: order, loading } = useSelector((s) => s.saleOrder);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        dispatch(fetchSaleOrderById(soId));
        return () => dispatch(clearCurrentSaleOrder());
    }, [soId, dispatch]);

    async function handleStatusUpdate(status) {
        const r = await dispatch(
            updateSaleOrderStatusThunk({ id: soId, status }),
        );
        if (!r.error) {
            setConfirmAction(null);
            toast.success(`Order marked as ${status}`);
            dispatch(fetchSaleOrderById(soId));
        } else toast.error(r.payload);
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

    if (!order)
        return (
            <div className="p-6 text-muted-foreground">Order not found.</div>
        );

    const items = order.items || [];
    const total = items.reduce(
        (s, i) => s + Number(i.Quantity) * Number(i.UnitPrice),
        0,
    );

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => navigate(`/business/${id}/sale-orders`)}
                >
                    <ArrowLeft className="size-4" /> Back
                </Button>
                <div className="flex-1 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">
                            SO-{String(order.SOID).padStart(4, "0")}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Created{" "}
                            {new Date(order.CreatedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <Badge
                        className={`${STATUS_COLORS[order.Status]}`}
                        variant="outline"
                    >
                        {order.Status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Customer
                        </p>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="size-3.5 text-muted-foreground" />
                                <span className="font-medium">
                                    {order.CustomerName}
                                </span>
                            </div>
                            {order.CustomerContact && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="size-3.5" />{" "}
                                    {order.CustomerContact}
                                </div>
                            )}
                            {order.CustomerAddress && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="size-3.5" />{" "}
                                    {order.CustomerAddress}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Order Info
                        </p>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Warehouse
                                </span>
                                <span className="font-medium">
                                    {order.WarehouseName || "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Total Amount
                                </span>
                                <span className="font-bold text-base">
                                    ${total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Line Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">
                                    Qty
                                </TableHead>
                                <TableHead className="text-right">
                                    Unit Price
                                </TableHead>
                                <TableHead className="text-right">
                                    Subtotal
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No items
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">
                                            {item.ProductName ||
                                                `Product #${item.ProductID}`}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.Quantity}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${Number(item.UnitPrice).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            $
                                            {(
                                                Number(item.Quantity) *
                                                Number(item.UnitPrice)
                                            ).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <Separator />
                    <div className="p-4 flex justify-end">
                        <div className="text-right space-y-1">
                            <p className="text-sm text-muted-foreground">
                                Grand Total
                            </p>
                            <p className="text-xl font-bold">
                                ${total.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {order.Status === "Pending" && (
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
                        onClick={() => setConfirmAction("Cancelled")}
                    >
                        <XCircle className="size-4" /> Cancel Order
                    </Button>
                    <Button
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setConfirmAction("Fulfilled")}
                    >
                        <CheckCircle className="size-4" /> Mark as Fulfilled
                    </Button>
                </div>
            )}

            <Dialog
                open={!!confirmAction}
                onOpenChange={(v) => !v && setConfirmAction(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {confirmAction === "Fulfilled"
                                ? "Fulfill Order"
                                : "Cancel Order"}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmAction === "Fulfilled"
                                ? "This will deduct the ordered quantities from warehouse inventory."
                                : "This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmAction(null)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={
                                confirmAction === "Cancelled"
                                    ? "destructive"
                                    : "default"
                            }
                            className={
                                confirmAction === "Fulfilled"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                            }
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
