import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPasswordThunk, clearAuthStatus } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Link2, Mail } from "lucide-react";

const schema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
    const dispatch = useDispatch();
    const { loading, error, successMessage } = useSelector((s) => s.auth);

    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

    useEffect(() => () => dispatch(clearAuthStatus()), [dispatch]);

    const onSubmit = (data) => dispatch(forgotPasswordThunk(data));

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
                    <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" asChild>
                        <Link to="/login"><ArrowLeft className="size-3.5" /> Back to sign in</Link>
                    </Button>

                    {successMessage ? (
                        <div className="space-y-4">
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="size-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold">Check your email</h1>
                                <p className="text-sm text-muted-foreground">{successMessage}</p>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <Link to="/login">Back to sign in</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold">Reset your password</h1>
                                <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {error && (
                                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">{error}</div>
                                )}
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input id="email" type="email" placeholder="you@company.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Sending…" : "Send reset link"}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
