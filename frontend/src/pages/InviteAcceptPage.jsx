import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as api from "@/lib/api";
import { checkAuthThunk } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link2, Building2, Shield, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

const newUserSchema = z.object({
    fullName: z.string().min(3, "Name must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const existingUserSchema = z.object({
    password: z.string().min(1, "Password is required"),
});

export default function InviteAcceptPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [inviteInfo, setInviteInfo] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        api.getInviteInfo(token)
            .then((data) => setInviteInfo(data))
            .catch((e) => setPageError(e.message))
            .finally(() => setPageLoading(false));
    }, [token]);

    const schema = inviteInfo?.isExistingUser ? existingUserSchema : newUserSchema;
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });

    async function onSubmit(data) {
        setSubmitLoading(true);
        setSubmitError(null);
        try {
            await api.acceptInvite(token, data);
            setSuccess(true);
            await dispatch(checkAuthThunk());
            setTimeout(() => navigate("/dashboard"), 1500);
        } catch (e) {
            setSubmitError(e.message);
        } finally {
            setSubmitLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
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

                    {pageLoading && (
                        <div className="text-center space-y-3">
                            <div className="size-12 rounded-full bg-muted animate-pulse mx-auto" />
                            <p className="text-muted-foreground text-sm">Loading invitation…</p>
                        </div>
                    )}

                    {pageError && (
                        <div className="text-center space-y-4">
                            <div className="size-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                                <XCircle className="size-7 text-destructive" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-xl font-bold">Invalid Invitation</h1>
                                <p className="text-sm text-muted-foreground">{pageError}</p>
                            </div>
                            <Button asChild variant="outline" className="w-full">
                                <Link to="/login">Go to sign in</Link>
                            </Button>
                        </div>
                    )}

                    {success && (
                        <div className="text-center space-y-4">
                            <div className="size-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                                <CheckCircle className="size-7 text-green-500" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-xl font-bold">Welcome aboard!</h1>
                                <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
                            </div>
                        </div>
                    )}

                    {inviteInfo && !success && (
                        <>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-bold">You're invited</h1>
                                    <p className="text-sm text-muted-foreground">
                                        {inviteInfo.isExistingUser
                                            ? "Sign in with your existing password to join."
                                            : "Create a password to set up your account and join."}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2.5">
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <Building2 className="size-4 text-muted-foreground shrink-0" />
                                        <span className="font-medium">{inviteInfo.businessName}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <Shield className="size-4 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground">Role:</span>
                                        <Badge variant="secondary" className="text-xs">{inviteInfo.roleName}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <span className="text-muted-foreground text-xs">Joining as</span>
                                        <span className="text-sm font-medium">{inviteInfo.email}</span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {submitError && (
                                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                                        {submitError}
                                    </div>
                                )}

                                {!inviteInfo.isExistingUser && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="fullName">Full name</Label>
                                        <Input
                                            id="fullName"
                                            placeholder="Jane Smith"
                                            {...register("fullName")}
                                            className={errors.fullName ? "border-destructive" : ""}
                                        />
                                        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="password">
                                        {inviteInfo.isExistingUser ? "Your password" : "Create a password"}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder={inviteInfo.isExistingUser ? "Enter your password" : "Min. 8 characters"}
                                            {...register("password")}
                                            className={errors.password ? "border-destructive pr-10" : "pr-10"}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowPassword((v) => !v)}
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                                </div>

                                <Button type="submit" className="w-full" disabled={submitLoading}>
                                    {submitLoading ? "Joining…" : `Join ${inviteInfo.businessName}`}
                                </Button>
                            </form>

                            {inviteInfo.isExistingUser && (
                                <p className="text-center text-xs text-muted-foreground">
                                    Forgot your password?{" "}
                                    <Link to="/forgot-password" className="text-primary hover:underline">Reset it</Link>
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
