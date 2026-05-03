import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchWarehouses, createWarehouseThunk, updateWarehouseThunk, deleteWarehouseThunk } from "@/store/warehouseSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, MapPin, ChevronRight, Warehouse as WarehouseIcon } from "lucide-react";
import { toast } from "sonner";

const warehouseSchema = z.object({
    warehouseName: z.string().min(2, "Name required"),
    address: z.string().optional(),
    city: z.string().optional(),
});

function WarehouseSheet({ open, onOpenChange, initial, onSubmit, loading }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(warehouseSchema),
        defaultValues: { warehouseName: "", address: "", city: "" },
    });
    useEffect(() => { reset(initial || { warehouseName: "", address: "", city: "" }); }, [initial, open, reset]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{initial ? "Edit Warehouse" : "New Warehouse"}</SheetTitle>
                    <SheetDescription>{initial ? "Update warehouse details." : "Add a new warehouse location."}</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-6">
                    <div className="space-y-1.5">
                        <Label>Warehouse Name *</Label>
                        <Input placeholder="Main Warehouse" {...register("warehouseName")} className={errors.warehouseName ? "border-destructive" : ""} />
                        {errors.warehouseName && <p className="text-xs text-destructive">{errors.warehouseName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Address</Label>
                        <Input placeholder="123 Industrial Ave" {...register("address")} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>City</Label>
                        <Input placeholder="New York" {...register("city")} />
                    </div>
                    <SheetFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving…" : initial ? "Save changes" : "Create"}</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

export default function WarehousesPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { warehouses, loading } = useSelector((s) => s.warehouse);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => { dispatch(fetchWarehouses(id)); }, [id, dispatch]);

    async function handleCreate(form) {
        const r = await dispatch(createWarehouseThunk({ ...form, businessId: Number(id) }));
        if (!r.error) { setSheetOpen(false); dispatch(fetchWarehouses(id)); toast.success("Warehouse created"); }
        else toast.error(r.payload);
    }

    async function handleUpdate(form) {
        const r = await dispatch(updateWarehouseThunk({ id: editTarget.WarehouseID, data: form }));
        if (!r.error) { setEditTarget(null); dispatch(fetchWarehouses(id)); toast.success("Warehouse updated"); }
        else toast.error(r.payload);
    }

    async function handleDelete() {
        const r = await dispatch(deleteWarehouseThunk(deleteTarget.WarehouseID));
        if (!r.error) { setDeleteTarget(null); toast.success("Warehouse deleted"); }
        else toast.error(r.payload);
    }

    return (
        <div className="p-6 space-y-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold">Warehouses</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{warehouses.length} location{warehouses.length !== 1 ? "s" : ""}</p>
                </div>
                <Button onClick={() => setSheetOpen(true)}><Plus className="size-4 mr-1.5" /> New Warehouse</Button>
            </div>

            {loading && !warehouses.length && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
                </div>
            )}

            {!loading && warehouses.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="py-16 flex flex-col items-center gap-4">
                        <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                            <WarehouseIcon className="size-8 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-medium">No warehouses yet</p>
                            <p className="text-sm text-muted-foreground">Add warehouse locations to manage inventory and staff</p>
                        </div>
                        <Button onClick={() => setSheetOpen(true)}><Plus className="size-4 mr-1.5" /> Add first warehouse</Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {warehouses.map((w) => (
                    <Card key={w.WarehouseID} className="hover:border-primary/40 transition-colors">
                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <WarehouseIcon className="size-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <CardTitle className="text-base">{w.WarehouseName}</CardTitle>
                                    {(w.Address || w.City) && (
                                        <CardDescription className="flex items-center gap-1 text-xs mt-0.5">
                                            <MapPin className="size-3" />
                                            {[w.Address, w.City].filter(Boolean).join(", ")}
                                        </CardDescription>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter className="pt-0 gap-1.5">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                                onClick={() => setEditTarget({ WarehouseID: w.WarehouseID, warehouseName: w.WarehouseName, address: w.Address || "", city: w.City || "" })}>
                                <Pencil className="size-3 mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(w)}>
                                <Trash2 className="size-3 mr-1" /> Delete
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs ml-auto text-primary"
                                onClick={() => navigate(`/business/${id}/warehouses/${w.WarehouseID}`)}>
                                Manage Staff <ChevronRight className="size-3 ml-0.5" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <WarehouseSheet open={sheetOpen} onOpenChange={setSheetOpen} initial={null} onSubmit={handleCreate} loading={loading} />
            <WarehouseSheet open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)} initial={editTarget} onSubmit={handleUpdate} loading={loading} />

            <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Warehouse</DialogTitle>
                        <DialogDescription>Delete <span className="font-medium text-foreground">{deleteTarget?.WarehouseName}</span>? This cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? "Deleting…" : "Delete"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
