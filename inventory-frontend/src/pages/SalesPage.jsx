import { useCallback, useEffect, useState, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../components/context/AuthContext";
import { getAllProducts } from "../api/products";
import { 
    getAllSales, 
    getSalesByUser, 
    cancelSale 
} from "../api/sales";
import { 
    ShoppingCart, 
    Loader2, 
    AlertCircle, 
    CheckCircle 
} from "lucide-react";
import PosTerminal from "../components/sales/PosTerminal";
import SalesLedger from "../components/sales/SalesLedger";
import { clearPageCache, getPageCache, setPageCache } from "../store/pageCache";

const getSaleId = (sale = {}) =>
    sale.id ?? sale.saleId ?? sale.saleID ?? sale.salesID ?? sale.sale_id ?? sale.sales_id;

export default function SalesPage() {
    const { user: currentUser } = useAuth();
    const role = currentUser?.role?.replace("ROLE_", "").toUpperCase() || "";
    const cacheKey = `sales-page:${role}:${currentUser?.userID || currentUser?.userId || currentUser?.id || "unknown"}`;
    const cachedSalesPage = getPageCache(cacheKey);
    const defaultActiveTab = role === "CASHIER" ? "pos" : "history";

    const [sales, setSales] = useState(cachedSalesPage?.sales || []);
    const [products, setProducts] = useState(cachedSalesPage?.products || []);
    const [loading, setLoading] = useState(!cachedSalesPage);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(defaultActiveTab); // pos vs history
    const [successMessage, setSuccessMessage] = useState(null);

    const activeFetchRef = useRef(0);
    const loadingRef = useRef(false);
    const mountedRef = useRef(false);

    // Authority Checks
    const isAdminOrManager = ["ADMIN", "MANAGER"].includes(role);
    const canCheckout = ["ADMIN", "CASHIER"].includes(role);

    const loadInitialData = useCallback(async () => {
        if (!currentUser || loadingRef.current) return;
        loadingRef.current = true;
        activeFetchRef.current += 1;
        const currentFetchId = activeFetchRef.current;
        try {
            setLoading(true);
            setError(null);
            
            // Parallel load
            const promises = [];
            if (canCheckout) {
                promises.push(getAllProducts());
            } else {
                promises.push(Promise.resolve([]));
            }

            if (isAdminOrManager) {
                promises.push(getAllSales());
            } else if (currentUser) {
                const uId = currentUser.id || currentUser.userID || currentUser.userId || currentUser.user_id;
                promises.push(getSalesByUser(uId));
            } else {
                promises.push(Promise.resolve([]));
            }

            const [productsData, salesData] = await Promise.all(promises);
            
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;

            const nextProducts = Array.isArray(productsData) ? productsData : productsData.data || productsData.products || [];
            const nextSales = Array.isArray(salesData) ? salesData : salesData.data || [];
            setProducts(nextProducts);
            setSales(nextSales);
            setPageCache(cacheKey, { products: nextProducts, sales: nextSales });
        } catch (err) {
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;
            console.error(err);
            setError(err.response?.data?.message || "Failed to load sales data");
        } finally {
            loadingRef.current = false;
            if (currentFetchId === activeFetchRef.current && mountedRef.current) {
                setLoading(false);
            }
        }
    }, [cacheKey, canCheckout, currentUser, isAdminOrManager]);

    useEffect(() => {
        mountedRef.current = true;
        if (!cachedSalesPage) {
            Promise.resolve().then(loadInitialData);
        }

        return () => {
            mountedRef.current = false;
        };
    }, [cachedSalesPage, loadInitialData]);

    const handleCheckoutSuccess = (successReceipt) => {
        setSuccessMessage(successReceipt);
        clearPageCache("sales-page:");
        clearPageCache("dashboard");
        loadInitialData(); // Reload sales history and product stock counts
    };

    const handleCancelSale = async (sale) => {
        const sId = getSaleId(sale);
        if (!sId) {
            alert("Unable to cancel this sale because its sale ID is missing.");
            return;
        }

        if (!window.confirm(`Are you sure you want to refund/cancel Sale #${sId}? This will reverse inventory stock.`)) return;

        try {
            setLoading(true);
            await cancelSale(sId);
            clearPageCache("sales-page:");
            clearPageCache("dashboard");
            await loadInitialData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to cancel/refund sale");
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-h)] flex items-center gap-2">
                        <ShoppingCart className="text-[var(--accent)]" size={24} />
                        Sales Transactions
                        {loading && (sales.length > 0 || products.length > 0) && (
                            <Loader2 size={18} className="animate-spin text-[var(--accent)] ml-2" />
                        )}
                    </h1>
                    <p className="text-sm text-[var(--muted)] mt-1">
                        Record checkouts, execute retail purchases, and track revenue ledgers
                    </p>
                </div>

                {/* TAB CONTROLS */}
                <div className="grid w-full grid-cols-1 gap-1 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] p-1 sm:w-auto sm:grid-flow-col sm:auto-cols-max">
                    {canCheckout && (
                        <button
                            onClick={() => {
                                setActiveTab("pos");
                                setSuccessMessage(null);
                            }}
                            className={`min-h-11 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                                activeTab === "pos"
                                    ? "bg-[var(--accent)] text-[var(--accent-text)]"
                                    : "text-[var(--muted)] hover:text-[var(--text-h)]"
                            }`}
                        >
                            Point of Sale (POS)
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`min-h-11 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                            activeTab === "history"
                                    ? "bg-[var(--accent)] text-[var(--accent-text)]"
                                    : "text-[var(--muted)] hover:text-[var(--text-h)]"
                        }`}
                    >
                        {isAdminOrManager ? "Revenue Ledger" : "My Sales Log"}
                    </button>
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between gap-3">
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

            {/* SUCCESS RECEIPT DRAWER */}
            {successMessage && (
                <div className="mb-6 p-5 rounded-xl border border-green-500/30 bg-green-500/5 text-green-400 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <CheckCircle size={24} className="mt-0.5 text-green-400 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-[var(--text-h)]">Checkout Successful!</h3>
                            <p className="text-xs text-[var(--muted)] mt-1">
                                Sold {successMessage.itemsCount} products for total of <span className="font-semibold text-green-400">₱{successMessage.total.toLocaleString()}</span>. 
                                Cash received: ₱{successMessage.received.toLocaleString()}. Change returned: <span className="underline">₱{successMessage.change.toLocaleString()}</span>.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 transition whitespace-nowrap"
                    >
                        New Transaction
                    </button>
                </div>
            )}

            {/* LOADING STATE */}
            {loading && sales.length === 0 && products.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                    <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                    <span className="mt-3 text-sm text-[var(--muted)]">Loading POS records...</span>
                </div>
            ) : (
                <div className={`${loading ? "opacity-60 pointer-events-none" : ""} transition-opacity duration-200`}>
                    {activeTab === "pos" ? (
                        /* TAB 1: POINT OF SALE CHECKOUT */
                        <PosTerminal
                            products={products}
                            currentUser={currentUser}
                            onCheckoutSuccess={handleCheckoutSuccess}
                        />
                    ) : (
                        /* TAB 2: SALES TRANSACTION LOGS / LEDGER */
                        <SalesLedger
                            sales={sales}
                            isAdminOrManager={isAdminOrManager}
                            onCancelSale={handleCancelSale}
                        />
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
