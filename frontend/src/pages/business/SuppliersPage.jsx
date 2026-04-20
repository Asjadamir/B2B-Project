import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchSuppliers, createSupplierThunk, updateSupplierThunk, deleteSupplierThunk } from "@/store/supplierSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Phone, Mail, Search, Truck } from "lucide-react";
import { toast } from "sonner";

const supplierSchema = z.object({
    supplierName: z.string().min(2, "Name must be at least 2 characters"),
    contactNumber: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    description: z.string().optional(),
});

function SupplierSheet({ open, onOpenChange, initial, businessId, onSubmit, loading }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(supplierSchema),
        defaultValues: { supplierName: "", contactNumber: "", email: "", description: "" },
    });

    useEffect(() => {
        reset(initial || { supplierName: "", contactNumber: "", email: "", description: "" });
    }, [initial, open, reset]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{initial ? "Edit Supplier" : "Add Supplier"}</SheetTitle>
                    <SheetDescription>{initial ? "Update supplier details." : "Add a new supplier to your business."}</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit((d) => onSubmit({ ...d, businessId }))} className="space-y-4 py-6">
                    <div className="space-y-1.5">
                        <Label>Supplier Name *</Label>
                        <Input placeholder="Supplier Inc." {...register("supplierName")} className={errors.supplierName ? "border-destructive" : ""} />
                        {errors.supplierName && <p className="text-xs text-destructive">{errors.supplierName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Contact Number</Label>
                        <Input placeholder="+1 234 567 8900" {...register("contactNumber")} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input type="email" placeholder="contact@supplier.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Input placeholder="Optional notes" {...register("description")} />
                    </div>
                    <SheetFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving…" : initial ? "Save changes" : "Add supplier"}</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

export default function SuppliersPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { suppliers, loading } = useSelector((s) => s.supplier);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => { dispatch(fetchSuppliers(id)); }, [id, dispatch]);

    async function handleCreate(form) {
        const r = await dispatch(createSupplierThunk(form));
        if (!r.error) { setSheetOpen(false); dispatch(fetchSuppliers(id)); toast.success("Supplier added"); }
        else toast.error(r.payload);
    }

    async function handleUpdate(form) {
        const r = await dispatch(updateSupplierThunk({ id: editTarget.SupplierID, data: form }));
        if (!r.error) { setEditTarget(null); toast.success("Supplier updated"); }
        else toast.error(r.payload);
    }

    async function handleDelete() {
        const r = await dispatch(deleteSupplierThunk(deleteTarget.SupplierID));
        if (!r.error) { setDeleteTarget(null); toast.success("Supplier removed"); }
        else toast.error(r.payload);
    }

    const filtered = suppliers.filter((s) =>
        s.SupplierName.toLowerCase().includes(search.toLowerCase()) ||
        (s.Email || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-5 max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold">Suppliers</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}</p>
                </div>
                <Button onClick={() => setSheetOpen(true)}><Plus className="size-4 mr-1.5" /> Add Supplier</Button>
            </div>

            {suppliers.length > 3 && (
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Search suppliers…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            )}

            {loading && !suppliers.length && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
                </div>
            )}

            {!loading && suppliers.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="py-16 flex flex-col items-center gap-4">
                        <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                            <Truck className="size-8 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-medium">No suppliers yet</p>
                            <p className="text-sm text-muted-foreground">Add your first supplier to start managing procurement</p>
                        </div>
                        <Button onClick={() => setSheetOpen(true)}><Plus className="size-4 mr-1.5" /> Add first supplier</Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((s) => (
                    <Card key={s.SupplierID} className="hover:border-primary/40 transition-colors">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base">{s.SupplierName}</CardTitle>
                                <Badge variant="outline" className="text-xs shrink-0">#{s.SupplierID}</Badge>
                            </div>
                            {s.Description && <CardDescription className="line-clamp-2 text-xs">{s.Description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="pb-3 space-y-1.5">
                            {s.ContactNumber && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="size-3.5 shrink-0" /> {s.ContactNumber}
                                </div>
                            )}
                            {s.Email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Mail className="size-3.5 shrink-0" /> <span className="truncate">{s.Email}</span>
                                </div>
                            )}
                        </CardContent>
                        <div className="px-6 pb-4 flex gap-1.5">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                                onClick={() => setEditTarget({ SupplierID: s.SupplierID, supplierName: s.SupplierName, contactNumber: s.ContactNumber || "", email: s.Email || "", description: s.Description || "" })}>
                                <Pencil className="size-3 mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(s)}>
                                <Trash2 className="size-3 mr-1" /> Remove
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <SupplierSheet open={sheetOpen} onOpenChange={setSheetOpen} initial={null} businessId={id} onSubmit={handleCreate} loading={loading} />
            <SupplierSheet open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)} initial={editTarget} businessId={id} onSubmit={handleUpdate} loading={loading} />

            <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remove Supplier</DialogTitle>
                        <DialogDescription>Remove <span className="font-medium text-foreground">{deleteTarget?.SupplierName}</span> from your business?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? "Removing…" : "Remove"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
