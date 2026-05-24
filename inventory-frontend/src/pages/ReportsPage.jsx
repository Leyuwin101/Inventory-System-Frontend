import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getAllCategories } from "../api/categories";
import { getAllProducts } from "../api/products";
import { getReport } from "../api/reports";
import { getAllSuppliers } from "../api/suppliers";
import {
    AlertCircle,
    BarChart3,
    CalendarDays,
    Layers,
    Loader2,
    PackageMinus,
    RefreshCw,
    ShoppingCart,
    Truck,
    Wallet,
    Search,
} from "lucide-react";
import ExportButtons from "../components/ui/ExportButtons";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { exportToCsv, exportToPdf } from "../utils/exportUtils";
import { getPageCache, setPageCache } from "../store/pageCache";

const reports = [
    { id: "sales-summary", label: "Sales Summary", icon: ShoppingCart },
    { id: "inventory-movement", label: "Inventory Movement", icon: RefreshCw },
    { id: "low-stock", label: "Low Stock", icon: PackageMinus },
    { id: "category-performance", label: "Category Performance", icon: Layers },
    { id: "supplier-performance", label: "Supplier Performance", icon: Truck },
];

const REPORT_TABLE_PAGE_SIZE = 10;

const money = (value) => `PHP ${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const number = (value) => Number(value || 0).toLocaleString("en-PH");

const getKpis = (reportId, data = {}) => {
    if (reportId === "sales-summary") {
        return [
            { label: "Gross Sales", value: money(data.totalSales), detail: "Total recorded revenue", icon: Wallet, tone: "text-emerald-500" },
            { label: "Transactions", value: number(data.totalTransactions), detail: "Completed sales in scope", icon: ShoppingCart, tone: "text-sky-500" },
            { label: "Average Order", value: money(data.averagedOrderValue), detail: "Average basket value", icon: BarChart3, tone: "text-amber-500" },
        ];
    }

    if (reportId === "inventory-movement") {
        return [
            { label: "Stock In", value: number(data.totalStockIn), detail: "Received inventory logs", icon: RefreshCw, tone: "text-emerald-500" },
            { label: "Stock Out", value: number(data.totalStockOut), detail: "Issued inventory logs", icon: PackageMinus, tone: "text-rose-500" },
            { label: "Adjustments", value: number(data.totalAdjustments), detail: "Manual stock corrections", icon: Layers, tone: "text-amber-500" },
        ];
    }

    if (reportId === "low-stock") {
        return [
            { label: "Low Stock SKUs", value: number(data.lowStockCount), detail: "Below minimum stock", icon: PackageMinus, tone: "text-rose-500" },
        ];
    }

    if (reportId === "category-performance") {
        return [
            { label: "Category Revenue", value: money(data.totalRevenue), detail: "Revenue grouped by category", icon: Wallet, tone: "text-emerald-500" },
            { label: "Products Sold", value: number(data.totalProductSold), detail: "Units sold across categories", icon: ShoppingCart, tone: "text-sky-500" },
            { label: "Top Category", value: data.topCategory || "N/A", detail: "Highest revenue category", icon: Layers, tone: "text-amber-500" },
        ];
    }

    return [
        { label: "Supplier Revenue", value: money(data.totalSupplierRevenue), detail: "Supplier contribution total", icon: Wallet, tone: "text-emerald-500" },
        { label: "Top Supplier", value: data.topSupplier || "N/A", detail: "Highest contribution supplier", icon: Truck, tone: "text-sky-500" },
    ];
};

const getTable = (reportId, data = {}) => {
    if (reportId === "sales-summary") {
        return {
            columns: ["Sale", "Cashier", "Payment", "Total"],
            rows: (data.tableRows || []).map((sale) => [
                sale.saleId || sale.id || "Sale",
                sale.cashierName || sale.username || "System",
                sale.paymentMethod || "N/A",
                money(sale.totalPrice || sale.totalAmount || sale.total),
            ]),
        };
    }

    if (reportId === "inventory-movement") {
        return {
            columns: ["Product", "Type", "Quantity", "Reason"],
            rows: (data.tableRows || []).map((log) => [
                log.productName || "Unknown product",
                String(log.type || "").replace("_", " "),
                number(log.quantity),
                log.reason || "No reason",
            ]),
        };
    }

    if (reportId === "low-stock") {
        return {
            columns: ["Product", "SKU", "Stock", "Minimum"],
            rows: (data.tableRows || []).map((product) => [
                product.name || "Unnamed product",
                product.sku || "No SKU",
                number(product.stockQuantity ?? product.stock_quantity),
                number(product.minimumStock ?? product.minimum_stock),
            ]),
        };
    }

    if (reportId === "category-performance") {
        return {
            columns: ["Category", "Revenue", "Products Sold", "Share"],
            rows: (data.tableRows || []).map((row) => [
                row.categoryName || "Uncategorized",
                money(row.revenue),
                number(row.productsSold),
                `${Number(row.revenuePercentage || 0).toFixed(1)}%`,
            ]),
        };
    }

    return {
        columns: ["Supplier", "Contribution", "Products", "Share"],
        rows: (data.tableRows || []).map((row) => [
            row.supplierName || "Unnamed supplier",
            money(row.contributionAmount),
            number(row.supplierProducts),
            `${Number(row.contributionPercentage || 0).toFixed(1)}%`,
        ]),
    };
};

const getChartRows = (reportId, data = {}) => {
    const rows = data.chartRows || [];

    if (reportId === "sales-summary") {
        const source = rows.length ? rows : data.tableRows || [];
        return source.slice(0, 12).map((row, index) => ({
            label: row.label || row.date || row.saleDate || row.createdAt || `Sale ${index + 1}`,
            value: Number(row.sales || row.totalSales || row.totalPrice || row.totalAmount || row.total || 0),
            tone: "emerald",
        }));
    }

    if (reportId === "inventory-movement") {
        if (rows.length) {
            return rows.slice(0, 12).map((row, index) => ({
                label: row.label || row.date || row.createdAt || `Movement ${index + 1}`,
                value: Number(row.stockIn || row.quantity || 0),
                secondaryValue: Number(row.stockOut || 0),
                tone: "sky",
            }));
        }

        return [
            { label: "Stock In", value: Number(data.totalStockIn || 0), tone: "emerald" },
            { label: "Stock Out", value: Number(data.totalStockOut || 0), tone: "rose" },
            { label: "Adjustments", value: Number(data.totalAdjustments || 0), tone: "amber" },
        ];
    }

    if (reportId === "low-stock") {
        return rows.slice(0, 10).map((row) => ({
            label: row.name || row.productName || "Product",
            value: Number(row.stockQuantity ?? row.stock_quantity ?? 0),
            secondaryValue: Number(row.minimumStock ?? row.minimum_stock ?? 0),
            tone: "rose",
        }));
    }

    if (reportId === "category-performance") {
        return rows.slice(0, 10).map((row) => ({
            label: row.categoryName || "Uncategorized",
            value: Number(row.revenue || 0),
            secondaryValue: Number(row.productsSold || 0),
            percentage: Number(row.revenuePercentage || 0),
            tone: "violet",
        }));
    }

    return rows.slice(0, 10).map((row) => ({
        label: row.supplierName || "Supplier",
        value: Number(row.contributionAmount || 0),
        secondaryValue: Number(row.supplierProducts || 0),
        percentage: Number(row.contributionPercentage || 0),
        tone: "cyan",
    }));
};

const toneClasses = {
    emerald: "from-emerald-500 to-teal-400 text-emerald-400",
    sky: "from-sky-500 to-cyan-400 text-sky-400",
    rose: "from-rose-500 to-red-400 text-rose-400",
    amber: "from-amber-500 to-orange-400 text-amber-400",
    violet: "from-violet-500 to-fuchsia-400 text-violet-400",
    cyan: "from-cyan-500 to-emerald-400 text-cyan-400",
};

const compactValue = (value, reportId) => (
    ["sales-summary", "category-performance", "supplier-performance"].includes(reportId)
        ? money(value)
        : number(value)
);

function ReportChart({ reportId, data, loading }) {
    const rows = useMemo(() => getChartRows(reportId, data), [data, reportId]);
    const maxValue = Math.max(...rows.map((row) => Math.max(row.value || 0, row.secondaryValue || 0)), 1);
    const topRow = rows.reduce((best, row) => (row.value > (best?.value || 0) ? row : best), null);
    const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);

    if (loading && rows.length === 0) {
        return (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="h-80 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--bg)]" />
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-20 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--bg)]" />
                    ))}
                </div>
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="flex h-72 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--muted)]">
                No chart data available for this report.
            </div>
        );
    }

    const isRankedChart = ["low-stock", "category-performance", "supplier-performance"].includes(reportId);

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 sm:p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-[var(--text-h)]">
                            {isRankedChart ? "Ranked Performance" : "Trend Overview"}
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                            {rows.length} plotted point{rows.length === 1 ? "" : "s"}
                        </p>
                    </div>
                    {topRow && (
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-left sm:text-right">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Peak</div>
                            <div className="text-sm font-semibold text-[var(--text-h)]">{compactValue(topRow.value, reportId)}</div>
                        </div>
                    )}
                </div>

                {isRankedChart ? (
                    <div className="space-y-3">
                        {rows.map((row, index) => {
                            const width = Math.max(3, (row.value / maxValue) * 100);
                            const tone = toneClasses[row.tone] || toneClasses.emerald;
                            return (
                                <div key={`${row.label}-${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(100px,180px)_1fr] sm:items-center sm:gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-xs font-semibold text-[var(--text-h)]">{row.label}</div>
                                        <div className="text-[10px] text-[var(--muted)]">
                                            {reportId === "low-stock"
                                                ? `Minimum ${number(row.secondaryValue)}`
                                                : `${number(row.secondaryValue)} item${row.secondaryValue === 1 ? "" : "s"}`}
                                        </div>
                                    </div>
                                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                                        <div className="h-8 min-w-0 flex-1 rounded-lg bg-[var(--input-bg)]">
                                            <div className={`h-8 rounded-lg bg-gradient-to-r ${tone}`} style={{ width: `${width}%` }} />
                                        </div>
                                        <div className="w-20 shrink-0 text-right text-[11px] font-semibold text-[var(--text-h)] sm:w-24 sm:text-xs">
                                            {compactValue(row.value, reportId)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-2">
                    <div className="flex h-64 min-w-[520px] items-end gap-2 sm:h-72 sm:min-w-0 sm:gap-3">
                        {rows.map((row, index) => {
                            const height = Math.max(4, (row.value / maxValue) * 100);
                            const secondaryHeight = Math.max(0, (row.secondaryValue / maxValue) * 100);
                            const tone = toneClasses[row.tone] || toneClasses.emerald;
                            return (
                                <div key={`${row.label}-${index}`} className="flex h-full min-w-10 flex-1 flex-col justify-end gap-2">
                                    <div className="flex min-h-0 flex-1 items-end justify-center gap-1 rounded-lg bg-[var(--input-bg)] px-1 pt-2">
                                        <div className={`w-full rounded-t-md bg-gradient-to-t ${tone}`} style={{ height: `${height}%` }} title={compactValue(row.value, reportId)} />
                                        {row.secondaryValue > 0 && (
                                            <div className="w-full rounded-t-md bg-gradient-to-t from-rose-500 to-amber-400" style={{ height: `${secondaryHeight}%` }} title={compactValue(row.secondaryValue, reportId)} />
                                        )}
                                    </div>
                                    <span className="truncate text-center text-[10px] font-semibold text-[var(--muted)]" title={row.label}>
                                        {String(row.label).slice(0, 10)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Plotted Total</div>
                    <div className="mt-2 truncate text-lg font-semibold text-[var(--text-h)] sm:text-xl">{compactValue(total, reportId)}</div>
                </div>
                <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Top Performer</div>
                    <div className="mt-2 truncate text-lg font-semibold text-[var(--text-h)] sm:text-xl">{topRow?.label || "N/A"}</div>
                </div>
                <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Average</div>
                    <div className="mt-2 truncate text-lg font-semibold text-[var(--text-h)] sm:text-xl">{compactValue(total / rows.length, reportId)}</div>
                </div>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const cachedReportState = getPageCache("reports:state") || {};
    const [activeReport, setActiveReport] = useState(cachedReportState.activeReport || "sales-summary");
    const [filters, setFilters] = useState(cachedReportState.filters || {
        startDate: "",
        endDate: "",
        categoryId: "",
        productId: "",
        supplierId: "",
    });
    const [tableQuery, setTableQuery] = useState(cachedReportState.tableQuery || "");
    const [tablePage, setTablePage] = useState(cachedReportState.tablePage || 1);
    const [reportData, setReportData] = useState({});
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const activeReportMeta = useMemo(
        () => reports.find((report) => report.id === activeReport) || reports[0],
        [activeReport]
    );
    const ActiveReportIcon = activeReportMeta.icon;
    const kpis = useMemo(() => getKpis(activeReport, reportData), [activeReport, reportData]);
    const table = useMemo(() => getTable(activeReport, reportData), [activeReport, reportData]);
    const debouncedTableQuery = useDebouncedValue(tableQuery, 300);
    const filteredTableRows = useMemo(() => {
        const query = debouncedTableQuery.trim().toLowerCase();
        if (!query) return table.rows;
        return table.rows.filter((row) => row.some((cell) => String(cell || "").toLowerCase().includes(query)));
    }, [debouncedTableQuery, table.rows]);
    const tableTotalPages = Math.max(1, Math.ceil(filteredTableRows.length / REPORT_TABLE_PAGE_SIZE));
    const currentTablePage = Math.min(tablePage, tableTotalPages);
    const paginatedTableRows = useMemo(() => {
        const start = (currentTablePage - 1) * REPORT_TABLE_PAGE_SIZE;
        return filteredTableRows.slice(start, start + REPORT_TABLE_PAGE_SIZE);
    }, [currentTablePage, filteredTableRows]);

    const loadReport = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getReport(activeReport, filters);
            setReportData(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load report.");
        } finally {
            setLoading(false);
        }
    }, [activeReport, filters]);

    useEffect(() => {
        setPageCache("reports:state", { activeReport, filters, tableQuery, tablePage });
    }, [activeReport, filters, tablePage, tableQuery]);

    useEffect(() => {
        setTablePage(1);
    }, [activeReport, debouncedTableQuery, filters]);

    useEffect(() => {
        Promise.all([
            getAllCategories().catch(() => []),
            getAllProducts().catch(() => []),
            getAllSuppliers().catch(() => []),
        ]).then(([categoryRows, productRows, supplierRows]) => {
            setCategories(categoryRows);
            setProducts(productRows);
            setSuppliers(supplierRows);
        });
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            loadReport();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadReport]);

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <DashboardLayout>
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-h)] sm:text-2xl">
                        <BarChart3 className="text-[var(--accent)]" size={24} />
                        Reports
                        {loading && <Loader2 size={18} className="animate-spin text-[var(--accent)]" />}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Sales, inventory, category, supplier, and low stock reporting workspace.
                    </p>
                </div>

                <button onClick={loadReport} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--input-bg)] sm:w-auto">
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow)]">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{item.label}</span>
                                <span className={`rounded-lg bg-[var(--input-bg)] p-2 ${item.tone}`}>
                                    <Icon size={18} />
                                </span>
                            </div>
                            <div className="mt-4 break-words text-xl font-semibold text-[var(--text-h)] sm:text-2xl">{item.value}</div>
                            <p className="mt-1 text-xs text-[var(--muted)]">{item.detail}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow)]">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-h)]">
                    <CalendarDays size={16} className="text-[var(--accent)]" />
                    Report Filters
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Start date</span>
                        <input type="date" value={filters.startDate} onChange={(e) => updateFilter("startDate", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">End date</span>
                        <input type="date" value={filters.endDate} onChange={(e) => updateFilter("endDate", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Category</span>
                        <select value={filters.categoryId} onChange={(e) => updateFilter("categoryId", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]">
                            <option value="">All categories</option>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Product</span>
                        <select value={filters.productId} onChange={(e) => updateFilter("productId", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]">
                            <option value="">All products</option>
                            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                        </select>
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Supplier</span>
                        <select value={filters.supplierId} onChange={(e) => updateFilter("supplierId", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]">
                            <option value="">All suppliers</option>
                            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                        </select>
                    </label>
                </div>
            </div>

            <div className="mb-5 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-2 shadow-[var(--shadow)]">
                    {reports.map((report) => {
                        const Icon = report.icon;
                        const active = activeReport === report.id;
                        return (
                            <button
                                key={report.id}
                                onClick={() => setActiveReport(report.id)}
                                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-[var(--accent)] text-[var(--accent-text)]" : "text-[var(--muted)] hover:bg-[var(--input-bg)] hover:text-[var(--text-h)]"}`}
                            >
                                <Icon size={16} />
                                {report.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mb-5 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow)] sm:p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-h)]">
                        <ActiveReportIcon size={18} className="text-[var(--accent)]" />
                        {activeReportMeta.label}
                    </h2>
                </div>

                <ReportChart reportId={activeReport} data={reportData} loading={loading} />
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow)]">
                <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-base font-semibold text-[var(--text-h)]">{activeReportMeta.label} Details</h2>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                            <input
                                value={tableQuery}
                                onChange={(e) => setTableQuery(e.target.value)}
                                placeholder="Search table..."
                                className="w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 sm:w-64"
                            />
                        </div>
                        <ExportButtons
                            disabled={filteredTableRows.length === 0}
                            onCsv={() => exportToCsv({
                                title: `${activeReportMeta.label} Report`,
                                columns: table.columns.map((column, index) => ({ header: column, accessor: (row) => row[index] })),
                                rows: filteredTableRows,
                            })}
                            onPdf={() => exportToPdf({
                                title: `${activeReportMeta.label} Report`,
                                subtitle: `${filteredTableRows.length} rows matching current report filters`,
                                columns: table.columns.map((column, index) => ({ header: column, accessor: (row) => row[index] })),
                                rows: filteredTableRows,
                            })}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-[var(--input-bg)] text-xs uppercase tracking-wide text-[var(--muted)]">
                            <tr>
                                {table.columns.map((column) => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading && Array.from({ length: 4 }).map((_, rowIndex) => (
                                <tr key={rowIndex} className="animate-pulse">
                                    {table.columns.map((column) => <td key={column} className="px-4 py-4"><div className="h-4 rounded bg-[var(--input-bg)]" /></td>)}
                                </tr>
                            ))}
                            {!loading && paginatedTableRows.map((row) => (
                                <tr key={row.join("-")} className="transition hover:bg-[var(--input-bg)]/55">
                                    {row.map((cell, index) => (
                                        <td key={`${cell}-${index}`} className="px-4 py-3 text-[var(--text)] first:font-semibold first:text-[var(--text-h)]">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && filteredTableRows.length === 0 && (
                    <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">No report rows found for the selected filters.</div>
                )}
                {!loading && filteredTableRows.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-[var(--muted)]">
                            Showing {((currentTablePage - 1) * REPORT_TABLE_PAGE_SIZE) + 1} - {Math.min(currentTablePage * REPORT_TABLE_PAGE_SIZE, filteredTableRows.length)} of {filteredTableRows.length} rows
                        </p>
                        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                            <button
                                type="button"
                                disabled={currentTablePage === 1}
                                onClick={() => setTablePage((page) => Math.max(1, page - 1))}
                                className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm transition hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-[var(--accent-text)]">
                                {currentTablePage} / {tableTotalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentTablePage === tableTotalPages}
                                onClick={() => setTablePage((page) => Math.min(tableTotalPages, page + 1))}
                                className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm transition hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
