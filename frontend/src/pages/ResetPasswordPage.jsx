import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordThunk, clearAuthStatus } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
    const { token } = useParams();
    const dispatch = useDispatch();
    const { loading, error, successMessage } = useSelector((s) => s.auth);
    const [password, setPassword] = useState("");

    useEffect(() => () => dispatch(clearAuthStatus()), [dispatch]);

    async function handleSubmit(e) {
        e.preventDefault();
        dispatch(resetPasswordThunk({ token, password }));
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">Set new password</CardTitle>
                    <CardDescription>Enter your new password below</CardDescription>
                </CardHeader>
                <CardContent>
                    {successMessage ? (
                        <div className="space-y-4">
                            <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-md px-3 py-2">
                                {successMessage}
                            </p>
                            <Link to="/login">
                                <Button className="w-full">Go to Login</Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                                    {error}
                                </p>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Saving…" : "Save new password"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
