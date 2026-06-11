import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPurchaseOrderThunk } from "@/store/purchaseOrderSlice.js";
import { fetchSuppliers } from "@/store/supplierSlice.js";
import { fetchWarehouses } from "@/store/warehouseSlice.js";
import { getSupplierProducts } from "@/lib/api.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const itemSchema = z.object({
    productId: z.string().min(1, "Product required"),
    quantity: z
        .string()
        .min(1)
        .refine((v) => Number(v) > 0, "Must be > 0"),
    unitCost: z
        .string()
        .min(1)
        .refine((v) => Number(v) >= 0, "Cannot be negative"),
});

const schema = z.object({
    supplierId: z.string().min(1, "Supplier required"),
    warehouseId: z.string().min(1, "Warehouse required"),
    items: z.array(itemSchema).min(1, "At least one item required"),
});

export default function PurchaseOrderFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { suppliers } = useSelector((s) => s.supplier);
    const { warehouses } = useSelector((s) => s.warehouse);
    const { loading } = useSelector((s) => s.purchaseOrder);
    const [supplierProducts, setSupplierProducts] = useState([]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            supplierId: "",
            warehouseId: "",
            items: [{ productId: "", quantity: "1", unitCost: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });
    const watchedSupplierId = watch("supplierId");
    const watchedItems = watch("items");

    useEffect(() => {
        dispatch(fetchSuppliers(id));
        dispatch(fetchWarehouses(id));
    }, [id, dispatch]);

    useEffect(() => {
        if (watchedSupplierId) {
            getSupplierProducts(watchedSupplierId, id)
                .then((d) => setSupplierProducts(d.products || []))
                .catch(() => setSupplierProducts([]));
        } else setSupplierProducts([]);
    }, [watchedSupplierId, id]);

    const grandTotal = watchedItems.reduce((sum, item) => {
        return (
            sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0)
        );
    }, 0);

    async function onSubmit(data) {
        const payload = {
            businessId: Number(id),
            supplierId: Number(data.supplierId),
            warehouseId: Number(data.warehouseId),
            items: data.items.map((it) => ({
                productId: Number(it.productId),
                quantity: Number(it.quantity),
                unitCost: Number(it.unitCost),
            })),
        };
        const r = await dispatch(createPurchaseOrderThunk(payload));
        if (!r.error) {
            toast.success("Purchase order created");
            navigate(`/business/${id}/purchase-orders`);
        } else toast.error(r.payload);
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => navigate(`/business/${id}/purchase-orders`)}
                >
                    <ArrowLeft className="size-4" /> Back
                </Button>
                <div>
                    <h1 className="text-xl font-bold">New Purchase Order</h1>
                    <p className="text-sm text-muted-foreground">
                        Create a purchase order from a supplier
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Order Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Supplier *</Label>
                                <Select
                                    value={watch("supplierId")}
                                    onValueChange={(v) => {
                                        setValue("supplierId", v);
                                        setValue("items", [
                                            {
                                                productId: "",
                                                quantity: "1",
                                                unitCost: "",
                                            },
                                        ]);
                                    }}
                                >
                                    <SelectTrigger
                                        className={
                                            errors.supplierId
                                                ? "border-destructive"
                                                : ""
                                        }
                                    >
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem
                                                key={s.SupplierID}
                                                value={String(s.SupplierID)}
                                            >
                                                {s.SupplierName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplierId && (
                                    <p className="text-xs text-destructive">
                                        {errors.supplierId.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Destination Warehouse *</Label>
                                <Select
                                    value={watch("warehouseId")}
                                    onValueChange={(v) =>
                                        setValue("warehouseId", v)
                                    }
                                >
                                    <SelectTrigger
                                        className={
                                            errors.warehouseId
                                                ? "border-destructive"
                                                : ""
                                        }
                                    >
                                        <SelectValue placeholder="Select warehouse" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                {errors.warehouseId && (
                                    <p className="text-xs text-destructive">
                                        {errors.warehouseId.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base">Line Items</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                append({
                                    productId: "",
                                    quantity: "1",
                                    unitCost: "",
                                })
                            }
                        >
                            <Plus className="size-3.5 mr-1" /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {errors.items?.root && (
                            <p className="text-xs text-destructive">
                                {errors.items.root.message}
                            </p>
                        )}
                        {!watchedSupplierId && (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                Select a supplier first to load available
                                products.
                            </p>
                        )}
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="grid grid-cols-[1fr_100px_110px_36px] gap-2 items-start"
                            >
                                <div className="space-y-1">
                                    <Select
                                        value={watch(
                                            `items.${index}.productId`,
                                        )}
                                        onValueChange={(v) =>
                                            setValue(
                                                `items.${index}.productId`,
                                                v,
                                            )
                                        }
                                        disabled={!watchedSupplierId}
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.items?.[index]?.productId
                                                    ? "border-destructive"
                                                    : ""
                                            }
                                        >
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {supplierProducts.map((p) => (
                                                <SelectItem
                                                    key={p.ProductID}
                                                    value={String(p.ProductID)}
                                                >
                                                    {p.ProductName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.items?.[index]?.productId && (
                                        <p className="text-xs text-destructive">
                                            Required
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Qty"
                                        {...register(`items.${index}.quantity`)}
                                        className={
                                            errors.items?.[index]?.quantity
                                                ? "border-destructive"
                                                : ""
                                        }
                                    />
                                    {errors.items?.[index]?.quantity && (
                                        <p className="text-xs text-destructive">
                                            Required
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Unit Cost"
                                        {...register(`items.${index}.unitCost`)}
                                        className={
                                            errors.items?.[index]?.unitCost
                                                ? "border-destructive"
                                                : ""
                                        }
                                    />
                                    {errors.items?.[index]?.unitCost && (
                                        <p className="text-xs text-destructive">
                                            Required
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 text-destructive hover:text-destructive mt-0.5"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                        <Separator className="my-2" />
                        <div className="flex justify-end">
                            <div className="text-right space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Grand Total
                                </p>
                                <p className="text-xl font-bold">
                                    ${grandTotal.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            navigate(`/business/${id}/purchase-orders`)
                        }
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating…" : "Create Purchase Order"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
