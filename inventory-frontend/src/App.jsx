import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const MainPage = lazy(() => import("./pages/MainPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SuppliersPage = lazy(() => import("./pages/SuppliersPage"));
const ProductSuppliersPage = lazy(() => import("./pages/ProductSuppliersPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const InventoryLogsPage = lazy(() => import("./pages/InventoryLogsPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));

const PageFallback = () => (
    <div className="min-h-screen bg-[var(--bg)] p-6 text-[var(--text)]">
        <div className="mx-auto max-w-6xl space-y-4">
            <div className="h-10 w-56 animate-pulse rounded-lg bg-[var(--input-bg)]" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-28 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--card-bg)]" />
                ))}
            </div>
        </div>
    </div>
);

export default function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
                <Routes>

                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<AuthPage />} />

                <Route
                    path="/main"
                    element={
                        <ProtectedRoute>
                            <MainPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <ProductPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/inventory"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "INVENTORY_CLERK", "CASHIER"]}>
                            <CategoryPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/suppliers"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "INVENTORY_CLERK"]}>
                            <SuppliersPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/product-suppliers"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                            <ProductSuppliersPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/sales"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "CASHIER"]}>
                            <SalesPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                            <ReportsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/inventory-logs"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "INVENTORY_CLERK"]}>
                            <InventoryLogsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <SettingsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/members"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                            <UsersPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/users" element={<Navigate to="/members" replace />} />

                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}
