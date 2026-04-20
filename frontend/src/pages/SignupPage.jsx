import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signupThunk, clearAuthStatus } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eye, EyeOff, Link2, CheckCircle, Warehouse, ShoppingCart, Users } from "lucide-react";

const schema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
});

function PasswordStrength({ password }) {
    if (!password) return null;
    const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), password.length >= 12];
    const score = checks.filter(Boolean).length;
    const levels = [
        { label: "Weak", color: "bg-destructive" },
        { label: "Fair", color: "bg-yellow-500" },
        { label: "Good", color: "bg-blue-500" },
        { label: "Strong", color: "bg-green-500" },
    ];
    const level = levels[Math.max(0, score - 1)];
    return (
        <div className="space-y-1.5">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? level.color : "bg-muted"}`} />
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
                <div className="max-w-sm w-full text-center space-y-4">
                    <div className="size-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                        <CheckCircle className="size-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold">Check your email</h2>
                    <p className="text-muted-foreground">{successMessage}</p>
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/login">Back to sign in</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex flex-col w-1/2 bg-primary p-12 text-primary-foreground">
                <div className="flex items-center gap-2 mb-auto">
                    <div className="size-7 rounded-md bg-primary-foreground/20 flex items-center justify-center">
                        <Link2 className="size-4" />
                    </div>
                    <span className="font-bold text-lg">CoreChain</span>
                </div>
                <div className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold leading-tight mb-3">Start managing your supply chain today.</h2>
                        <p className="text-primary-foreground/80 leading-relaxed">Free to get started. No credit card required.</p>
                    </div>
                    <div className="space-y-4">
                        {[
                            { icon: Warehouse, label: "Multi-warehouse inventory control" },
                            { icon: ShoppingCart, label: "Purchase & sale order automation" },
                            { icon: Users, label: "Role-based team management" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
                                    <Icon className="size-4" />
                                </div>
                                <span className="text-sm text-primary-foreground/90">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-primary-foreground/50 mt-auto">© {new Date().getFullYear()} CoreChain</p>
            </div>

            <div className="flex-1 flex flex-col bg-background">
                <div className="flex items-center justify-between p-6 lg:justify-end">
                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="size-6 rounded bg-primary flex items-center justify-center">
                            <Link2 className="size-3.5 text-primary-foreground" />
                        </div>
                        <span className="font-bold">CoreChain</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold">Create your account</h1>
                            <p className="text-sm text-muted-foreground">Start your free CoreChain account today</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">{error}</div>
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
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword((v) => !v)}>
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {errors.password ? (
                                    <p className="text-xs text-destructive">{errors.password.message}</p>
                                ) : (
                                    <PasswordStrength password={password} />
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Creating account…" : "Create account"}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
