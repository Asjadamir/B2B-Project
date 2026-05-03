import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    Package, Truck, ShoppingCart, BarChart3, Users, Warehouse,
    ChevronRight, ArrowRight, CheckCircle, Zap, Shield, Globe,
    Link2
} from "lucide-react";

const features = [
    {
        icon: Package,
        title: "Real-Time Inventory",
        desc: "Track stock levels across all warehouses with instant alerts for low inventory.",
    },
    {
        icon: Truck,
        title: "Supplier Management",
        desc: "Centralize procurement relationships and automate supplier order workflows.",
    },
    {
        icon: ShoppingCart,
        title: "Order Processing",
        desc: "Streamline purchase and sale orders from creation to fulfillment in one place.",
    },
    {
        icon: Warehouse,
        title: "Multi-Warehouse",
        desc: "Manage stock, staff, and operations across unlimited warehouse locations.",
    },
    {
        icon: BarChart3,
        title: "Analytics & Reports",
        desc: "Profit/loss views, low-stock alerts, and trend data for smarter decisions.",
    },
    {
        icon: Users,
        title: "Team Management",
        desc: "Assign roles and control warehouse access for your entire workforce.",
    },
];

const steps = [
    {
        num: "01",
        title: "Create your business",
        desc: "Set up your business profile, add warehouses, and invite your team.",
    },
    {
        num: "02",
        title: "Add suppliers & products",
        desc: "Build your product catalog, link suppliers, and set up inventory.",
    },
    {
        num: "03",
        title: "Track & scale with confidence",
        desc: "Process orders, monitor stock in real time, and act on analytics.",
    },
];

const stats = [
    { value: "100%", label: "Supply Chain Visibility" },
    { value: "Multi", label: "Warehouse Support" },
    { value: "Real-Time", label: "Stock Tracking" },
    { value: "End-to-End", label: "Order Lifecycle" },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navbar */}
            <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-md bg-primary flex items-center justify-center">
                            <Link2 className="size-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">CoreChain</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/login">Sign in</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link to="/signup">Get Started <ArrowRight className="size-3.5 ml-1" /></Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden pt-20 pb-24 px-6">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.52_0.22_264/0.12),transparent)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.5_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0_0/0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                        <Zap className="size-3" />
                        B2B Inventory & Supply Chain Platform
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                        One Platform.{" "}
                        <span className="text-primary">Complete Supply</span>{" "}
                        Chain Control.
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        CoreChain unifies your suppliers, inventory, orders, and warehouses — delivering real-time visibility to reduce waste, prevent stockouts, and improve profitability.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Button size="lg" asChild className="w-full sm:w-auto gap-2">
                            <Link to="/signup">
                                Start for Free <ChevronRight className="size-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                            <a href="#how-it-works">See How It Works</a>
                        </Button>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><CheckCircle className="size-3.5 text-primary" /> No credit card required</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="size-3.5 text-primary" /> Multi-warehouse support</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="size-3.5 text-primary" /> Real-time stock tracking</span>
                    </div>
                </div>
            </section>

            {/* Stats bar */}
            <section className="border-y border-border/60 bg-muted/30">
                <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((s) => (
                        <div key={s.label} className="space-y-1">
                            <div className="text-2xl font-bold text-primary">{s.value}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center space-y-3 mb-14">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                            <Globe className="size-3" /> Everything you need
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Built for modern B2B operations
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Stop managing supply chains in spreadsheets. CoreChain brings every workflow into one unified platform.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/40 hover:shadow-sm transition-all"
                            >
                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <f.icon className="size-5 text-primary" />
                                </div>
                                <h3 className="font-semibold">{f.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-24 px-6 bg-muted/30">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center space-y-3 mb-14">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                            <Shield className="size-3" /> Simple setup
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Up and running in minutes
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((s, i) => (
                            <div key={s.num} className="relative text-center space-y-3">
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-6 left-[60%] w-[80%] border-t border-dashed border-border" />
                                )}
                                <div className="inline-flex size-12 rounded-full border-2 border-primary/30 bg-primary/10 items-center justify-center">
                                    <span className="text-sm font-bold text-primary">{s.num}</span>
                                </div>
                                <h3 className="font-semibold">{s.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="py-24 px-6">
                <div className="max-w-3xl mx-auto text-center rounded-2xl border border-primary/20 bg-primary/5 p-12 space-y-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,oklch(0.52_0.22_264/0.08),transparent)] -z-10" />
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                        Stop managing supply chains in spreadsheets.
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Join businesses already using CoreChain to get real-time control over their entire supply chain.
                    </p>
                    <Button size="lg" asChild className="gap-2">
                        <Link to="/signup">
                            Start with CoreChain <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/60 py-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="size-5 rounded bg-primary flex items-center justify-center">
                            <Link2 className="size-3 text-primary-foreground" />
                        </div>
                        <span className="font-medium text-foreground">CoreChain</span>
                    </div>
                    <p>© {new Date().getFullYear()} CoreChain. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
                        <Link to="/signup" className="hover:text-foreground transition-colors">Get started</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
