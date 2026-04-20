import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPasswordThunk, clearAuthStatus } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eye, EyeOff, Link2, CheckCircle } from "lucide-react";

const schema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
});

export default function ResetPasswordPage() {
    const { token } = useParams();
    const dispatch = useDispatch();
    const { loading, error, successMessage } = useSelector((s) => s.auth);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

    useEffect(() => () => dispatch(clearAuthStatus()), [dispatch]);

    const onSubmit = ({ password }) => dispatch(resetPasswordThunk({ token, password }));

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-2">
                    <div className="size-6 rounded bg-primary flex items-center justify-center">
                        <Link2 className="size-3.5 text-primary-foreground" />
                    </div>
                    <span className="font-bold">CoreChain</span>
                </div>
                <ThemeToggle />
            </div>

            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm space-y-6">
                    {successMessage ? (
                        <div className="space-y-4 text-center">
                            <div className="size-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                                <CheckCircle className="size-8 text-green-500" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold">Password updated</h1>
                                <p className="text-sm text-muted-foreground">{successMessage}</p>
                            </div>
                            <Button asChild className="w-full"><Link to="/login">Sign in now</Link></Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold">Set new password</h1>
                                <p className="text-sm text-muted-foreground">Choose a strong password for your CoreChain account.</p>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {error && (
                                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">{error}</div>
                                )}
                                <div className="space-y-1.5">
                                    <Label htmlFor="password">New password</Label>
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
                                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Updating…" : "Update password"}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
