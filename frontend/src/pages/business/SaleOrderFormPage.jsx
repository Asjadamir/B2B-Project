import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createSaleOrderThunk } from "@/store/saleOrderSlice";
import { fetchWarehouses } from "@/store/warehouseSlice";
import { getWarehouseProducts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const itemSchema = z.object({
    productId: z.string().min(1, "Product required"),
    quantity: z.string().min(1).refine((v) => Number(v) > 0, "Must be > 0"),
    unitPrice: z.string().min(1).refine((v) => Number(v) >= 0, "Cannot be negative"),
});

const schema = z.object({
    warehouseId: z.string().min(1, "Warehouse required"),
    customerName: z.string().min(2, "Customer name required"),
    customerContact: z.string().optional(),
    customerAddress: z.string().optional(),
    items: z.array(itemSchema).min(1, "At least one item required"),
});

export default function SaleOrderFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { warehouses } = useSelector((s) => s.warehouse);
    const { loading } = useSelector((s) => s.saleOrder);
    const [warehouseProducts, setWarehouseProducts] = useState([]);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            warehouseId: "",
            customerName: "",
            customerContact: "",
            customerAddress: "",
            items: [{ productId: "", quantity: "1", unitPrice: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const watchedWarehouseId = watch("warehouseId");
    const watchedItems = watch("items");

    useEffect(() => { dispatch(fetchWarehouses(id)); }, [id, dispatch]);

    useEffect(() => {
        if (watchedWarehouseId) {
            getWarehouseProducts(watchedWarehouseId, id)
                .then((d) => setWarehouseProducts(d.products || []))
                .catch(() => setWarehouseProducts([]));
        } else setWarehouseProducts([]);
    }, [watchedWarehouseId, id]);

    const grandTotal = watchedItems.reduce((sum, item) => {
        return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }, 0);

    async function onSubmit(data) {
        const payload = {
            businessId: Number(id),
            warehouseId: Number(data.warehouseId),
            customerName: data.customerName,
            customerContact: data.customerContact || undefined,
            customerAddress: data.customerAddress || undefined,
            items: data.items.map((it) => ({
                productId: Number(it.productId),
                quantity: Number(it.quantity),
                unitPrice: Number(it.unitPrice),
            })),
        };
        const r = await dispatch(createSaleOrderThunk(payload));
        if (!r.error) {
            toast.success("Sale order created");
            navigate(`/business/${id}/sale-orders`);
        } else toast.error(r.payload);
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate(`/business/${id}/sale-orders`)}>
                    <ArrowLeft className="size-4" /> Back
                </Button>
                <div>
                    <h1 className="text-xl font-bold">New Sale Order</h1>
                    <p className="text-sm text-muted-foreground">Create a sale order for a customer</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Source Warehouse *</Label>
                            <Select value={watch("warehouseId")} onValueChange={(v) => { setValue("warehouseId", v); setValue("items", [{ productId: "", quantity: "1", unitPrice: "" }]); }}>
                                <SelectTrigger className={errors.warehouseId ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((w) => (
                                        <SelectItem key={w.WarehouseID} value={String(w.WarehouseID)}>{w.WarehouseName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.warehouseId && <p className="text-xs text-destructive">{errors.warehouseId.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Customer Name *</Label>
                                <Input placeholder="Acme Corp" {...register("customerName")} className={errors.customerName ? "border-destructive" : ""} />
                                {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Customer Contact</Label>
                                <Input placeholder="+1 234 567 8900" {...register("customerContact")} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Customer Address</Label>
                            <Input placeholder="123 Main St, City" {...register("customerAddress")} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base">Line Items</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantity: "1", unitPrice: "" })}>
                            <Plus className="size-3.5 mr-1" /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {errors.items?.root && <p className="text-xs text-destructive">{errors.items.root.message}</p>}
                        {!watchedWarehouseId && (
                            <p className="text-sm text-muted-foreground py-4 text-center">Select a warehouse first to load available products.</p>
                        )}
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-[1fr_100px_110px_36px] gap-2 items-start">
                                <div className="space-y-1">
                                    <Select
                                        value={watch(`items.${index}.productId`)}
                                        onValueChange={(v) => {
                                            setValue(`items.${index}.productId`, v);
                                            const product = warehouseProducts.find((p) => String(p.ProductID) === v);
                                            if (product?.SellingPrice != null) {
                                                setValue(`items.${index}.unitPrice`, String(Number(product.SellingPrice).toFixed(2)));
                                            }
                                        }}
                                        disabled={!watchedWarehouseId}
                                    >
                                        <SelectTrigger className={errors.items?.[index]?.productId ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {warehouseProducts.map((p) => (
                                                <SelectItem key={p.ProductID} value={String(p.ProductID)}>
                                                    {p.ProductName} {p.AvailableStock !== undefined ? `(${p.AvailableStock} in stock)` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.items?.[index]?.productId && <p className="text-xs text-destructive">Required</p>}
                                </div>
                                <div className="space-y-1">
                                    <Input type="number" min="1" placeholder="Qty" {...register(`items.${index}.quantity`)} className={errors.items?.[index]?.quantity ? "border-destructive" : ""} />
                                    {errors.items?.[index]?.quantity && <p className="text-xs text-destructive">Required</p>}
                                </div>
                                <div className="space-y-1">
                                    <Input type="number" min="0" step="0.01" placeholder="Unit Price" {...register(`items.${index}.unitPrice`)} className={errors.items?.[index]?.unitPrice ? "border-destructive" : ""} />
                                    {errors.items?.[index]?.unitPrice && <p className="text-xs text-destructive">Required</p>}
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="size-9 text-destructive hover:text-destructive mt-0.5" onClick={() => remove(index)} disabled={fields.length === 1}>
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                        <Separator className="my-2" />
                        <div className="flex justify-end">
                            <div className="text-right space-y-1">
                                <p className="text-sm text-muted-foreground">Grand Total</p>
                                <p className="text-xl font-bold">${grandTotal.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => navigate(`/business/${id}/sale-orders`)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create Sale Order"}</Button>
                </div>
            </form>
        </div>
    );
}
