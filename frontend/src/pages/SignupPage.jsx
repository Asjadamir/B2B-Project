import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { signupThunk, clearAuthStatus } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eye, EyeOff, Link2, CheckCircle, Warehouse, ShoppingCart, Users } from "lucide-react";

const schema = z.object({
    fullName: z
        .string()
        .min(3, "Name must be at least 3 characters")
        .max(20, "Name must not exceed 20 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Must contain at least one symbol"),
});

const features = [
    { icon: Warehouse,    label: "Multi-warehouse inventory control" },
    { icon: ShoppingCart, label: "Purchase & sale order automation" },
    { icon: Users,        label: "Role-based team management" },
];

function PasswordStrength({ password }) {
    if (!password) return null;
    const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
    const score = checks.filter(Boolean).length;
    const levels = [
        { label: "Weak",   color: "bg-destructive" },
        { label: "Fair",   color: "bg-yellow-500" },
        { label: "Good",   color: "bg-blue-500" },
        { label: "Strong", color: "bg-green-500" },
    ];
    const level = levels[Math.max(0, score - 1)];
    return (
        <div className="space-y-1.5">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i < score ? level.color : "bg-muted"}`}
                        initial={false}
                        animate={{ opacity: i < score ? 1 : 0.4 }}
                        transition={{ duration: 0.25 }}
                    />
                ))}
            </div>
            <p className="text-xs text-muted-foreground">{level.label} password</p>
        </div>
    );
}

export default function SignupPage() {
    const dispatch = useDispatch();
    const { loading, error, successMessage } = useSelector((s) => s.auth);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: zodResolver(schema),
    });
    const password = watch("password", "");

    useEffect(() => () => dispatch(clearAuthStatus()), [dispatch]);

    const onSubmit = (data) => dispatch(signupThunk(data));

    if (successMessage) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className="max-w-sm w-full text-center space-y-4"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 22 }}
                        className="size-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto"
                    >
                        <CheckCircle className="size-8 text-green-500" />
                    </motion.div>
                    <h2 className="text-2xl font-bold">Check your email</h2>
                    <p className="text-muted-foreground">{successMessage}</p>
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/login">Back to sign in</Link>
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* ── Branding panel ── */}
            <motion.div
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="hidden lg:flex flex-col w-1/2 bg-primary p-12 text-primary-foreground relative overflow-hidden"
            >
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
                            Start managing your supply chain today.
                        </h2>
                        <p className="text-primary-foreground/80 leading-relaxed">Free to get started. No credit card required.</p>
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
                            <Link to="/login">Sign in</Link>
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
                            <h1 className="text-2xl font-bold">Create your account</h1>
                            <p className="text-sm text-muted-foreground">Start your free CoreChain account today</p>
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
                                <Label htmlFor="fullName">Full name</Label>
                                <Input id="fullName" placeholder="Jane Smith" {...register("fullName")} className={errors.fullName ? "border-destructive" : ""} />
                                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email address</Label>
                                <Input id="email" type="email" placeholder="you@company.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 characters"
                                        {...register("password")}
                                        className={errors.password ? "border-destructive pr-10" : "pr-10"}
                                    />
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword((v) => !v)}>
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {errors.password ? (
                                    <p className="text-xs text-destructive">{errors.password.message}</p>
                                ) : (
                                    <PasswordStrength password={password} />
                                )}
                            </div>

                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                <Button type="submit" className="w-full shadow-sm" disabled={loading}>
                                    {loading ? "Creating account…" : "Create account"}
                                </Button>
                            </motion.div>
                        </form>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
