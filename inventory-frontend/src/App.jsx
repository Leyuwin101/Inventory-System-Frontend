import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthPage from "./pages/AuthPage";
import MainPage from "./pages/MainPage";
import ProductPage from "./pages/ProductPage";
import CategoryPage from "./pages/CategoryPage";
import SuppliersPage from "./pages/SuppliersPage";
import SalesPage from "./pages/SalesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import InventoryLogsPage from "./pages/InventoryLogsPage";

import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
    return (
        <BrowserRouter>
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

            </Routes>
        </BrowserRouter>
    );
}
