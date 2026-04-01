import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchMyBusinesses,
    createBusinessThunk,
    updateBusinessThunk,
    deleteBusinessThunk,
} from "@/store/businessSlice";
import { logoutThunk } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { Building2, Plus, Pencil, Trash2, LogOut, ChevronRight } from "lucide-react";

function BusinessFormDialog({ open, onOpenChange, initial, onSubmit, loading }) {
    const [form, setForm] = useState({ businessName: "", description: "" });

    useEffect(() => {
        setForm(initial || { businessName: "", description: "" });
    }, [initial, open]);

    function handleChange(e) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{initial ? "Edit Business" : "Create Business"}</DialogTitle>
                    <DialogDescription>
                        {initial ? "Update the business details below." : "Fill in the details to create a new business."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                            id="businessName"
                            name="businessName"
                            placeholder="Acme Corp"
                            value={form.businessName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            name="description"
                            placeholder="Optional description"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit(form)} disabled={loading || !form.businessName.trim()}>
                        {loading ? "Saving…" : initial ? "Save changes" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { businesses, loading, error } = useSelector((s) => s.business);
    const { user } = useSelector((s) => s.auth);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        dispatch(fetchMyBusinesses());
    }, [dispatch]);

    async function handleCreate(form) {
        const result = await dispatch(createBusinessThunk(form));
        if (!result.error) {
            setCreateOpen(false);
            dispatch(fetchMyBusinesses());
        }
    }

    async function handleUpdate(form) {
        const result = await dispatch(updateBusinessThunk({ id: editTarget.BusinessID, data: form }));
        if (!result.error) setEditTarget(null);
    }

    async function handleDelete() {
        const result = await dispatch(deleteBusinessThunk(deleteTarget.BusinessID));
        if (!result.error) setDeleteTarget(null);
    }

    async function handleLogout() {
        await dispatch(logoutThunk());
        navigate("/login");
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <header className="border-b border-border bg-card">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="size-5 text-primary" />
                        <span className="font-semibold text-lg">CoreChain</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground hidden sm:block">
                            {user?.email || ""}
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="size-4 mr-1" /> Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                {/* Page title */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">My Businesses</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Manage your businesses and their suppliers
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4 mr-1" /> New Business
                    </Button>
                </div>

                {/* Error */}
                {error && (
                    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                        {error}
                    </p>
                )}

                {/* Loading */}
                {loading && !businesses.length && (
                    <p className="text-muted-foreground text-sm">Loading…</p>
                )}

                {/* Empty state */}
                {!loading && businesses.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="py-12 flex flex-col items-center gap-3">
                            <Building2 className="size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">No businesses yet</p>
                            <Button variant="outline" onClick={() => setCreateOpen(true)}>
                                <Plus className="size-4 mr-1" /> Create your first business
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Business grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {businesses.map((b) => (
                        <Card
                            key={b.BusinessID}
                            className="cursor-pointer hover:border-primary/50 transition-colors group"
                            onClick={() => navigate(`/business/${b.BusinessID}`)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-base">{b.BusinessName}</CardTitle>
                                    <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                                        {b.RoleName || "Staff"}
                                    </Badge>
                                </div>
                                {b.Description && (
                                    <CardDescription className="line-clamp-2">{b.Description}</CardDescription>
                                )}
                            </CardHeader>
                            <CardFooter className="pt-0 gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() =>
                                        setEditTarget({
                                            BusinessID: b.BusinessID,
                                            businessName: b.BusinessName,
                                            description: b.Description || "",
                                        })
                                    }
                                >
                                    <Pencil className="size-3 mr-1" /> Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteTarget(b)}
                                >
                                    <Trash2 className="size-3 mr-1" /> Delete
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 ml-auto"
                                    onClick={() => navigate(`/business/${b.BusinessID}`)}
                                >
                                    Open <ChevronRight className="size-3 ml-1" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Create dialog */}
            <BusinessFormDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                initial={null}
                onSubmit={handleCreate}
                loading={loading}
            />

            {/* Edit dialog */}
            <BusinessFormDialog
                open={!!editTarget}
                onOpenChange={(v) => !v && setEditTarget(null)}
                initial={editTarget}
                onSubmit={handleUpdate}
                loading={loading}
            />

            {/* Delete confirm */}
            <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Business</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">{deleteTarget?.BusinessName}</span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
