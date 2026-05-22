import { useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
    BarChart3,
    CalendarDays,
    Download,
    FileText,
    Layers,
    Package,
    PackageMinus,
    RefreshCw,
    ShoppingCart,
    Truck,
    Wallet,
} from "lucide-react";

const reports = [
    { id: "sales-summary", label: "Sales Summary", icon: ShoppingCart },
    { id: "inventory-movement", label: "Inventory Movement", icon: RefreshCw },
    { id: "low-stock", label: "Low Stock", icon: PackageMinus },
    { id: "category-performance", label: "Category Performance", icon: Layers },
    { id: "supplier-performance", label: "Supplier Performance", icon: Truck },
];

const kpis = [
    { label: "Gross Sales", value: "PHP 342,980.50", detail: "+12.4% vs previous period", icon: Wallet, tone: "text-emerald-500" },
    { label: "Transactions", value: "1,420", detail: "Average basket PHP 241.54", icon: ShoppingCart, tone: "text-sky-500" },
    { label: "Stock Movement", value: "3,846 units", detail: "Stock in and stock out volume", icon: Package, tone: "text-amber-500" },
    { label: "Low Stock SKUs", value: "18", detail: "Below reorder threshold", icon: PackageMinus, tone: "text-rose-500" },
];

const reportRows = {
    "sales-summary": [
        ["Cash sales", "842 orders", "PHP 188,420.00", "55% share"],
        ["GCash sales", "421 orders", "PHP 96,800.50", "28% share"],
        ["Credit sales", "157 orders", "PHP 57,760.00", "17% share"],
    ],
    "inventory-movement": [
        ["Stock In", "1,920 units", "24 receiving logs", "Supplier delivery"],
        ["Stock Out", "1,706 units", "1,420 sales logs", "POS movement"],
        ["Adjustments", "220 units", "18 audit logs", "Damage and recount"],
    ],
    "low-stock": [
        ["Nescafe 3-in-1 Original", "13 units", "30 unit threshold", "Reorder needed"],
        ["Century Tuna Flakes", "9 units", "24 unit threshold", "Critical"],
        ["Silver Swan Soy Sauce", "18 units", "36 unit threshold", "Monitor"],
    ],
    "category-performance": [
        ["Beverages", "PHP 130,332.59", "38% revenue share", "+8.1% growth"],
        ["Coffee & Tea", "PHP 82,315.32", "24% revenue share", "+11.6% growth"],
        ["Snacks", "PHP 61,736.49", "18% revenue share", "+4.9% growth"],
    ],
    "supplier-performance": [
        ["ABC Distribution", "96% fill rate", "PHP 82,400.00 supplied", "2.1 days avg lead"],
        ["Metro Goods Trading", "91% fill rate", "PHP 58,200.00 supplied", "3.4 days avg lead"],
        ["NorthStar Wholesale", "88% fill rate", "PHP 41,870.00 supplied", "4.0 days avg lead"],
    ],
};

const chartBars = [44, 62, 58, 76, 69, 84, 72, 91];

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState("sales-summary");
    const [filters, setFilters] = useState({
        startDate: "2026-05-01",
        endDate: "2026-05-22",
        category: "",
        product: "",
        supplier: "",
    });
    const [exportMessage, setExportMessage] = useState("");

    const activeReportMeta = useMemo(
        () => reports.find((report) => report.id === activeReport) || reports[0],
        [activeReport]
    );
    const ActiveReportIcon = activeReportMeta.icon;

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleExport = (format) => {
        setExportMessage(`${format.toUpperCase()} export is ready to connect when backend export endpoints are available.`);
        window.setTimeout(() => setExportMessage(""), 3500);
    };

    return (
        <DashboardLayout>
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-h)] sm:text-2xl">
                        <BarChart3 className="text-[var(--accent)]" size={24} />
                        Reports
                    </h1>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Sales, inventory, category, supplier, and low stock reporting workspace.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleExport("csv")} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--input-bg)]">
                        <Download size={16} />
                        CSV
                    </button>
                    <button onClick={() => handleExport("pdf")} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--input-bg)]">
                        <FileText size={16} />
                        PDF
                    </button>
                </div>
            </div>

            {exportMessage && (
                <div className="mb-5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-500">
                    {exportMessage}
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
                            <div className="mt-4 text-2xl font-semibold text-[var(--text-h)]">{item.value}</div>
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

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                        <select value={filters.category} onChange={(e) => updateFilter("category", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]">
                            <option value="">All categories</option>
                            <option value="beverages">Beverages</option>
                            <option value="coffee">Coffee & Tea</option>
                            <option value="snacks">Snacks</option>
                        </select>
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Product</span>
                        <input value={filters.product} onChange={(e) => updateFilter("product", e.target.value)} placeholder="Product name or SKU" className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Supplier</span>
                        <select value={filters.supplier} onChange={(e) => updateFilter("supplier", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]">
                            <option value="">All suppliers</option>
                            <option value="abc">ABC Distribution</option>
                            <option value="metro">Metro Goods Trading</option>
                            <option value="northstar">NorthStar Wholesale</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="mb-5 overflow-x-auto">
                <div className="flex min-w-max gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-2 shadow-[var(--shadow)]">
                    {reports.map((report) => {
                        const Icon = report.icon;
                        const active = activeReport === report.id;
                        return (
                            <button
                                key={report.id}
                                onClick={() => setActiveReport(report.id)}
                                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    active
                                        ? "bg-[var(--accent)] text-[var(--accent-text)]"
                                        : "text-[var(--muted)] hover:bg-[var(--input-bg)] hover:text-[var(--text-h)]"
                                }`}
                            >
                                <Icon size={16} />
                                {report.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow)] xl:col-span-2">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-h)]">
                                <ActiveReportIcon size={18} className="text-[var(--accent)]" />
                                {activeReportMeta.label}
                            </h2>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                                Placeholder analytics visualization ready for backend aggregate data.
                            </p>
                        </div>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                            Frontend preview
                        </span>
                    </div>

                    <div className="flex h-72 items-end gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                        {chartBars.map((height, index) => (
                            <div key={index} className="flex h-full flex-1 flex-col justify-end gap-2">
                                <div className="rounded-t-md border border-[var(--border)] bg-gradient-to-t from-[var(--accent)]/10 to-[var(--accent)]" style={{ height: `${height}%` }} />
                                <span className="text-center text-[10px] font-semibold text-[var(--muted)]">W{index + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow)]">
                    <h2 className="text-base font-semibold text-[var(--text-h)]">Report Coverage</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                        Required backend reports represented in this UI.
                    </p>
                    <div className="mt-5 space-y-3">
                        {reports.map((report) => {
                            const Icon = report.icon;
                            return (
                                <div key={report.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3">
                                    <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-h)]">
                                        <Icon size={15} className="text-[var(--accent)]" />
                                        {report.label}
                                    </span>
                                    <span className="text-xs text-[var(--muted)]">Planned API</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow)]">
                <div className="border-b border-[var(--border)] px-5 py-4">
                    <h2 className="text-base font-semibold text-[var(--text-h)]">{activeReportMeta.label} Details</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">Representative rows until backend report endpoints are connected.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-[var(--input-bg)] text-xs uppercase tracking-wide text-[var(--muted)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Name</th>
                                <th className="px-4 py-3 font-semibold">Metric</th>
                                <th className="px-4 py-3 font-semibold">Value</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {reportRows[activeReport].map((row) => (
                                <tr key={row.join("-")} className="transition hover:bg-[var(--input-bg)]/55">
                                    {row.map((cell) => (
                                        <td key={cell} className="px-4 py-3 text-[var(--text)] first:font-semibold first:text-[var(--text-h)]">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
