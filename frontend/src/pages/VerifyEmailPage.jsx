import { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { verifyEmailThunk } from "@/store/authSlice.js";
import { Button } from "@/components/ui/button.jsx";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";

export default function VerifyEmailPage() {
    const { token } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, successMessage } = useSelector((s) => s.auth);

    useEffect(() => {
        dispatch(verifyEmailThunk(token));
    }, [token, dispatch]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => navigate("/login"), 2000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">
                        Email Verification
                    </CardTitle>
                    <CardDescription>
                        Verifying your email address…
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading && (
                        <p className="text-muted-foreground text-sm">
                            Please wait…
                        </p>
                    )}
                    {successMessage && (
                        <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-md px-3 py-2">
                            {successMessage} Redirecting to login…
                        </p>
                    )}
                    {error && (
                        <>
                            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                                {error}
                            </p>
                            <Link to="/signup">
                                <Button variant="outline" className="w-full">
                                    Back to Sign up
                                </Button>
                            </Link>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
