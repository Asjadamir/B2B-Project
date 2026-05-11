import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { checkAuthThunk } from "@/store/authSlice";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import InviteAcceptPage from "@/pages/InviteAcceptPage";
import DashboardPage from "@/pages/DashboardPage";

import BusinessLayout from "@/layouts/BusinessLayout";
import OverviewPage from "@/pages/business/OverviewPage";
import SuppliersPage from "@/pages/business/SuppliersPage";
import ProductsPage from "@/pages/business/ProductsPage";
import PurchaseOrdersPage from "@/pages/business/PurchaseOrdersPage";
import PurchaseOrderFormPage from "@/pages/business/PurchaseOrderFormPage";
import PurchaseOrderDetailPage from "@/pages/business/PurchaseOrderDetailPage";
import SaleOrdersPage from "@/pages/business/SaleOrdersPage";
import SaleOrderFormPage from "@/pages/business/SaleOrderFormPage";
import SaleOrderDetailPage from "@/pages/business/SaleOrderDetailPage";
import EmployeesPage from "@/pages/business/EmployeesPage";
import WarehousesPage from "@/pages/business/WarehousesPage";
import WarehouseDetailPage from "@/pages/business/WarehouseDetailPage";
import AuditLogsPage from "@/pages/business/AuditLogsPage";
import SupplierDetailPage from "@/pages/business/SupplierDetailPage";
import InventoryPage from "@/pages/business/InventoryPage";

function AppLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
    );
}

function PrivateRoute({ children }) {
    const { user, initializing } = useSelector((s) => s.auth);
    if (initializing) return <AppLoader />;
    return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
    const { user, initializing } = useSelector((s) => s.auth);
    if (initializing) return <AppLoader />;
    return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(checkAuthThunk());
    }, [dispatch]);

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />

                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
                    <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
                    <Route path="/invite/:token" element={<InviteAcceptPage />} />

                    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

                    <Route
                        path="/business/:id"
                        element={<PrivateRoute><BusinessLayout /></PrivateRoute>}
                    >
                        <Route index element={<Navigate to="overview" replace />} />
                        <Route path="overview" element={<OverviewPage />} />
                        <Route path="suppliers" element={<SuppliersPage />} />
                        <Route path="suppliers/:supplierId" element={<SupplierDetailPage />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
                        <Route path="purchase-orders/new" element={<PurchaseOrderFormPage />} />
                        <Route path="purchase-orders/:poId" element={<PurchaseOrderDetailPage />} />
                        <Route path="sale-orders" element={<SaleOrdersPage />} />
                        <Route path="sale-orders/new" element={<SaleOrderFormPage />} />
                        <Route path="sale-orders/:soId" element={<SaleOrderDetailPage />} />
                        <Route path="employees" element={<EmployeesPage />} />
                        <Route path="warehouses" element={<WarehousesPage />} />
                        <Route path="warehouses/:wId" element={<WarehouseDetailPage />} />
                        <Route path="inventory" element={<InventoryPage />} />
                        <Route path="audit-logs" element={<AuditLogsPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
        </ThemeProvider>
    );
}
