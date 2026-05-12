import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { loginThunk, clearAuthStatus } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eye, EyeOff, Link2, Package, Truck, BarChart3 } from "lucide-react";

const schema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

const features = [
    { icon: Package,  label: "Real-time inventory tracking" },
    { icon: Truck,    label: "Automated order processing" },
    { icon: BarChart3,label: "Actionable analytics & reports" },
];

export default function LoginPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, user } = useSelector((s) => s.auth);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        if (user) navigate("/dashboard");
    }, [user, navigate]);

    useEffect(() => () => dispatch(clearAuthStatus()), [dispatch]);

    const onSubmit = (data) => dispatch(loginThunk(data));

    return (
        <div className="min-h-screen flex">
            {/* ── Branding panel ── */}
            <motion.div
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="hidden lg:flex flex-col w-1/2 bg-primary p-12 text-primary-foreground relative overflow-hidden"
            >
                {/* Background orbs */}
                <div className="orb-float     absolute -top-24 -right-24 size-72 rounded-full bg-white/5  blur-3xl pointer-events-none" />
                <div className="orb-float-alt absolute -bottom-24 -left-24 size-80 rounded-full bg-white/5  blur-3xl pointer-events-none" />

                <motion.div
                    className="flex items-center gap-2 mb-auto"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="size-7 rounded-md bg-primary-foreground/20 flex items-center justify-center">
                        <Link2 className="size-4" />
                    </div>
                    <span className="font-bold text-lg">CoreChain</span>
                </motion.div>

                <div className="space-y-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <h2 className="text-3xl font-bold leading-tight mb-3">
                            One Platform.<br />Complete Supply Chain Control.
                        </h2>
                        <p className="text-primary-foreground/80 leading-relaxed">
                            Manage suppliers, inventory, orders and warehouses from a single unified dashboard.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.14, delayChildren: 0.6 } } }}
                        className="space-y-4"
                    >
                        {features.map(({ icon: Icon, label }) => (
                            <motion.div
                                key={label}
                                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.45 } } }}
                                className="flex items-center gap-3"
                            >
                                <div className="size-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center shrink-0">
                                    <Icon className="size-4" />
                                </div>
                                <span className="text-sm text-primary-foreground/90">{label}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="text-xs text-primary-foreground/50 mt-auto"
                >
                    © {new Date().getFullYear()} CoreChain
                </motion.p>
            </motion.div>

            {/* ── Form panel ── */}
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex-1 flex flex-col bg-background"
            >
                <div className="flex items-center justify-between p-6 lg:justify-end">
                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="size-6 rounded bg-primary flex items-center justify-center">
                            <Link2 className="size-3.5 text-primary-foreground" />
                        </div>
                        <span className="font-bold">CoreChain</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/signup">Create account</Link>
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center px-6 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="w-full max-w-sm space-y-6"
                    >
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold">Welcome back</h1>
                            <p className="text-sm text-muted-foreground">Sign in to your CoreChain account</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    {...register("email")}
                                    className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        {...register("password")}
                                        className={errors.password ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowPassword((v) => !v)}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                            </div>

                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                <Button type="submit" className="w-full shadow-sm" disabled={loading}>
                                    {loading ? "Signing in…" : "Sign in"}
                                </Button>
                            </motion.div>
                        </form>

                        <p className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link to="/signup" className="text-primary font-medium hover:underline">
                                Get started free
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
