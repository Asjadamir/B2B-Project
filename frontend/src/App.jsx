import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import DashboardPage from "@/pages/DashboardPage";
import BusinessPage from "@/pages/BusinessPage";

function PrivateRoute({ children }) {
    const { user } = useSelector((s) => s.auth);
    return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
    const { user } = useSelector((s) => s.auth);
    return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
    return (
        <div className="dark">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
                    <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

                    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/business/:id" element={<PrivateRoute><BusinessPage /></PrivateRoute>} />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}
