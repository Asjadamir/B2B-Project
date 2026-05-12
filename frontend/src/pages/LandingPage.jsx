import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    Package, Truck, ShoppingCart, BarChart3, Users, Warehouse,
    ChevronRight, ArrowRight, CheckCircle, Zap, Shield, Globe,
    Link2
} from "lucide-react";

const features = [
    { icon: Package,      title: "Real-Time Inventory", desc: "Track stock levels across all warehouses with instant alerts for low inventory.",   iconBg: "from-blue-500/20 to-indigo-500/20",    iconColor: "text-blue-500"    },
    { icon: Truck,        title: "Supplier Management", desc: "Centralize procurement relationships and automate supplier order workflows.",        iconBg: "from-violet-500/20 to-purple-500/20",  iconColor: "text-violet-500"  },
    { icon: ShoppingCart, title: "Order Processing",    desc: "Streamline purchase and sale orders from creation to fulfillment in one place.",    iconBg: "from-emerald-500/20 to-teal-500/20",   iconColor: "text-emerald-500" },
    { icon: Warehouse,    title: "Multi-Warehouse",     desc: "Manage stock, staff, and operations across unlimited warehouse locations.",          iconBg: "from-orange-500/20 to-amber-500/20",   iconColor: "text-orange-500"  },
    { icon: BarChart3,    title: "Analytics & Reports", desc: "Profit/loss views, low-stock alerts, and trend data for smarter decisions.",         iconBg: "from-cyan-500/20 to-sky-500/20",       iconColor: "text-cyan-500"    },
    { icon: Users,        title: "Team Management",     desc: "Assign roles and control warehouse access for your entire workforce.",               iconBg: "from-rose-500/20 to-pink-500/20",      iconColor: "text-rose-500"    },
];

const steps = [
    { num: "01", title: "Create your business",           desc: "Set up your business profile, add warehouses, and invite your team." },
    { num: "02", title: "Add suppliers & products",       desc: "Build your product catalog, link suppliers, and set up inventory." },
    { num: "03", title: "Track & scale with confidence",  desc: "Process orders, monitor stock in real time, and act on analytics." },
];

const stats = [
    { value: "100%",      label: "Supply Chain Visibility" },
    { value: "Multi",     label: "Warehouse Support" },
    { value: "Real-Time", label: "Stock Tracking" },
    { value: "End-to-End",label: "Order Lifecycle" },
];

const EASE = [0.21, 0.47, 0.32, 0.98];

function FadeUp({ children, className, delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: EASE }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function StaggerGrid({ children, className }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

const cardVariant = {
    hidden:  { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

            {/* ── Navbar ── */}
            <motion.header
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md"
            >
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <motion.div
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                        <div className="size-7 rounded-md bg-primary flex items-center justify-center">
                            <Link2 className="size-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">CoreChain</span>
                    </motion.div>

                    <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                        {["#features", "#how-it-works"].map((href, i) => (
                            <motion.a
                                key={href}
                                href={href}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + i * 0.08 }}
                                className="hover:text-foreground transition-colors"
                            >
                                {href === "#features" ? "Features" : "How it works"}
                            </motion.a>
                        ))}
                    </nav>

                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/login">Sign in</Link>
                        </Button>
                        <Button size="sm" asChild className="shadow-sm">
                            <Link to="/signup">Get Started <ArrowRight className="size-3.5 ml-1" /></Link>
                        </Button>
                    </motion.div>
                </div>
            </motion.header>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden pt-20 pb-28 px-6">
                {/* Background layers */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.52_0.22_264/0.14),transparent)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.5_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0_0/0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
                    <div className="orb-float     absolute -top-40 -left-40  size-[28rem] rounded-full bg-primary/6  blur-3xl pointer-events-none" />
                    <div className="orb-float-alt absolute -bottom-40 -right-40 size-[36rem] rounded-full bg-primary/4  blur-3xl pointer-events-none" />
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.11 } } }}
                    className="max-w-4xl mx-auto text-center space-y-6"
                >
                    {/* Badge */}
                    <motion.div
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                    >
                        <Zap className="size-3" /> B2B Inventory &amp; Supply Chain Platform
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } } }}
                        className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
                    >
                        One Platform.{" "}
                        <span className="text-primary relative inline-block">
                            Complete Supply
                            <motion.span
                                initial={{ scaleX: 0, originX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.75, duration: 0.55, ease: "easeOut" }}
                                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary/40 block"
                            />
                        </span>{" "}
                        Chain Control.
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                    >
                        CoreChain unifies your suppliers, inventory, orders, and warehouses — delivering real-time visibility to reduce waste, prevent stockouts, and improve profitability.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
                    >
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button size="lg" asChild className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-shadow">
                                <Link to="/signup">Start for Free <ChevronRight className="size-4" /></Link>
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                                <a href="#how-it-works">See How It Works</a>
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: 0.15 } } }}
                        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground"
                    >
                        {["No credit card required", "Multi-warehouse support", "Real-time stock tracking"].map((text) => (
                            <span key={text} className="flex items-center gap-1.5">
                                <CheckCircle className="size-3.5 text-primary" /> {text}
                            </span>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ── Stats bar ── */}
            <section className="border-y border-border/60 bg-muted/30">
                <StaggerGrid className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((s) => (
                        <motion.div key={s.label} variants={cardVariant} className="space-y-1">
                            <div className="text-2xl font-bold text-primary">{s.value}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
                        </motion.div>
                    ))}
                </StaggerGrid>
            </section>

            {/* ── Features ── */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <FadeUp className="text-center space-y-3 mb-14">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                            <Globe className="size-3" /> Everything you need
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Built for modern B2B operations
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Stop managing supply chains in spreadsheets. CoreChain brings every workflow into one unified platform.
                        </p>
                    </FadeUp>

                    <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f) => (
                            <motion.div
                                key={f.title}
                                variants={cardVariant}
                                whileHover={{ y: -5, transition: { duration: 0.22, ease: "easeOut" } }}
                                className="glass rounded-2xl border border-border p-6 space-y-3 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-shadow duration-200 cursor-default"
                            >
                                <motion.div
                                    whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
                                    className={`size-11 rounded-xl bg-gradient-to-br ${f.iconBg} flex items-center justify-center w-fit`}
                                >
                                    <f.icon className={`size-5 ${f.iconColor}`} />
                                </motion.div>
                                <h3 className="font-semibold">{f.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </StaggerGrid>
                </div>
            </section>

            {/* ── How it works ── */}
            <section id="how-it-works" className="py-24 px-6 bg-muted/30">
                <div className="max-w-4xl mx-auto">
                    <FadeUp className="text-center space-y-3 mb-14">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                            <Shield className="size-3" /> Simple setup
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Up and running in minutes</h2>
                    </FadeUp>

                    <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((s, i) => (
                            <motion.div key={s.num} variants={cardVariant} className="relative text-center space-y-3">
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-6 left-[60%] w-[80%] border-t border-dashed border-border" />
                                )}
                                <motion.div
                                    whileHover={{ scale: 1.08, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 18 }}
                                    className="inline-flex size-12 rounded-full border-2 border-primary/30 bg-primary/10 items-center justify-center"
                                >
                                    <span className="text-sm font-bold text-primary">{s.num}</span>
                                </motion.div>
                                <h3 className="font-semibold">{s.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </StaggerGrid>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="py-24 px-6">
                <FadeUp>
                    <div className="max-w-3xl mx-auto text-center rounded-2xl border border-primary/20 bg-primary/5 p-12 space-y-5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,oklch(0.52_0.22_264/0.08),transparent)] pointer-events-none" />
                        <div className="cta-pulse absolute inset-0 rounded-2xl border border-primary/15 pointer-events-none" />
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Stop managing supply chains in spreadsheets.
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Join businesses already using CoreChain to get real-time control over their entire supply chain.
                        </p>
                        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block">
                            <Button size="lg" asChild className="gap-2 shadow-lg shadow-primary/25">
                                <Link to="/signup">Start with CoreChain <ArrowRight className="size-4" /></Link>
                            </Button>
                        </motion.div>
                    </div>
                </FadeUp>
            </section>

            {/* ── Footer ── */}
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
