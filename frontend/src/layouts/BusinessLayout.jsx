import { useEffect, useState } from "react";
import { Outlet, NavLink, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBusinessById, fetchMyRoleThunk } from "@/store/businessSlice";
import { logoutThunk } from "@/store/authSlice";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    LayoutDashboard, Truck, Package, ShoppingCart, ClipboardList,
    Users, Warehouse, ScrollText, ChevronLeft, Menu, Link2,
    LogOut, PanelLeftClose, PanelLeftOpen, ChevronDown, DoorOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ALL_NAV = [
    { label: "Overview",        to: "overview",        icon: LayoutDashboard, roles: null },
    { label: "Suppliers",       to: "suppliers",       icon: Truck,           roles: ["Owner", "Manager", "Procurement Officer"] },
    { label: "Products",        to: "products",        icon: Package,         roles: null },
    { label: "Purchase Orders", to: "purchase-orders", icon: ShoppingCart,    roles: null },
    { label: "Sale Orders",     to: "sale-orders",     icon: ClipboardList,   roles: ["Owner", "Manager", "Warehouse Staff"] },
    { label: "Employees",       to: "employees",       icon: Users,           roles: ["Owner", "Manager"] },
    { label: "Warehouses",      to: "warehouses",      icon: Warehouse,       roles: ["Owner", "Manager", "Warehouse Staff"] },
    { label: "Audit Logs",      to: "audit-logs",      icon: ScrollText,      roles: ["Owner", "Manager"] },
];

function SidebarContent({ businessId, businessName, collapsed, role }) {
    const navItems = ALL_NAV.filter((item) => !item.roles || !role || item.roles.includes(role));

    return (
        <div className="flex flex-col h-full">
            <div className={cn("flex items-center gap-2.5 px-4 py-4 border-b border-border", collapsed && "justify-center px-2")}>
                <div className="size-7 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <Link2 className="size-3.5 text-primary-foreground" />
                </div>
                {!collapsed && <span className="font-bold text-sm truncate">CoreChain</span>}
            </div>

            {!collapsed && businessName && (
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Business</p>
                    <p className="text-sm font-medium truncate">{businessName}</p>
                </div>
            )}

            <ScrollArea className="flex-1 py-3">
                <nav className="space-y-0.5 px-2">
                    {navItems.map(({ label, to, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={`/business/${businessId}/${to}`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    isActive
                                        ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                        : "text-muted-foreground",
                                    collapsed && "justify-center px-2"
                                )
                            }
                            title={collapsed ? label : undefined}
                        >
                            <Icon className="size-4 shrink-0" />
                            {!collapsed && <span className="truncate">{label}</span>}
                        </NavLink>
                    ))}
                </nav>
            </ScrollArea>

            <div className="p-2 border-t border-border">
                <NavLink
                    to="/dashboard"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
                        collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? "Back to Dashboard" : undefined}
                >
                    <ChevronLeft className="size-4 shrink-0" />
                    {!collapsed && <span>Back to Dashboard</span>}
                </NavLink>
            </div>
        </div>
    );
}

export default function BusinessLayout() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentBusiness, currentRole, loading } = useSelector((s) => s.business);
    const { user } = useSelector((s) => s.auth);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [leaveLoading, setLeaveLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchBusinessById(id));
        dispatch(fetchMyRoleThunk(id));
    }, [id, dispatch]);

    useEffect(() => {
        const stored = localStorage.getItem("sidebar-collapsed");
        if (stored) setCollapsed(stored === "true");
    }, []);

    function toggleCollapse() {
        setCollapsed((v) => {
            localStorage.setItem("sidebar-collapsed", String(!v));
            return !v;
        });
    }

    async function handleLogout() {
        await dispatch(logoutThunk());
        navigate("/");
    }

    async function handleLeave() {
        setLeaveLoading(true);
        try {
            await api.leaveEmployee({ businessId: Number(id) });
            toast.success("You have left the business");
            navigate("/dashboard");
        } catch (e) {
            toast.error(e.message);
            setLeaveOpen(false);
        } finally {
            setLeaveLoading(false);
        }
    }

    const initials = user?.userName ? user.userName.slice(0, 2).toUpperCase() : (user?.email ? user.email.slice(0, 2).toUpperCase() : "U");
    const businessName = currentBusiness?.BusinessName || "";

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop sidebar */}
            <aside
                className={cn(
                    "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 border-r border-border bg-card transition-all duration-200",
                    collapsed ? "w-16" : "w-60"
                )}
            >
                <SidebarContent businessId={id} businessName={businessName} collapsed={collapsed} role={currentRole} />
            </aside>

            {/* Main area */}
            <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-200", collapsed ? "lg:pl-16" : "lg:pl-60")}>
                {/* Top bar */}
                <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-4 gap-3">
                    {/* Mobile menu */}
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu className="size-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-60 p-0">
                            <SidebarContent businessId={id} businessName={businessName} collapsed={false} role={currentRole} />
                        </SheetContent>
                    </Sheet>

                    {/* Desktop collapse toggle */}
                    <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={toggleCollapse}>
                        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                    </Button>

                    {/* Business name breadcrumb */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        {loading && !businessName ? (
                            <Skeleton className="h-4 w-32" />
                        ) : (
                            <span className="text-sm font-medium truncate text-muted-foreground">{businessName}</span>
                        )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 gap-1.5 px-2">
                                    <Avatar className="size-7">
                                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                                    </Avatar>
                                    <ChevronDown className="size-3 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <div className="px-2 py-1.5">
                                    <p className="text-xs font-medium truncate">{user?.userName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                    {currentRole && (
                                        <p className="text-xs text-primary mt-0.5">{currentRole}</p>
                                    )}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2">
                                    <LayoutDashboard className="size-3.5" /> All Businesses
                                </DropdownMenuItem>
                                {currentRole && currentRole !== "Owner" && (
                                    <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => setLeaveOpen(true)}>
                                        <DoorOpen className="size-3.5" /> Leave Business
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive gap-2" onClick={handleLogout}>
                                    <LogOut className="size-3.5" /> Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>

            {/* Leave business confirmation */}
            <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Leave Business</DialogTitle>
                        <DialogDescription>
                            You will lose access to <span className="font-medium text-foreground">{businessName}</span> immediately. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLeaveOpen(false)} disabled={leaveLoading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleLeave} disabled={leaveLoading}>
                            {leaveLoading ? "Leaving…" : "Leave Business"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
