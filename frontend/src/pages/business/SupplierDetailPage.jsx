import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "@/lib/api.js";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { ArrowLeft, Plus, Unlink, Package, Search } from "lucide-react";
import { toast } from "sonner";

export default function SupplierDetailPage() {
    const { id: businessId, supplierId } = useParams();
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState(null);
    const [linked, setLinked] = useState([]);
    const [unlinked, setUnlinked] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [unlinkedLoading, setUnlinkedLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [addSearch, setAddSearch] = useState("");

    async function load() {
        setLoading(true);
        try {
            const [supRes, prodRes] = await Promise.all([
                api.getSupplierById(supplierId),
                api.getSupplierLinkedProducts(supplierId, businessId),
            ]);
            setSupplier(supRes.supplier);
            setLinked(prodRes.products);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadUnlinked() {
        setUnlinkedLoading(true);
        try {
            const res = await api.getSupplierUnlinkedProducts(
                supplierId,
                businessId,
            );
            setUnlinked(res.products);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setUnlinkedLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [supplierId, businessId]);

    async function handleDetach(productId, productName) {
        setActionLoading(true);
        try {
            await api.unlinkProductSupplier(productId, supplierId);
            toast.success(`"${productName}" detached`);
            await load();
            if (addOpen) loadUnlinked();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleAttach(productId, productName) {
        setActionLoading(true);
        try {
            await api.linkProductSupplier(productId, {
                supplierId: Number(supplierId),
            });
            toast.success(`"${productName}" attached`);
            await load();
            loadUnlinked();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setActionLoading(false);
        }
    }

    function openAddDialog() {
        setAddSearch("");
        loadUnlinked();
        setAddOpen(true);
    }

    const filteredLinked = linked.filter(
        (p) =>
            p.ProductName.toLowerCase().includes(search.toLowerCase()) ||
            p.SKU.toLowerCase().includes(search.toLowerCase()),
    );

    const filteredUnlinked = unlinked.filter(
        (p) =>
            p.ProductName.toLowerCase().includes(addSearch.toLowerCase()) ||
            p.SKU.toLowerCase().includes(addSearch.toLowerCase()),
    );

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() =>
                        navigate(`/business/${businessId}/suppliers`)
                    }
                >
                    <ArrowLeft className="size-4" />
                </Button>
                {loading ? (
                    <Skeleton className="h-7 w-48" />
                ) : (
                    <div>
                        <h1 className="text-xl font-bold">
                            {supplier?.SupplierName}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {supplier?.Email && (
                                <span className="mr-3">{supplier.Email}</span>
                            )}
                            {supplier?.ContactNumber && (
                                <span>{supplier.ContactNumber}</span>
                            )}
                        </p>
                    </div>
                )}
            </div>

            {/* Linked products */}
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-semibold">
                            Linked Products
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {linked.length} product
                            {linked.length !== 1 ? "s" : ""} attached
                        </p>
                    </div>
                    <Button size="sm" onClick={openAddDialog}>
                        <Plus className="size-3.5 mr-1.5" /> Add Products
                    </Button>
                </div>

                {linked.length > 3 && (
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search products…"
                            className="pl-9 h-8 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                )}

                <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map((i) => (
                                    <TableRow key={i}>
                                        {[1, 2, 3, 4, 5].map((j) => (
                                            <TableCell key={j}>
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredLinked.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-12"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                                                <Package className="size-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {linked.length === 0
                                                    ? "No products linked yet."
                                                    : "No products match the search."}
                                            </p>
                                            {linked.length === 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={openAddDialog}
                                                >
                                                    <Plus className="size-3.5 mr-1.5" />{" "}
                                                    Add first product
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLinked.map((p) => (
                                    <TableRow key={p.ProductID}>
                                        <TableCell className="font-medium">
                                            {p.ProductName}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="font-mono text-xs"
                                            >
                                                {p.SKU}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {p.CategoryName}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {p.UnitOfMeasure}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                                disabled={actionLoading}
                                                onClick={() =>
                                                    handleDetach(
                                                        p.ProductID,
                                                        p.ProductName,
                                                    )
                                                }
                                            >
                                                <Unlink className="size-3 mr-1" />{" "}
                                                Detach
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add products dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            Add Products to {supplier?.SupplierName}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search products…"
                            className="pl-9 h-8 text-sm"
                            value={addSearch}
                            onChange={(e) => setAddSearch(e.target.value)}
                        />
                    </div>

                    <div className="rounded-lg border border-border overflow-hidden max-h-80 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="w-20" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {unlinkedLoading ? (
                                    [1, 2, 3].map((i) => (
                                        <TableRow key={i}>
                                            {[1, 2, 3, 4].map((j) => (
                                                <TableCell key={j}>
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filteredUnlinked.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center py-8 text-sm text-muted-foreground"
                                        >
                                            {unlinked.length === 0
                                                ? "All products are already linked."
                                                : "No products match the search."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUnlinked.map((p) => (
                                        <TableRow key={p.ProductID}>
                                            <TableCell className="font-medium">
                                                {p.ProductName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="font-mono text-xs"
                                                >
                                                    {p.SKU}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {p.CategoryName}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs text-green-600 hover:text-green-700"
                                                    disabled={actionLoading}
                                                    onClick={() =>
                                                        handleAttach(
                                                            p.ProductID,
                                                            p.ProductName,
                                                        )
                                                    }
                                                >
                                                    <Plus className="size-3 mr-1" />{" "}
                                                    Attach
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
