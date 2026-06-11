import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
    fetchMyBusinesses,
    createBusinessThunk,
    updateBusinessThunk,
    deleteBusinessThunk,
} from "@/store/businessSlice";
import { logoutThunk } from "@/store/authSlice.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.jsx";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.jsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { ThemeToggle } from "@/components/theme-toggle.jsx";
import {
    Building2,
    Plus,
    Pencil,
    Trash2,
    LogOut,
    Search,
    Link2,
    CalendarDays,
    ArrowRight,
    Sparkles,
    Briefcase,
} from "lucide-react";
import { toast } from "sonner";

const EASE = [0.21, 0.47, 0.32, 0.98];

/* ── Per-card color palettes ── */
const CARD_ACCENTS = [
    {
        strip: "from-blue-500 to-indigo-600",
        icon: "from-blue-500/20 to-indigo-500/20",
        text: "text-blue-500",
        glow: "hover:shadow-blue-500/10",
    },
    {
        strip: "from-violet-500 to-purple-600",
        icon: "from-violet-500/20 to-purple-500/20",
        text: "text-violet-500",
        glow: "hover:shadow-violet-500/10",
    },
    {
        strip: "from-emerald-500 to-teal-600",
        icon: "from-emerald-500/20 to-teal-500/20",
        text: "text-emerald-500",
        glow: "hover:shadow-emerald-500/10",
    },
    {
        strip: "from-orange-500 to-amber-600",
        icon: "from-orange-500/20 to-amber-500/20",
        text: "text-orange-500",
        glow: "hover:shadow-orange-500/10",
    },
    {
        strip: "from-cyan-500 to-sky-600",
        icon: "from-cyan-500/20 to-sky-500/20",
        text: "text-cyan-500",
        glow: "hover:shadow-cyan-500/10",
    },
    {
        strip: "from-rose-500 to-pink-600",
        icon: "from-rose-500/20 to-pink-500/20",
        text: "text-rose-500",
        glow: "hover:shadow-rose-500/10",
    },
];

const ROLE_STYLES = {
    Owner: "bg-violet-500/10 text-violet-500 border border-violet-500/25",
    Manager: "bg-blue-500/10 text-blue-500 border border-blue-500/25",
    "Warehouse Staff":
        "bg-emerald-500/10 text-emerald-500 border border-emerald-500/25",
    "Procurement Officer":
        "bg-orange-500/10 text-orange-500 border border-orange-500/25",
};

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

/* ── Business card component ── */
function BusinessCard({ b, idx, navigate, onEdit, onDelete }) {
    const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
    const roleStyle =
        ROLE_STYLES[b.RoleName] ||
        "bg-gray-500/10 text-gray-400 border border-gray-500/20";

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20, scale: 0.97 },
                visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.42, ease: EASE },
                },
            }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
            whileHover={{
                y: -5,
                transition: { duration: 0.22, ease: "easeOut" },
            }}
            layout
            className={`glass rounded-2xl border border-border overflow-hidden cursor-pointer group
                        hover:border-primary/25 transition-shadow duration-300 hover:shadow-lg ${accent.glow}`}
            onClick={() => navigate(`/business/${b.BusinessID}`)}
        >
            {/* Gradient accent strip */}
            <div className={`h-1 bg-gradient-to-r ${accent.strip}`} />

            <div className="p-5 space-y-4">
                {/* Icon + role badge */}
                <div className="flex items-start justify-between gap-2">
                    <motion.div
                        whileHover={{
                            rotate: [0, -8, 8, 0],
                            transition: { duration: 0.4 },
                        }}
                        className={`size-11 rounded-xl bg-gradient-to-br ${accent.icon} flex items-center justify-center shrink-0`}
                    >
                        <Building2 className={`size-5 ${accent.text}`} />
                    </motion.div>
                    <span
                        className={`text-xs font-medium rounded-full px-2.5 py-0.5 shrink-0 ${roleStyle}`}
                    >
                        {b.RoleName || "Staff"}
                    </span>
                </div>

                {/* Name + description */}
                <div className="space-y-0.5 min-w-0">
                    <h3 className="font-semibold text-base leading-snug">
                        {b.BusinessName}
                    </h3>
                    {b.Description ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {b.Description}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground/50 italic">
                            No description
                        </p>
                    )}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="size-3 shrink-0" />
                        {new Date(b.CreatedAt).toLocaleDateString()}
                    </span>
                    <div
                        className="flex gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                                onEdit({
                                    BusinessID: b.BusinessID,
                                    businessName: b.BusinessName,
                                    description: b.Description || "",
                                })
                            }
                        >
                            <Pencil className="size-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground/60 hover:text-destructive"
                            onClick={() => onDelete(b)}
                        >
                            <Trash2 className="size-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`size-7 ${accent.text} opacity-70 group-hover:opacity-100`}
                            onClick={() =>
                                navigate(`/business/${b.BusinessID}`)
                            }
                        >
                            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ── Business form dialog ── */
const businessSchema = z.object({
    businessName: z
        .string()
        .min(2, "Business name must be at least 2 characters"),
    description: z.string().optional(),
});

function BusinessFormDialog({
    open,
    onOpenChange,
    initial,
    onSubmit,
    loading,
}) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
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
                    <DialogTitle>
                        {initial ? "Edit Business" : "New Business"}
                    </DialogTitle>
                    <DialogDescription>
                        {initial
                            ? "Update the business details below."
                            : "Create a new business to manage your supply chain."}
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 py-2"
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                            id="businessName"
                            placeholder="Acme Corp"
                            {...register("businessName")}
                            className={
                                errors.businessName ? "border-destructive" : ""
                            }
                        />
                        {errors.businessName && (
                            <p className="text-xs text-destructive">
                                {errors.businessName.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="Optional description"
                            {...register("description")}
                        />
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
                            {loading
                                ? "Saving…"
                                : initial
                                  ? "Save changes"
                                  : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ════════════════════════════════════════════
   Main page
   ════════════════════════════════════════════ */
export default function DashboardPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { businesses, loading } = useSelector((s) => s.business);
    const { user } = useSelector((s) => s.auth);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        dispatch(fetchMyBusinesses());
    }, [dispatch]);

    async function handleCreate(form) {
        const result = await dispatch(createBusinessThunk(form));
        if (!result.error) {
            setCreateOpen(false);
            dispatch(fetchMyBusinesses());
            toast.success("Business created");
        } else toast.error(result.payload);
    }
    async function handleUpdate(form) {
        const result = await dispatch(
            updateBusinessThunk({ id: editTarget.BusinessID, data: form }),
        );
        if (!result.error) {
            setEditTarget(null);
            toast.success("Business updated");
        } else toast.error(result.payload);
    }
    async function handleDelete() {
        const result = await dispatch(
            deleteBusinessThunk(deleteTarget.BusinessID),
        );
        if (!result.error) {
            setDeleteTarget(null);
            toast.success("Business deleted");
        } else toast.error(result.payload);
    }
    async function handleLogout() {
        await dispatch(logoutThunk());
        navigate("/");
    }

    const filtered = businesses.filter((b) =>
        b.BusinessName.toLowerCase().includes(search.toLowerCase()),
    );
    const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "U";
    const userName = user?.userName || user?.email?.split("@")[0] || "there";

    return (
        <div className="min-h-screen bg-background">
            {/* ── Header ── */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md"
            >
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <motion.div
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.03 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                        }}
                    >
                        <div className="size-7 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/30">
                            <Link2 className="size-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg">CoreChain</span>
                    </motion.div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-9 gap-2 px-2"
                                >
                                    <Avatar className="size-7">
                                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm hidden sm:block text-muted-foreground">
                                        {user?.email}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive gap-2"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="size-3.5" /> Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </motion.header>

            <main className="max-w-6xl mx-auto px-6 pt-6 pb-12 space-y-6">
                {/* ── Hero banner ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="relative overflow-hidden rounded-2xl border border-primary/15
                               bg-gradient-to-br from-primary/12 via-primary/4 to-violet-500/8 p-7 sm:p-8"
                >
                    {/* Ambient blobs */}
                    <div className="absolute -top-20 -right-20 size-56 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 left-1/3 size-44 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
                    <div className="absolute top-1/2 -left-10 size-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                    {/* Subtle grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.5_0_0/0.03)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0_0/0.03)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Sparkles className="size-3.5 text-primary" />
                                {getGreeting()}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary capitalize">
                                {userName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {businesses.length} business
                                    {businesses.length !== 1 ? "es" : ""} active
                                </div>
                                <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 border border-primary/20 font-medium">
                                    CoreChain
                                </span>
                            </div>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="shrink-0"
                        >
                            <Button
                                onClick={() => setCreateOpen(true)}
                                className="shadow-glow-sm gap-1.5"
                            >
                                <Plus className="size-4" /> New Business
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ── Search ── */}
                <AnimatePresence>
                    {businesses.length > 3 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="relative max-w-sm overflow-hidden"
                        >
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search businesses…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Loading skeletons ── */}
                {loading && !businesses.length && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.08 }}
                                className="glass rounded-2xl border border-border p-5 space-y-4"
                            >
                                <div className="h-1 bg-muted rounded-full" />
                                <div className="flex items-start justify-between gap-2 pt-1">
                                    <Skeleton className="size-11 rounded-xl" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                                <div className="flex justify-between pt-1 border-t border-border/40">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* ── Empty state ── */}
                <AnimatePresence>
                    {!loading && businesses.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, ease: EASE }}
                        >
                            <Card className="border-dashed border-2 glass">
                                <CardContent className="py-20 flex flex-col items-center gap-5">
                                    <div className="relative">
                                        <motion.div
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 2.8,
                                                ease: "easeInOut",
                                            }}
                                            className="size-20 rounded-3xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center"
                                        >
                                            <Briefcase className="size-9 text-primary" />
                                        </motion.div>
                                        <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                                            <Plus className="size-3.5 text-white" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1.5">
                                        <p className="font-semibold text-lg">
                                            No businesses yet
                                        </p>
                                        <p className="text-sm text-muted-foreground max-w-xs">
                                            Create your first business to start
                                            managing your supply chain with
                                            CoreChain
                                        </p>
                                    </div>
                                    <motion.div
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <Button
                                            onClick={() => setCreateOpen(true)}
                                            className="shadow-glow-sm gap-1.5"
                                        >
                                            <Plus className="size-4" /> Create
                                            first business
                                        </Button>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Business cards grid ── */}
                {filtered.length > 0 && (
                    <>
                        {businesses.length > 3 && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-muted-foreground"
                            >
                                Showing {filtered.length} of {businesses.length}{" "}
                                businesses
                            </motion.p>
                        )}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: {
                                    transition: { staggerChildren: 0.07 },
                                },
                            }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            <AnimatePresence>
                                {filtered.map((b, idx) => (
                                    <BusinessCard
                                        key={b.BusinessID}
                                        b={b}
                                        idx={idx}
                                        navigate={navigate}
                                        onEdit={setEditTarget}
                                        onDelete={setDeleteTarget}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}

                {/* ── No search results ── */}
                <AnimatePresence>
                    {!loading &&
                        businesses.length > 0 &&
                        filtered.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-12 text-muted-foreground"
                            >
                                <Search className="size-8 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">
                                    No businesses match &quot;{search}&quot;
                                </p>
                            </motion.div>
                        )}
                </AnimatePresence>
            </main>

            {/* ── Dialogs ── */}
            <BusinessFormDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                initial={null}
                onSubmit={handleCreate}
                loading={loading}
            />
            <BusinessFormDialog
                open={!!editTarget}
                onOpenChange={(v) => !v && setEditTarget(null)}
                initial={editTarget}
                onSubmit={handleUpdate}
                loading={loading}
            />

            <Dialog
                open={!!deleteTarget}
                onOpenChange={(v) => !v && setDeleteTarget(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Business</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {deleteTarget?.BusinessName}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
