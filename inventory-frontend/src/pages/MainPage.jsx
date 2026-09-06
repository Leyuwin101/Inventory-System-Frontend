import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import { useAuth } from "../components/context/AuthContext";
import { getAllProducts, getLowStockProducts } from "../api/products";
import { getAllSales, getSalesByUser } from "../api/sales";
import { getAllCategories } from "../api/categories";
import { getDashboardSummary } from "../api/dashboard";
import { 
    Activity, 
    AlertTriangle, 
    Folder, 
    Loader2, 
    AlertCircle,
    UserCheck
} from "lucide-react";
import StatsGrid from "../components/dashboard/StatsGrid";
import RecentActivity from "../components/dashboard/RecentActivity";
import LowStockAlerts from "../components/dashboard/LowStockAlerts";
import CategoryBreakdown from "../components/dashboard/CategoryBreakdown";
import { getPageCache, setPageCache } from "../store/pageCache";

export default function MainPage() {
    const { user } = useAuth();
    const cachedDashboardRef = useRef(getPageCache("dashboard"));
    const cachedDashboard = cachedDashboardRef.current;
    const [products, setProducts] = useState(cachedDashboard?.products || []);
    const [lowStock, setLowStock] = useState(cachedDashboard?.lowStock || []);
    const [categories, setCategories] = useState(cachedDashboard?.categories || []);
    const [sales, setSales] = useState(cachedDashboard?.sales || []);
    const [summary, setSummary] = useState(cachedDashboard?.summary || null);
    const [loading, setLoading] = useState(!cachedDashboard);
    const [error, setError] = useState(null);
    const loadingRef = useRef(false);
    const mountedRef = useRef(false);

    // Authority Checks
    const role = useMemo(() => user?.role?.replace("ROLE_", "").toUpperCase() || "", [user?.role]);
    const userId = user?.id || user?.userID || user?.userId || user?.user_id;
    const username = user?.username || "";
    const isAdminOrManager = ["ADMIN", "MANAGER"].includes(role);
    const canViewAllSales = ["ADMIN", "MANAGER", "GUEST"].includes(role);
    const isCashier = role === "CASHIER";

    const loadDashboardData = useCallback(async () => {
        if (!role || loadingRef.current) return;
        loadingRef.current = true;
        try {
            setLoading(true);
            setError(null);

            // Build parallel promises list with safe fallback catches 
            // so individual API failures do not brick the entire dashboard.
            const promises = [
                getDashboardSummary().catch(err => {
                    console.error("Failed to load dashboard summary", err);
                    return null;
                }),
                getAllProducts().catch(err => {
                    console.error("Failed to load products for dashboard", err);
                    return [];
                }),
                getLowStockProducts().catch(err => {
                    console.error("Failed to load low stock items for dashboard", err);
                    return [];
                }),
                getAllCategories().catch(err => {
                    console.error("Failed to load categories for dashboard", err);
                    return [];
                })
            ];

            // Sales list based on cashier vs admin/manager
            if (canViewAllSales) {
                promises.push(
                    getAllSales().catch(err => {
                        console.error("Failed to load all sales for dashboard", err);
                        return [];
                    })
                );
            } else if (isCashier && userId) {
                promises.push(
                    getSalesByUser(userId).catch(err => {
                        console.error("Failed to load cashier sales for dashboard", err);
                        return [];
                    })
                );
            } else {
                promises.push(Promise.resolve([]));
            }

            const [summaryData, productsData, lowStockData, categoriesData, salesData] = await Promise.all(promises);

            if (!mountedRef.current) return;

            setSummary(summaryData);
            setProducts(Array.isArray(productsData) ? productsData : productsData.data || []);
            setLowStock(Array.isArray(lowStockData) ? lowStockData : lowStockData.data || []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.data || []);
            setSales(Array.isArray(salesData) ? salesData : salesData.data || []);
            setPageCache("dashboard", {
                summary: summaryData,
                products: Array.isArray(productsData) ? productsData : productsData.data || [],
                lowStock: Array.isArray(lowStockData) ? lowStockData : lowStockData.data || [],
                categories: Array.isArray(categoriesData) ? categoriesData : categoriesData.data || [],
                sales: Array.isArray(salesData) ? salesData : salesData.data || [],
            });

        } catch (err) {
            console.error("Dashboard parallel fetch failed:", err);
            if (mountedRef.current) {
                setError("Failed to fetch dashboard data. Please try again.");
            }
        } finally {
            loadingRef.current = false;
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [canViewAllSales, isCashier, role, userId]);

    useEffect(() => {
        mountedRef.current = true;
        let timeoutId;

        if (!cachedDashboard) {
            timeoutId = window.setTimeout(() => {
                loadDashboardData();
            }, 0);
        }

        return () => {
            if (timeoutId) window.clearTimeout(timeoutId);
            mountedRef.current = false;
        };
    }, [cachedDashboard, loadDashboardData]);

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-[var(--text-h)] flex items-center gap-2">
                        Dashboard Overview
                        {loading && products.length > 0 && (
                            <Loader2 size={18} className="animate-spin text-[var(--accent)] ml-2" />
                        )}
                    </h1>
                    <p className="text-sm text-[var(--muted)] mt-1 flex items-center gap-1.5">
                        <UserCheck size={14} className="text-[var(--accent)]" />
                        Welcome to SariStore IMS control panel, <span className="font-semibold text-[var(--text-h)]">{username || "loading..."}</span> ({role || "loading"})
                    </p>
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-1 rounded transition text-xs font-semibold"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* MAIN DASHBOARD CONTENT */}
            {loading && products.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                    <Loader2 size={36} className="animate-spin text-[var(--accent)]" />
                    <span className="mt-4 text-sm text-[var(--muted)]">Assembling retail operations data...</span>
                </div>
            ) : (
                <div className={`space-y-6 ${loading ? "opacity-60 pointer-events-none" : ""} transition-opacity duration-200`}>
                    {/* STATS WIDGETS */}
                    <StatsGrid 
                        products={products} 
                        sales={sales} 
                        lowStockCount={lowStock.length} 
                        summary={summary}
                    />

                    {/* DETAILED MONITOR PANELS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1. RECENT TRANSACTIONS */}
                        <Card title="Recent Transactions" icon={<Activity size={16} />}>
                            <div className="mt-3">
                                <RecentActivity sales={sales} />
                            </div>
                        </Card>

                        {/* 2. CRITICAL STOCK ALERTS */}
                        <Card title="Low Stock Alerts" icon={<AlertTriangle size={16} className="text-rose-400" />}>
                            <div className="mt-3">
                                <LowStockAlerts lowStockProducts={lowStock} />
                            </div>
                        </Card>

                        {/* 3. CATEGORY DISTRIBUTION */}
                        <Card title="Category Breakdown" icon={<Folder size={16} className="text-blue-400" />}>
                            <div className="mt-3">
                                <CategoryBreakdown products={products} categories={categories} />
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
