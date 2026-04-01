import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBusinessById } from "@/store/businessSlice";
import {
    fetchSuppliers,
    createSupplierThunk,
    updateSupplierThunk,
    deleteSupplierThunk,
} from "@/store/supplierSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Phone,
    Mail,
    Building2,
    PackageSearch,
} from "lucide-react";

function SupplierFormDialog({ open, onOpenChange, initial, businessId, onSubmit, loading }) {
    const [form, setForm] = useState({
        supplierName: "",
        contactNumber: "",
        email: "",
        description: "",
    });

    useEffect(() => {
        setForm(
            initial || { supplierName: "", contactNumber: "", email: "", description: "" }
        );
    }, [initial, open]);

    function handleChange(e) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{initial ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
                    <DialogDescription>
                        {initial ? "Update supplier details below." : "Fill in the supplier information."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="supplierName">Supplier Name *</Label>
                        <Input
                            id="supplierName"
                            name="supplierName"
                            placeholder="Supplier Inc."
                            value={form.supplierName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input
                            id="contactNumber"
                            name="contactNumber"
                            placeholder="+1 234 567 8900"
                            value={form.contactNumber}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="contact@supplier.com"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            name="description"
                            placeholder="Optional notes"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSubmit({ ...form, businessId })}
                        disabled={loading || !form.supplierName.trim()}
                    >
                        {loading ? "Saving…" : initial ? "Save changes" : "Add supplier"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function BusinessPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentBusiness, loading: bizLoading, error: bizError } = useSelector((s) => s.business);
    const { suppliers, loading: supLoading, error: supError } = useSelector((s) => s.supplier);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        dispatch(fetchBusinessById(id));
        dispatch(fetchSuppliers(id));
    }, [id, dispatch]);

    async function handleCreate(form) {
        const result = await dispatch(createSupplierThunk(form));
        if (!result.error) {
            setCreateOpen(false);
            dispatch(fetchSuppliers(id));
        }
    }

    async function handleUpdate(form) {
        const result = await dispatch(
            updateSupplierThunk({ id: editTarget.SupplierID, data: form })
        );
        if (!result.error) setEditTarget(null);
    }

    async function handleDelete() {
        const result = await dispatch(deleteSupplierThunk(deleteTarget.SupplierID));
        if (!result.error) setDeleteTarget(null);
    }

    const loading = bizLoading || supLoading;
    const error = bizError || supError;

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <header className="border-b border-border bg-card">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="size-4 mr-1" /> Dashboard
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                    <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                            {currentBusiness?.BusinessName || "Business"}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                {/* Business info card */}
                {currentBusiness && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle>{currentBusiness.BusinessName}</CardTitle>
                                    {currentBusiness.Description && (
                                        <CardDescription className="mt-1">
                                            {currentBusiness.Description}
                                        </CardDescription>
                                    )}
                                </div>
                                <Badge variant="secondary">ID: {currentBusiness.BusinessID}</Badge>
                            </div>
                        </CardHeader>
                    </Card>
                )}

                {/* Error */}
                {error && (
                    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                        {error}
                    </p>
                )}

                {/* Suppliers section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Suppliers</h2>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="size-4 mr-1" /> Add Supplier
                        </Button>
                    </div>

                    {supLoading && !suppliers.length && (
                        <p className="text-muted-foreground text-sm">Loading suppliers…</p>
                    )}

                    {!supLoading && suppliers.length === 0 && (
                        <Card className="border-dashed">
                            <CardContent className="py-12 flex flex-col items-center gap-3">
                                <PackageSearch className="size-10 text-muted-foreground" />
                                <p className="text-muted-foreground">No suppliers yet</p>
                                <Button variant="outline" onClick={() => setCreateOpen(true)}>
                                    <Plus className="size-4 mr-1" /> Add first supplier
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suppliers.map((s) => (
                            <Card key={s.SupplierID}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base">{s.SupplierName}</CardTitle>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                            #{s.SupplierID}
                                        </Badge>
                                    </div>
                                    {s.Description && (
                                        <CardDescription className="line-clamp-2">
                                            {s.Description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="pb-3 space-y-1.5">
                                    {s.ContactNumber && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="size-3.5 shrink-0" />
                                            <span>{s.ContactNumber}</span>
                                        </div>
                                    )}
                                    {s.Email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="size-3.5 shrink-0" />
                                            <span className="truncate">{s.Email}</span>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="px-6 pb-4 flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={() =>
                                            setEditTarget({
                                                SupplierID: s.SupplierID,
                                                supplierName: s.SupplierName,
                                                contactNumber: s.ContactNumber || "",
                                                email: s.Email || "",
                                                description: s.Description || "",
                                            })
                                        }
                                    >
                                        <Pencil className="size-3 mr-1" /> Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteTarget(s)}
                                    >
                                        <Trash2 className="size-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>

            {/* Add supplier dialog */}
            <SupplierFormDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                initial={null}
                businessId={id}
                onSubmit={handleCreate}
                loading={supLoading}
            />

            {/* Edit supplier dialog */}
            <SupplierFormDialog
                open={!!editTarget}
                onOpenChange={(v) => !v && setEditTarget(null)}
                initial={editTarget}
                businessId={id}
                onSubmit={handleUpdate}
                loading={supLoading}
            />

            {/* Delete confirm */}
            <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remove Supplier</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate{" "}
                            <span className="font-medium text-foreground">{deleteTarget?.SupplierName}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={supLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={supLoading}>
                            {supLoading ? "Removing…" : "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
