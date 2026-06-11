import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    fetchProducts,
    createProductThunk,
    updateProductThunk,
    deleteProductThunk,
    linkSupplierThunk,
    unlinkSupplierThunk,
} from "@/store/productSlice.js";
import {
    fetchCategories,
    createCategoryThunk,
    updateCategoryThunk,
    deleteCategoryThunk,
} from "@/store/categorySlice";
import { fetchSuppliers } from "@/store/supplierSlice.js";
import { getProductById } from "@/lib/api.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs.jsx";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet.jsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Plus, Pencil, Trash2, Search, Package, Tag, X } from "lucide-react";
import { toast } from "sonner";

const productSchema = z.object({
    productName: z.string().min(2, "Name required"),
    sku: z.string().min(1, "SKU required"),
    categoryId: z.string().min(1, "Category required"),
    unitOfMeasure: z.string().min(1, "Unit required"),
    sellingPrice: z.string().min(1, "Price required"),
});

const categorySchema = z.object({
    categoryName: z.string().min(2, "Name must be at least 2 characters"),
});

function ProductSheet({
    open,
    onOpenChange,
    initial,
    businessId,
    categories,
    suppliers,
    linkedSuppliers,
    onLinkSupplier,
    onUnlinkSupplier,
    suppLinkLoading,
    onSubmit,
    loading,
}) {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            productName: "",
            sku: "",
            categoryId: "",
            unitOfMeasure: "pcs",
            sellingPrice: "",
        },
    });
    const categoryId = watch("categoryId");
    const [addSupValue, setAddSupValue] = useState("");

    useEffect(() => {
        reset(
            initial
                ? {
                      ...initial,
                      categoryId: String(initial.CategoryID || ""),
                      sellingPrice: String(initial.SellingPrice || ""),
                  }
                : {
                      productName: "",
                      sku: "",
                      categoryId: "",
                      unitOfMeasure: "pcs",
                      sellingPrice: "",
                  },
        );
        setAddSupValue("");
    }, [initial, open, reset]);

    const linkedIds = new Set(linkedSuppliers.map((s) => s.SupplierID));
    const availableSuppliers = suppliers.filter(
        (s) => !linkedIds.has(s.SupplierID),
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        {initial ? "Edit Product" : "Add Product"}
                    </SheetTitle>
                    <SheetDescription>
                        {initial
                            ? "Update product details."
                            : "Add a new product to your catalog."}
                    </SheetDescription>
                </SheetHeader>
                <form
                    onSubmit={handleSubmit((d) =>
                        onSubmit({
                            ...d,
                            businessId,
                            categoryId: Number(d.categoryId),
                            sellingPrice: Number(d.sellingPrice),
                        }),
                    )}
                    className="space-y-4 py-6"
                >
                    <div className="space-y-1.5">
                        <Label>Product Name *</Label>
                        <Input
                            placeholder="Widget Pro"
                            {...register("productName")}
                            className={
                                errors.productName ? "border-destructive" : ""
                            }
                        />
                        {errors.productName && (
                            <p className="text-xs text-destructive">
                                {errors.productName.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label>SKU *</Label>
                        <Input
                            placeholder="WGT-001"
                            {...register("sku")}
                            className={errors.sku ? "border-destructive" : ""}
                        />
                        {errors.sku && (
                            <p className="text-xs text-destructive">
                                {errors.sku.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Category *</Label>
                        <Select
                            value={categoryId}
                            onValueChange={(v) => setValue("categoryId", v)}
                        >
                            <SelectTrigger
                                className={
                                    errors.categoryId
                                        ? "border-destructive"
                                        : ""
                                }
                            >
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem
                                        key={c.CategoryID}
                                        value={String(c.CategoryID)}
                                    >
                                        {c.CategoryName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.categoryId && (
                            <p className="text-xs text-destructive">
                                {errors.categoryId.message}
                            </p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Unit of Measure *</Label>
                            <Input
                                placeholder="pcs"
                                {...register("unitOfMeasure")}
                                className={
                                    errors.unitOfMeasure
                                        ? "border-destructive"
                                        : ""
                                }
                            />
                            {errors.unitOfMeasure && (
                                <p className="text-xs text-destructive">
                                    {errors.unitOfMeasure.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Selling Price *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...register("sellingPrice")}
                                className={
                                    errors.sellingPrice
                                        ? "border-destructive"
                                        : ""
                                }
                            />
                            {errors.sellingPrice && (
                                <p className="text-xs text-destructive">
                                    {errors.sellingPrice.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {initial && (
                        <div className="space-y-3 border-t pt-4">
                            <Label>Linked Suppliers</Label>
                            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                                {linkedSuppliers.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        No suppliers linked yet.
                                    </p>
                                ) : (
                                    linkedSuppliers.map((s) => (
                                        <Badge
                                            key={s.SupplierID}
                                            variant="secondary"
                                            className="gap-1 pr-1"
                                        >
                                            {s.SupplierName}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onUnlinkSupplier(
                                                        s.SupplierID,
                                                    )
                                                }
                                                disabled={suppLinkLoading}
                                                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 disabled:opacity-50"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </Badge>
                                    ))
                                )}
                            </div>
                            {availableSuppliers.length > 0 && (
                                <div className="flex gap-2">
                                    <Select
                                        value={addSupValue}
                                        onValueChange={setAddSupValue}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Add a supplier…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSuppliers.map((s) => (
                                                <SelectItem
                                                    key={s.SupplierID}
                                                    value={String(s.SupplierID)}
                                                >
                                                    {s.SupplierName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={
                                            !addSupValue || suppLinkLoading
                                        }
                                        onClick={() => {
                                            onLinkSupplier(Number(addSupValue));
                                            setAddSupValue("");
                                        }}
                                    >
                                        <Plus className="size-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <SheetFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading
                                ? "Saving…"
                                : initial
                                  ? "Save changes"
                                  : "Add product"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function CategoryDialog({ open, onOpenChange, initial, onSubmit, loading }) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: { categoryName: "" },
    });
    useEffect(() => {
        reset({ categoryName: initial?.CategoryName || "" });
    }, [initial, open, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        {initial ? "Edit Category" : "New Category"}
                    </DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 py-1"
                >
                    <div className="space-y-1.5">
                        <Label>Category Name *</Label>
                        <Input
                            placeholder="Electronics"
                            {...register("categoryName")}
                            className={
                                errors.categoryName ? "border-destructive" : ""
                            }
                        />
                        {errors.categoryName && (
                            <p className="text-xs text-destructive">
                                {errors.categoryName.message}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving…" : initial ? "Save" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ProductsPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { products, loading: pLoading } = useSelector((s) => s.product);
    const { categories, loading: cLoading } = useSelector((s) => s.category);
    const { suppliers } = useSelector((s) => s.supplier);
    const { currentRole } = useSelector((s) => s.business);
    const canManage = currentRole === "Owner" || currentRole === "Manager";

    const [productSheetOpen, setProductSheetOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [deleteProduct, setDeleteProduct] = useState(null);
    const [catDialogOpen, setCatDialogOpen] = useState(false);
    const [editCat, setEditCat] = useState(null);
    const [deleteCat, setDeleteCat] = useState(null);
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("all");
    const [linkedSuppliers, setLinkedSuppliers] = useState([]);
    const [suppLinkLoading, setSuppLinkLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchProducts(id));
        dispatch(fetchCategories(id));
        dispatch(fetchSuppliers(id));
    }, [id, dispatch]);

    useEffect(() => {
        if (!editProduct) {
            setLinkedSuppliers([]);
            return;
        }
        getProductById(editProduct.ProductID)
            .then((data) => setLinkedSuppliers(data.product?.suppliers ?? []))
            .catch(() => setLinkedSuppliers([]));
    }, [editProduct]);

    async function handleCreateProduct(form) {
        const r = await dispatch(createProductThunk(form));
        if (!r.error) {
            setProductSheetOpen(false);
            dispatch(fetchProducts(id));
            toast.success("Product added");
        } else toast.error(r.payload);
    }

    async function handleUpdateProduct(form) {
        const r = await dispatch(
            updateProductThunk({
                id: editProduct.ProductID,
                data: { ...form, businessId: id },
            }),
        );
        if (!r.error) {
            setEditProduct(null);
            dispatch(fetchProducts(id));
            toast.success("Product updated");
        } else toast.error(r.payload);
    }

    async function handleLinkSupplier(supplierId) {
        setSuppLinkLoading(true);
        const r = await dispatch(
            linkSupplierThunk({ productId: editProduct.ProductID, supplierId }),
        );
        if (!r.error) {
            const sup = suppliers.find((s) => s.SupplierID === supplierId);
            if (sup) setLinkedSuppliers((prev) => [...prev, sup]);
            toast.success("Supplier linked");
        } else {
            toast.error(r.payload);
        }
        setSuppLinkLoading(false);
    }

    async function handleUnlinkSupplier(supplierId) {
        setSuppLinkLoading(true);
        const r = await dispatch(
            unlinkSupplierThunk({
                productId: editProduct.ProductID,
                supplierId,
            }),
        );
        if (!r.error) {
            setLinkedSuppliers((prev) =>
                prev.filter((s) => s.SupplierID !== supplierId),
            );
            toast.success("Supplier removed");
        } else {
            toast.error(r.payload);
        }
        setSuppLinkLoading(false);
    }

    async function handleDeleteProduct() {
        const r = await dispatch(deleteProductThunk(deleteProduct.ProductID));
        if (!r.error) {
            setDeleteProduct(null);
            toast.success("Product deleted");
        } else toast.error(r.payload);
    }

    async function handleCreateCat(form) {
        const r = await dispatch(
            createCategoryThunk({ ...form, businessId: id }),
        );
        if (!r.error) {
            setCatDialogOpen(false);
            dispatch(fetchCategories(id));
            toast.success("Category created");
        } else toast.error(r.payload);
    }

    async function handleUpdateCat(form) {
        const r = await dispatch(
            updateCategoryThunk({ id: editCat.CategoryID, data: form }),
        );
        if (!r.error) {
            setEditCat(null);
            toast.success("Category updated");
        } else toast.error(r.payload);
    }

    async function handleDeleteCat() {
        const r = await dispatch(deleteCategoryThunk(deleteCat.CategoryID));
        if (!r.error) {
            setDeleteCat(null);
            toast.success("Category deleted");
        } else toast.error(r.payload);
    }

    const catMap = Object.fromEntries(
        categories.map((c) => [c.CategoryID, c.CategoryName]),
    );

    const filteredProducts = products.filter((p) => {
        const matchSearch =
            p.ProductName.toLowerCase().includes(search.toLowerCase()) ||
            p.SKU.toLowerCase().includes(search.toLowerCase());
        const matchCat =
            filterCat === "all" || String(p.CategoryID) === filterCat;
        return matchSearch && matchCat;
    });

    return (
        <div className="p-6 space-y-5 max-w-5xl mx-auto">
            <h1 className="text-xl font-bold">Products & Categories</h1>

            <Tabs defaultValue="products">
                <TabsList>
                    <TabsTrigger value="products" className="gap-2">
                        <Package className="size-3.5" /> Products (
                        {products.length})
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-2">
                        <Tag className="size-3.5" /> Categories (
                        {categories.length})
                    </TabsTrigger>
                </TabsList>

                {/* Products tab */}
                <TabsContent value="products" className="space-y-4 mt-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products…"
                                    className="pl-9 w-52"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select
                                value={filterCat}
                                onValueChange={setFilterCat}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All categories
                                    </SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem
                                            key={c.CategoryID}
                                            value={String(c.CategoryID)}
                                        >
                                            {c.CategoryName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {canManage && (
                            <Button
                                onClick={() => setProductSheetOpen(true)}
                                className="shrink-0"
                            >
                                <Plus className="size-4 mr-1.5" /> Add Product
                            </Button>
                        )}
                    </div>

                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">
                                        Price
                                    </TableHead>
                                    <TableHead className="w-20" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pLoading ? (
                                    [1, 2, 3].map((i) => (
                                        <TableRow key={i}>
                                            {[1, 2, 3, 4, 5, 6].map((j) => (
                                                <TableCell key={j}>
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center py-12 text-muted-foreground"
                                        >
                                            {products.length === 0
                                                ? "No products yet. Add your first product."
                                                : "No products match your search."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((p) => (
                                        <TableRow key={p.ProductID}>
                                            <TableCell className="font-medium">
                                                {p.ProductName}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">
                                                {p.SKU}
                                            </TableCell>
                                            <TableCell>
                                                {catMap[p.CategoryID] ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {catMap[p.CategoryID]}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {p.UnitOfMeasure}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                $
                                                {Number(p.SellingPrice).toFixed(
                                                    2,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {canManage && (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7"
                                                            onClick={() =>
                                                                setEditProduct({
                                                                    ProductID:
                                                                        p.ProductID,
                                                                    productName:
                                                                        p.ProductName,
                                                                    sku: p.SKU,
                                                                    CategoryID:
                                                                        p.CategoryID,
                                                                    unitOfMeasure:
                                                                        p.UnitOfMeasure,
                                                                    SellingPrice:
                                                                        p.SellingPrice,
                                                                })
                                                            }
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                setDeleteProduct(
                                                                    p,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Categories tab */}
                <TabsContent value="categories" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {categories.length} categories
                        </p>
                        {canManage && (
                            <Button onClick={() => setCatDialogOpen(true)}>
                                <Plus className="size-4 mr-1.5" /> New Category
                            </Button>
                        )}
                    </div>

                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead className="w-20" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cLoading ? (
                                    [1, 2].map((i) => (
                                        <TableRow key={i}>
                                            {[1, 2, 3].map((j) => (
                                                <TableCell key={j}>
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="text-center py-12 text-muted-foreground"
                                        >
                                            No categories yet. Create one to get
                                            started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((c) => {
                                        const count = products.filter(
                                            (p) =>
                                                p.CategoryID === c.CategoryID,
                                        ).length;
                                        return (
                                            <TableRow key={c.CategoryID}>
                                                <TableCell className="font-medium">
                                                    {c.CategoryName}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {count} product
                                                        {count !== 1 ? "s" : ""}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {canManage && (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7"
                                                                onClick={() =>
                                                                    setEditCat(
                                                                        c,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 text-destructive hover:text-destructive"
                                                                onClick={() =>
                                                                    setDeleteCat(
                                                                        c,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <ProductSheet
                open={productSheetOpen}
                onOpenChange={setProductSheetOpen}
                initial={null}
                businessId={id}
                categories={categories}
                suppliers={suppliers}
                linkedSuppliers={[]}
                onLinkSupplier={() => {}}
                onUnlinkSupplier={() => {}}
                suppLinkLoading={false}
                onSubmit={handleCreateProduct}
                loading={pLoading}
            />
            <ProductSheet
                open={!!editProduct}
                onOpenChange={(v) => !v && setEditProduct(null)}
                initial={editProduct}
                businessId={id}
                categories={categories}
                suppliers={suppliers}
                linkedSuppliers={linkedSuppliers}
                onLinkSupplier={handleLinkSupplier}
                onUnlinkSupplier={handleUnlinkSupplier}
                suppLinkLoading={suppLinkLoading}
                onSubmit={handleUpdateProduct}
                loading={pLoading}
            />

            <CategoryDialog
                open={catDialogOpen}
                onOpenChange={setCatDialogOpen}
                initial={null}
                onSubmit={handleCreateCat}
                loading={cLoading}
            />
            <CategoryDialog
                open={!!editCat}
                onOpenChange={(v) => !v && setEditCat(null)}
                initial={editCat}
                onSubmit={handleUpdateCat}
                loading={cLoading}
            />

            <Dialog
                open={!!deleteProduct}
                onOpenChange={(v) => !v && setDeleteProduct(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Delete{" "}
                            <span className="font-medium text-foreground">
                                {deleteProduct?.ProductName}
                            </span>
                            ? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteProduct(null)}
                            disabled={pLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProduct}
                            disabled={pLoading}
                        >
                            {pLoading ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!deleteCat}
                onOpenChange={(v) => !v && setDeleteCat(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Delete{" "}
                            <span className="font-medium text-foreground">
                                {deleteCat?.CategoryName}
                            </span>
                            ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteCat(null)}
                            disabled={cLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCat}
                            disabled={cLoading}
                        >
                            {cLoading ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
