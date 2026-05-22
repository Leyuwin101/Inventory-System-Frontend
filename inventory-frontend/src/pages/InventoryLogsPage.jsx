/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getInventoryLogs } from "../api/inventoryLogs";
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    CalendarDays,
    ClipboardList,
    Filter,
    PackageSearch,
    RefreshCw,
    SlidersHorizontal,
} from "lucide-react";
import { getPageCache, setPageCache } from "../store/pageCache";

const ITEMS_PER_PAGE = 10;

const fallbackLogs = [
    {
        id: "INV-1008",
        date: "2026-05-21",
        productName: "Coca-Cola Original Taste 1.5L",
        sku: "BEV-COCA-15",
        type: "STOCK_IN",
        quantity: 48,
        previousStock: 22,
        newStock: 70,
        reason: "Supplier delivery",
        userName: "Manager",
    },
    {
        id: "INV-1007",
        date: "2026-05-20",
        productName: "Nescafe 3-in-1 Original",
        sku: "COF-NES-30",
        type: "STOCK_OUT",
        quantity: 18,
        previousStock: 31,
        newStock: 13,
        reason: "POS sale",
        userName: "Cashier",
    },
    {
        id: "INV-1006",
        date: "2026-05-19",
        productName: "Lucky Me Pancit Canton",
        sku: "NDL-LME-PC",
        type: "ADJUSTMENT",
        quantity: -4,
        previousStock: 86,
        newStock: 82,
        reason: "Damaged items audit",
        userName: "Inventory Clerk",
    },
];

const normalizeLogsPayload = (payload) => {
    const rows = payload?.logs || payload?.inventoryLogs || payload?.content || payload?.items || payload;

    if (Array.isArray(rows)) {
        return {
            rows,
            totalItems: payload?.totalItems || payload?.totalElements || rows.length,
            totalPages: payload?.totalPages || Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE)),
        };
    }

    return {
        rows: [],
        totalItems: 0,
        totalPages: 1,
    };
};

const typeConfig = {
    STOCK_IN: {
        label: "Stock In",
        icon: ArrowDownLeft,
        className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
    },
    STOCK_OUT: {
        label: "Stock Out",
        icon: ArrowUpRight,
        className: "bg-rose-500/10 text-rose-500 border-rose-500/25",
    },
    ADJUSTMENT: {
        label: "Adjustment",
        icon: SlidersHorizontal,
        className: "bg-amber-500/10 text-amber-500 border-amber-500/25",
    },
};

export default function InventoryLogsPage() {
    const initialCache = getPageCache("inventory-logs:1::::");
    const [logs, setLogs] = useState(initialCache?.logs || []);
    const [loading, setLoading] = useState(!initialCache);
    const [error, setError] = useState("");
    const [usingFallback, setUsingFallback] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        product: "",
        type: "",
    });
    const activeFetchRef = useRef(0);
    const loadingRef = useRef(false);
    const mountedRef = useRef(false);

    const filteredFallbackLogs = useMemo(() => {
        return fallbackLogs.filter((log) => {
            const matchesProduct = !filters.product || log.productName.toLowerCase().includes(filters.product.toLowerCase()) || log.sku.toLowerCase().includes(filters.product.toLowerCase());
            const matchesType = !filters.type || log.type === filters.type;
            const matchesStart = !filters.startDate || log.date >= filters.startDate;
            const matchesEnd = !filters.endDate || log.date <= filters.endDate;
            return matchesProduct && matchesType && matchesStart && matchesEnd;
        });
    }, [filters]);

    const loadLogs = async () => {
        const cacheKey = `inventory-logs:${page}:${filters.startDate}:${filters.endDate}:${filters.product}:${filters.type}`;
        const cached = getPageCache(cacheKey);
        if (cached) {
            setLogs(cached.logs);
            setTotalItems(cached.totalItems);
            setTotalPages(cached.totalPages);
            setUsingFallback(cached.usingFallback);
            setLoading(false);
            return;
        }

        if (loadingRef.current) return;
        loadingRef.current = true;
        activeFetchRef.current += 1;
        const fetchId = activeFetchRef.current;

        try {
            setLoading(true);
            setError("");
            const payload = await getInventoryLogs({ page, limit: ITEMS_PER_PAGE, ...filters });
            if (fetchId !== activeFetchRef.current || !mountedRef.current) return;

            const normalized = normalizeLogsPayload(payload);
            setLogs(normalized.rows);
            setTotalItems(normalized.totalItems);
            setTotalPages(normalized.totalPages);
            setUsingFallback(false);
            setPageCache(cacheKey, {
                logs: normalized.rows,
                totalItems: normalized.totalItems,
                totalPages: normalized.totalPages,
                usingFallback: false,
            });
        } catch (err) {
            if (fetchId !== activeFetchRef.current || !mountedRef.current) return;
            const status = err.response?.status;

            if (status === 404 || status === 405 || !status) {
                setLogs(filteredFallbackLogs);
                setTotalItems(filteredFallbackLogs.length);
                setTotalPages(1);
                setUsingFallback(true);
                setError("");
                setPageCache(cacheKey, {
                    logs: filteredFallbackLogs,
                    totalItems: filteredFallbackLogs.length,
                    totalPages: 1,
                    usingFallback: true,
                });
            } else {
                setLogs([]);
                setTotalItems(0);
                setTotalPages(1);
                setUsingFallback(false);
                setError(err.response?.data?.message || "Failed to load inventory logs.");
            }
        } finally {
            loadingRef.current = false;
            if (fetchId === activeFetchRef.current && mountedRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        loadLogs();

        return () => {
            mountedRef.current = false;
        };
    }, [page, filters, filteredFallbackLogs]);

    const updateFilter = (key, value) => {
        setPage(1);
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setPage(1);
        setFilters({ startDate: "", endDate: "", product: "", type: "" });
    };

    const formatDate = (date) => {
        if (!date) return "No date";
        return new Intl.DateTimeFormat("en-PH", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        }).format(new Date(date));
    };

    return (
        <DashboardLayout>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-h)] sm:text-2xl">
                        <ClipboardList className="text-[var(--accent)]" size={24} />
                        Inventory Logs
                    </h1>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Track stock in, stock out, and adjustment history across inventory operations.
                    </p>
                </div>

                <button
                    onClick={loadLogs}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--input-bg)]"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-h)]">
                        <Filter size={16} className="text-[var(--accent)]" />
                        Filters
                    </div>
                    <button onClick={clearFilters} className="text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--text-h)]">
                        Clear filters
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Start date</span>
                        <input type="date" value={filters.startDate} onChange={(e) => updateFilter("startDate", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">End date</span>
                        <input type="date" value={filters.endDate} onChange={(e) => updateFilter("endDate", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Product</span>
                        <input type="search" value={filters.product} onChange={(e) => updateFilter("product", e.target.value)} placeholder="Search product or SKU" className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Inventory type</span>
                        <select value={filters.type} onChange={(e) => updateFilter("type", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]">
                            <option value="">All movements</option>
                            <option value="STOCK_IN">Stock In</option>
                            <option value="STOCK_OUT">Stock Out</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                        </select>
                    </label>
                </div>

                {usingFallback && (
                    <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-500">
                        Inventory logs backend endpoint is not available yet. Showing frontend sample rows for layout validation.
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-5 flex flex-col gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                    <button onClick={loadLogs} className="inline-flex items-center gap-2 self-end rounded-lg bg-red-500/15 px-3 py-1.5 text-sm font-semibold transition hover:bg-red-500/25 sm:self-auto">
                        <RefreshCw size={15} />
                        Retry
                    </button>
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="border-b border-[var(--border)] bg-[var(--input-bg)] text-xs uppercase tracking-wide text-[var(--muted)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Date</th>
                                <th className="px-4 py-3 font-semibold">Product</th>
                                <th className="px-4 py-3 font-semibold">Type</th>
                                <th className="px-4 py-3 font-semibold">Quantity</th>
                                <th className="px-4 py-3 font-semibold">Stock Change</th>
                                <th className="px-4 py-3 font-semibold">Reason</th>
                                <th className="px-4 py-3 font-semibold">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading && Array.from({ length: 6 }).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                                        <td key={cellIndex} className="px-4 py-4">
                                            <div className="h-4 rounded bg-[var(--input-bg)]" />
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {!loading && logs.map((log) => {
                                const config = typeConfig[log.type] || typeConfig.ADJUSTMENT;
                                const Icon = config.icon;
                                return (
                                    <tr key={log.id || log.inventoryLogId} className="transition hover:bg-[var(--input-bg)]/55">
                                        <td className="px-4 py-3 text-[var(--text)]">
                                            <span className="inline-flex items-center gap-2">
                                                <CalendarDays size={14} className="text-[var(--muted)]" />
                                                {formatDate(log.date || log.createdAt)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-[var(--text-h)]">{log.productName || log.product?.name || "Unknown product"}</div>
                                            <div className="text-xs text-[var(--muted)]">{log.sku || log.product?.sku || "No SKU"}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}>
                                                <Icon size={13} />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono font-semibold text-[var(--text-h)]">{Math.abs(log.quantity || 0)}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                                            {log.previousStock ?? "-"} to {log.newStock ?? "-"}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text)]">{log.reason || log.notes || "No reason provided"}</td>
                                        <td className="px-4 py-3 text-[var(--muted)]">{log.userName || log.user?.username || "System"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {!loading && !error && logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <PackageSearch size={42} className="mb-3 text-[var(--muted)]" />
                        <h3 className="text-base font-semibold text-[var(--text-h)]">No inventory logs found</h3>
                        <p className="mt-1 max-w-md text-sm text-[var(--muted)]">
                            Try widening the date range or clearing the product and inventory type filters.
                        </p>
                    </div>
                )}
            </div>

            {!loading && !error && logs.length > 0 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:flex-row">
                    <p className="text-sm text-[var(--muted)]">
                        Showing {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, totalItems)} of {totalItems} logs
                    </p>
                    <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm transition hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50">
                            Previous
                        </button>
                        <span className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-[var(--accent-text)]">
                            {page} / {totalPages}
                        </span>
                        <button disabled={page === totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm transition hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
