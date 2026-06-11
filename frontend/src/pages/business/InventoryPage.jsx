import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import * as api from "@/lib/api.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import {
    Search,
    SlidersHorizontal,
    ArrowLeftRight,
    ChevronRight,
    ChevronDown,
    PackageOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.js";

function StockBadge({ qty, threshold }) {
    if (qty === 0)
        return (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
                Out of Stock
            </span>
        );
    if (qty <= threshold)
        return (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                Low Stock
            </span>
        );
    return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
            In Stock
        </span>
    );
}

function GroupBadge({ warehouses }) {
    const hasOut = warehouses.every((w) => w.Quantity === 0);
    const hasLow =
        !hasOut &&
        warehouses.some(
            (w) => w.Quantity === 0 || w.Quantity <= w.LowStockThreshold,
        );
    if (hasOut)
        return (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
                Out of Stock
            </span>
        );
    if (hasLow)
        return (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                Has Low Stock
            </span>
        );
    return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
            In Stock
        </span>
    );
}

function ActionButtons({ row, onAdjust, onTransfer }) {
    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                    e.stopPropagation();
                    onAdjust(row);
                }}
            >
                <SlidersHorizontal className="size-3 mr-1" /> Adjust
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                    e.stopPropagation();
                    onTransfer(row);
                }}
            >
                <ArrowLeftRight className="size-3 mr-1" /> Transfer
            </Button>
        </div>
    );
}

export default function InventoryPage() {
    const { id: businessId } = useParams();
    const { currentRole } = useSelector((s) => s.business);
    const canManage = currentRole === "Owner" || currentRole === "Manager";

    const [inventory, setInventory] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWarehouse, setSelectedWarehouse] = useState("all");
    const [search, setSearch] = useState("");
    const [expandedIds, setExpandedIds] = useState(new Set());

    const [adjustTarget, setAdjustTarget] = useState(null);
    const [adjustQty, setAdjustQty] = useState("");
    const [adjustLoading, setAdjustLoading] = useState(false);

    const [transferTarget, setTransferTarget] = useState(null);
    const [transferToWH, setTransferToWH] = useState("");
    const [transferQty, setTransferQty] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const [invRes, whRes] = await Promise.all([
                api.getInventory(businessId),
                api.getWarehouses(businessId),
            ]);
            setInventory(invRes.inventory || []);
            setWarehouses(whRes.warehouses || []);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [businessId]);

    const grouped = useMemo(() => {
        const map = {};
        inventory.forEach((row) => {
            if (!map[row.ProductID]) {
                map[row.ProductID] = {
                    ProductID: row.ProductID,
                    ProductName: row.ProductName,
                    SKU: row.SKU,
                    CategoryName: row.CategoryName,
                    UnitOfMeasure: row.UnitOfMeasure,
                    totalStock: 0,
                    warehouses: [],
                };
            }
            map[row.ProductID].totalStock += row.Quantity;
            map[row.ProductID].warehouses.push(row);
        });
        return Object.values(map);
    }, [inventory]);

    const searchLower = search.toLowerCase();

    const displayGrouped = useMemo(
        () =>
            grouped.filter(
                (g) =>
                    g.ProductName.toLowerCase().includes(searchLower) ||
                    g.SKU.toLowerCase().includes(searchLower),
            ),
        [grouped, searchLower],
    );

    const displayFlat = useMemo(
        () =>
            inventory.filter(
                (row) =>
                    row.WarehouseID === Number(selectedWarehouse) &&
                    (row.ProductName.toLowerCase().includes(searchLower) ||
                        row.SKU.toLowerCase().includes(searchLower)),
            ),
        [inventory, selectedWarehouse, searchLower],
    );

    function toggleExpand(productId) {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            next.has(productId) ? next.delete(productId) : next.add(productId);
            return next;
        });
    }

    function openAdjust(row) {
        setAdjustTarget(row);
        setAdjustQty(String(row.Quantity));
    }

    function openTransfer(row) {
        setTransferTarget(row);
        setTransferToWH("");
        setTransferQty("");
    }

    async function handleAdjust() {
        const qty = Number(adjustQty);
        if (isNaN(qty) || qty < 0) {
            toast.error("Enter a valid quantity (≥ 0)");
            return;
        }
        setAdjustLoading(true);
        try {
            await api.adjustInventory({
                businessId: Number(businessId),
                warehouseId: adjustTarget.WarehouseID,
                productId: adjustTarget.ProductID,
                newQuantity: qty,
            });
            toast.success("Stock adjusted");
            setAdjustTarget(null);
            await load();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setAdjustLoading(false);
        }
    }

    async function handleTransfer() {
        const qty = Number(transferQty);
        if (!transferToWH) {
            toast.error("Select a destination warehouse");
            return;
        }
        if (isNaN(qty) || qty <= 0) {
            toast.error("Enter a valid quantity (> 0)");
            return;
        }
        if (qty > transferTarget.Quantity) {
            toast.error(`Only ${transferTarget.Quantity} units available`);
            return;
        }
        setTransferLoading(true);
        try {
            await api.transferInventory({
                businessId: Number(businessId),
                fromWarehouseId: transferTarget.WarehouseID,
                toWarehouseId: Number(transferToWH),
                productId: transferTarget.ProductID,
                quantity: qty,
            });
            toast.success("Stock transferred");
            setTransferTarget(null);
            await load();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setTransferLoading(false);
        }
    }

    const isAllView = selectedWarehouse === "all";
    const totalProducts = grouped.length;
    const totalUnits = inventory.reduce((s, r) => s + r.Quantity, 0);

    return (
        <div className="p-6 space-y-5 max-w-6xl mx-auto">
            <div>
                <h1 className="text-xl font-bold">Inventory</h1>
                {!loading && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {totalProducts} product{totalProducts !== 1 ? "s" : ""}{" "}
                        · {totalUnits} total units across {warehouses.length}{" "}
                        warehouse{warehouses.length !== 1 ? "s" : ""}
                    </p>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <Select
                    value={selectedWarehouse}
                    onValueChange={(v) => {
                        setSelectedWarehouse(v);
                        setExpandedIds(new Set());
                    }}
                >
                    <SelectTrigger className="w-52">
                        <SelectValue placeholder="All Warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Warehouses</SelectItem>
                        {warehouses.map((w) => (
                            <SelectItem
                                key={w.WarehouseID}
                                value={String(w.WarehouseID)}
                            >
                                {w.WarehouseName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search products…"
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
                {isAllView ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8" />
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">
                                    Total Stock
                                </TableHead>
                                <TableHead>Warehouses</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4].map((i) => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                            <TableCell key={j}>
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : displayGrouped.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center py-16"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                                                <PackageOpen className="size-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {inventory.length === 0
                                                    ? "No inventory yet. Receive a purchase order to add stock."
                                                    : "No products match the search."}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayGrouped.flatMap((g) => {
                                    const multiWH = g.warehouses.length > 1;
                                    const expanded = expandedIds.has(
                                        g.ProductID,
                                    );
                                    const rows = [];

                                    rows.push(
                                        <TableRow
                                            key={`group-${g.ProductID}`}
                                            className={cn(
                                                multiWH &&
                                                    "cursor-pointer hover:bg-muted/40",
                                                expanded && "bg-muted/20",
                                            )}
                                            onClick={() =>
                                                multiWH &&
                                                toggleExpand(g.ProductID)
                                            }
                                        >
                                            <TableCell className="py-2 w-8">
                                                {multiWH ? (
                                                    expanded ? (
                                                        <ChevronDown className="size-3.5 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="size-3.5 text-muted-foreground" />
                                                    )
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {g.ProductName}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {g.SKU}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {g.CategoryName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {g.totalStock}{" "}
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    {g.UnitOfMeasure}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {multiWH
                                                    ? g.warehouses
                                                          .map(
                                                              (w) =>
                                                                  `${w.WarehouseName}: ${w.Quantity}`,
                                                          )
                                                          .join(" · ")
                                                    : g.warehouses[0]
                                                          .WarehouseName}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {multiWH ? (
                                                        <GroupBadge
                                                            warehouses={
                                                                g.warehouses
                                                            }
                                                        />
                                                    ) : (
                                                        <StockBadge
                                                            qty={
                                                                g.warehouses[0]
                                                                    .Quantity
                                                            }
                                                            threshold={
                                                                g.warehouses[0]
                                                                    .LowStockThreshold
                                                            }
                                                        />
                                                    )}
                                                    {!multiWH && canManage && (
                                                        <ActionButtons
                                                            row={
                                                                g.warehouses[0]
                                                            }
                                                            onAdjust={
                                                                openAdjust
                                                            }
                                                            onTransfer={
                                                                openTransfer
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>,
                                    );

                                    if (multiWH && expanded) {
                                        g.warehouses.forEach((w) => {
                                            rows.push(
                                                <TableRow
                                                    key={`wh-${g.ProductID}-${w.WarehouseID}`}
                                                    className="bg-muted/10"
                                                >
                                                    <TableCell />
                                                    <TableCell
                                                        colSpan={2}
                                                        className="text-sm text-muted-foreground pl-6"
                                                    >
                                                        ↳ {w.WarehouseName}
                                                    </TableCell>
                                                    <TableCell />
                                                    <TableCell className="text-right font-medium">
                                                        {w.Quantity}{" "}
                                                        <span className="text-xs font-normal text-muted-foreground">
                                                            {g.UnitOfMeasure}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        threshold:{" "}
                                                        {w.LowStockThreshold}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <StockBadge
                                                                qty={w.Quantity}
                                                                threshold={
                                                                    w.LowStockThreshold
                                                                }
                                                            />
                                                            {canManage && (
                                                                <ActionButtons
                                                                    row={w}
                                                                    onAdjust={
                                                                        openAdjust
                                                                    }
                                                                    onTransfer={
                                                                        openTransfer
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>,
                                            );
                                        });
                                    }

                                    return rows;
                                })
                            )}
                        </TableBody>
                    </Table>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">
                                    Stock
                                </TableHead>
                                <TableHead className="text-right">
                                    Threshold
                                </TableHead>
                                <TableHead>Status</TableHead>
                                {canManage && <TableHead className="w-36" />}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4].map((i) => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5, 6].map((j) => (
                                            <TableCell key={j}>
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : displayFlat.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={canManage ? 7 : 6}
                                        className="text-center py-16"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                                                <PackageOpen className="size-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {inventory.filter(
                                                    (r) =>
                                                        r.WarehouseID ===
                                                        Number(
                                                            selectedWarehouse,
                                                        ),
                                                ).length === 0
                                                    ? "No stock in this warehouse yet."
                                                    : "No products match the search."}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayFlat.map((row) => (
                                    <TableRow
                                        key={`${row.ProductID}-${row.WarehouseID}`}
                                    >
                                        <TableCell className="font-medium">
                                            {row.ProductName}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {row.SKU}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {row.CategoryName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {row.Quantity}{" "}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {row.UnitOfMeasure}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {row.LowStockThreshold}
                                        </TableCell>
                                        <TableCell>
                                            <StockBadge
                                                qty={row.Quantity}
                                                threshold={
                                                    row.LowStockThreshold
                                                }
                                            />
                                        </TableCell>
                                        {canManage && (
                                            <TableCell>
                                                <ActionButtons
                                                    row={row}
                                                    onAdjust={openAdjust}
                                                    onTransfer={openTransfer}
                                                />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Adjust Dialog */}
            <Dialog
                open={!!adjustTarget}
                onOpenChange={(v) => !v && setAdjustTarget(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Adjust Stock</DialogTitle>
                        <DialogDescription>
                            Set the new stock count for{" "}
                            <span className="font-medium text-foreground">
                                {adjustTarget?.ProductName}
                            </span>{" "}
                            in{" "}
                            <span className="font-medium text-foreground">
                                {adjustTarget?.WarehouseName}
                            </span>
                            .
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Current stock
                            </span>
                            <span className="font-medium">
                                {adjustTarget?.Quantity}
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            <Label>New quantity</Label>
                            <Input
                                type="number"
                                min="0"
                                value={adjustQty}
                                onChange={(e) => setAdjustQty(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAdjustTarget(null)}
                            disabled={adjustLoading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAdjust} disabled={adjustLoading}>
                            {adjustLoading ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transfer Dialog */}
            <Dialog
                open={!!transferTarget}
                onOpenChange={(v) => !v && setTransferTarget(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Transfer Stock</DialogTitle>
                        <DialogDescription>
                            Move{" "}
                            <span className="font-medium text-foreground">
                                {transferTarget?.ProductName}
                            </span>{" "}
                            from{" "}
                            <span className="font-medium text-foreground">
                                {transferTarget?.WarehouseName}
                            </span>{" "}
                            to another warehouse.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Available in source
                            </span>
                            <span className="font-medium">
                                {transferTarget?.Quantity} units
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Destination warehouse</Label>
                            <Select
                                value={transferToWH}
                                onValueChange={setTransferToWH}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses
                                        .filter(
                                            (w) =>
                                                w.WarehouseID !==
                                                transferTarget?.WarehouseID,
                                        )
                                        .map((w) => (
                                            <SelectItem
                                                key={w.WarehouseID}
                                                value={String(w.WarehouseID)}
                                            >
                                                {w.WarehouseName}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Quantity to transfer</Label>
                            <Input
                                type="number"
                                min="1"
                                max={transferTarget?.Quantity}
                                value={transferQty}
                                onChange={(e) => setTransferQty(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setTransferTarget(null)}
                            disabled={transferLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={transferLoading}
                        >
                            {transferLoading ? "Transferring…" : "Transfer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
