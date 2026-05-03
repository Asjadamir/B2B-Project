import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchMyBusinesses, createBusinessThunk, updateBusinessThunk, deleteBusinessThunk } from "@/store/businessSlice";
import { logoutThunk } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Building2, Plus, Pencil, Trash2, ChevronRight, LogOut, Search, Link2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const businessSchema = z.object({
    businessName: z.string().min(2, "Business name must be at least 2 characters"),
    description: z.string().optional(),
});

function BusinessFormDialog({ open, onOpenChange, initial, onSubmit, loading }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(businessSchema),
        defaultValues: { businessName: "", description: "" },
    });

    useEffect(() => {
        reset(initial || { businessName: "", description: "" });
    }, [initial, open, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{initial ? "Edit Business" : "New Business"}</DialogTitle>
                    <DialogDescription>
                        {initial ? "Update the business details below." : "Create a new business to manage your supply chain."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input id="businessName" placeholder="Acme Corp" {...register("businessName")} className={errors.businessName ? "border-destructive" : ""} />
                        {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" placeholder="Optional description" {...register("description")} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving…" : initial ? "Save changes" : "Create"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { businesses, loading } = useSelector((s) => s.business);
    const { user } = useSelector((s) => s.auth);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => { dispatch(fetchMyBusinesses()); }, [dispatch]);

    async function handleCreate(form) {
        const result = await dispatch(createBusinessThunk(form));
        if (!result.error) {
            setCreateOpen(false);
            dispatch(fetchMyBusinesses());
            toast.success("Business created");
        } else toast.error(result.payload);
    }

    async function handleUpdate(form) {
        const result = await dispatch(updateBusinessThunk({ id: editTarget.BusinessID, data: form }));
        if (!result.error) { setEditTarget(null); toast.success("Business updated"); }
        else toast.error(result.payload);
    }

    async function handleDelete() {
        const result = await dispatch(deleteBusinessThunk(deleteTarget.BusinessID));
        if (!result.error) { setDeleteTarget(null); toast.success("Business deleted"); }
        else toast.error(result.payload);
    }

    async function handleLogout() {
        await dispatch(logoutThunk());
        navigate("/");
    }

    const filtered = businesses.filter((b) =>
        b.BusinessName.toLowerCase().includes(search.toLowerCase())
    );

    const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "U";

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-md bg-primary flex items-center justify-center">
                            <Link2 className="size-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg">CoreChain</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 gap-2 px-2">
                                    <Avatar className="size-7">
                                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm hidden sm:block text-muted-foreground">{user?.email}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user?.email}</div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive gap-2" onClick={handleLogout}>
                                    <LogOut className="size-3.5" /> Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">My Businesses</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {businesses.length} business{businesses.length !== 1 ? "es" : ""} in your account
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="shrink-0">
                        <Plus className="size-4 mr-1.5" /> New Business
                    </Button>
                </div>

                {businesses.length > 3 && (
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search businesses…"
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                )}

                {loading && !businesses.length && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full mt-1" />
                                </CardHeader>
                                <CardFooter><Skeleton className="h-7 w-24" /></CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && businesses.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="py-16 flex flex-col items-center gap-4">
                            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                                <Building2 className="size-8 text-muted-foreground" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-medium">No businesses yet</p>
                                <p className="text-sm text-muted-foreground">Create your first business to get started with CoreChain</p>
                            </div>
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus className="size-4 mr-1.5" /> Create first business
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((b) => (
                        <Card
                            key={b.BusinessID}
                            className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
                            onClick={() => navigate(`/business/${b.BusinessID}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Building2 className="size-4 text-primary" />
                                    </div>
                                    <Badge variant="secondary" className="text-xs shrink-0">{b.RoleName || "Staff"}</Badge>
                                </div>
                                <CardTitle className="text-base mt-2">{b.BusinessName}</CardTitle>
                                {b.Description && <CardDescription className="line-clamp-2 text-xs">{b.Description}</CardDescription>}
                            </CardHeader>
                            <CardContent className="pb-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CalendarDays className="size-3" />
                                    <span>Created {new Date(b.CreatedAt).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                                    onClick={() => setEditTarget({ BusinessID: b.BusinessID, businessName: b.BusinessName, description: b.Description || "" })}>
                                    <Pencil className="size-3 mr-1" /> Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                    onClick={() => setDeleteTarget(b)}>
                                    <Trash2 className="size-3 mr-1" /> Delete
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs ml-auto text-primary"
                                    onClick={() => navigate(`/business/${b.BusinessID}`)}>
                                    Open <ChevronRight className="size-3 ml-0.5" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </main>

            <BusinessFormDialog open={createOpen} onOpenChange={setCreateOpen} initial={null} onSubmit={handleCreate} loading={loading} />
            <BusinessFormDialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)} initial={editTarget} onSubmit={handleUpdate} loading={loading} />

            <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Business</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-medium text-foreground">{deleteTarget?.BusinessName}</span>? This action cannot be undone.
                        </DialogDescription>
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
