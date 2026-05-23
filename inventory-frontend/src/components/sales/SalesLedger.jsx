import { useEffect, useMemo, useState } from "react";
import { Receipt, Clock, RefreshCw, Search, X } from "lucide-react";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import ExportButtons from "../ui/ExportButtons";
import { exportToCsv, exportToPdf } from "../../utils/exportUtils";
import { getPageCache, setPageCache } from "../../store/pageCache";

const LEDGER_PAGE_SIZE = 25;

const getSaleMeta = (sale) => {
    const sId = sale.id ?? sale.saleId ?? sale.saleID ?? sale.salesID ?? sale.sale_id ?? sale.sales_id;
    const itemsSummary = (sale.items || [])
        .map((it) => `${it.productName || it.product_name || "Item"} (x${it.quantity})`)
        .join(", ");
    const dateStr = sale.saleDate || sale.createdDate || sale.timestamp || sale.sale_date;
    const formattedDate = dateStr ? new Date(dateStr).toLocaleString("en-PH", {
        dateStyle: "short",
        timeStyle: "short"
    }) : "Recent Time";
    const revenue = sale.totalPrice || sale.total_price || sale.total || 0;
    const isRefunded = sale.status === "CANCELLED" || sale.status === "REFUNDED" || sale.refunded || sale.cancelled;

    return { sId, itemsSummary, formattedDate, revenue, isRefunded };
};

export default function SalesLedger({ sales, isAdminOrManager, onCancelSale }) {
    const cachedState = getPageCache("sales-ledger:filters") || {};
    const [query, setQuery] = useState(cachedState.query || "");
    const [filters, setFilters] = useState(cachedState.filters || { startDate: "", endDate: "", status: "" });
    const [page, setPage] = useState(cachedState.page || 1);
    const debouncedQuery = useDebouncedValue(query, 300);

    const filteredSales = useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase();
        const rows = sales.filter((sale) => {
            const meta = getSaleMeta(sale);
            const dateValue = sale.saleDate || sale.createdDate || sale.timestamp || sale.sale_date || "";
            const parsedDate = dateValue ? new Date(dateValue) : null;
            const isoDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : "";
            const matchesQuery = !q || [
                meta.sId,
                meta.itemsSummary,
                sale.cashierName,
                sale.username,
                sale.paymentMethod,
            ].some((value) => String(value || "").toLowerCase().includes(q));
            const matchesStart = !filters.startDate || isoDate >= filters.startDate;
            const matchesEnd = !filters.endDate || isoDate <= filters.endDate;
            const matchesStatus =
                !filters.status ||
                (filters.status === "refunded" && meta.isRefunded) ||
                (filters.status === "confirmed" && !meta.isRefunded);
            return matchesQuery && matchesStart && matchesEnd && matchesStatus;
        });
        return rows;
    }, [debouncedQuery, filters, sales]);

    useEffect(() => {
        setPageCache("sales-ledger:filters", { query, filters, page });
    }, [filters, page, query]);

    const totalPages = Math.max(1, Math.ceil(filteredSales.length / LEDGER_PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const visibleSales = useMemo(() => {
        const start = (currentPage - 1) * LEDGER_PAGE_SIZE;
        return filteredSales.slice(start, start + LEDGER_PAGE_SIZE);
    }, [currentPage, filteredSales]);

    const exportColumns = useMemo(() => [
        { header: "Invoice ID", accessor: (sale) => `INV-${getSaleMeta(sale).sId || ""}` },
        { header: "Date", accessor: (sale) => getSaleMeta(sale).formattedDate },
        { header: "Cashier", accessor: (sale) => sale.cashierName || sale.username || "Staff Cashier" },
        { header: "Items", accessor: (sale) => getSaleMeta(sale).itemsSummary || "No detailed items" },
        { header: "Total", accessor: (sale) => Number(getSaleMeta(sale).revenue || 0).toFixed(2) },
        { header: "Status", accessor: (sale) => getSaleMeta(sale).isRefunded ? "Cancelled / Refunded" : "Confirmed" },
    ], []);

    const updateFilter = (key, value) => {
        setPage(1);
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setPage(1);
        setQuery("");
        setFilters({ startDate: "", endDate: "", status: "" });
    };

    if (sales.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-center animate-fade-in">
                <Receipt size={48} className="text-[var(--muted)] mb-3" />
                <h3 className="text-lg text-[var(--text-h)] font-medium mb-1">No Transactions Recorded</h3>
                <p className="text-sm text-[var(--muted)] max-w-md">
                    All logged client invoice sales and cash checkouts will be ledgered in this audit panel.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full animate-fade-in">
            <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow)]">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_repeat(3,minmax(150px,190px))_auto] lg:items-center">
                    <div className="relative">
                        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                            value={query}
                            onChange={(event) => {
                                setPage(1);
                                setQuery(event.target.value);
                            }}
                            placeholder="Search invoice, cashier, item, or payment..."
                            className="w-full rounded-lg py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
                        />
                    </div>
                    <input type="date" value={filters.startDate} onChange={(e) => updateFilter("startDate", e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]" />
                    <input type="date" value={filters.endDate} onChange={(e) => updateFilter("endDate", e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]" />
                    <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]">
                        <option value="">All statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <button onClick={clearFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm font-semibold transition hover:bg-[var(--border)]">
                        <X size={16} />
                        Clear
                    </button>
                </div>
                <div className="mt-3 flex justify-end">
                    <ExportButtons
                        disabled={filteredSales.length === 0}
                        onCsv={() => exportToCsv({ title: "Sales", columns: exportColumns, rows: filteredSales })}
                        onPdf={() => exportToPdf({ title: "Sales", subtitle: `${filteredSales.length} sale rows matching current filters`, columns: exportColumns, rows: filteredSales })}
                    />
                </div>
            </div>

            {filteredSales.length === 0 && (
                <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-6 py-10 text-center text-sm text-[var(--muted)]">
                    No sales match the current search and filters.
                </div>
            )}

            <div className="md:hidden space-y-3">
                {visibleSales.map((sale, idx) => {
                    const { sId, itemsSummary, formattedDate, revenue, isRefunded } = getSaleMeta(sale);

                    return (
                        <div key={sId || idx} className={`rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 ${isRefunded ? "opacity-55" : ""}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-[var(--text-h)]">
                                        <Receipt size={14} className="text-[var(--muted)] flex-shrink-0" />
                                        <span className="font-mono text-xs truncate">#INV-{sId}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                                        <Clock size={12} />
                                        <span>{formattedDate}</span>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm whitespace-nowrap ${isRefunded ? "line-through text-red-400" : "text-[var(--accent)]"}`}>
                                    PHP {Number(revenue).toFixed(2)}
                                </span>
                            </div>

                            <div className="mt-3 text-xs">
                                <div className="font-semibold text-[var(--text-h)]">{sale.cashierName || sale.username || "Staff Cashier"}</div>
                                <div className="mt-1 text-[var(--muted)] line-clamp-2">{itemsSummary || "No detailed items"}</div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                                <span className={`text-[10px] uppercase font-bold ${isRefunded ? "text-red-400" : "text-green-400"}`}>
                                    {isRefunded ? "Cancelled / Refunded" : "Confirmed"}
                                </span>
                                {isAdminOrManager && !isRefunded && (
                                    <button
                                        onClick={() => onCancelSale(sale)}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                                        title="Cancel sale and reverse inventory"
                                    >
                                        <RefreshCw size={12} />
                                        Cancel Sale
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="hidden md:block w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow)]">
                <table className="w-full min-w-[760px] text-sm text-left">
                    <thead className="sticky top-0 z-10 text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--input-bg)] uppercase">
                        <tr>
                            <th className="p-4 font-medium">Invoice ID</th>
                            <th className="p-4 font-medium">Date &amp; Time</th>
                            <th className="p-4 font-medium">Cashier Operator</th>
                            <th className="p-4 font-medium">Purchased Items Summary</th>
                            <th className="p-4 font-medium">Total Revenue</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                        {visibleSales.map((sale, idx) => {
                            const { sId, itemsSummary, formattedDate, revenue, isRefunded } = getSaleMeta(sale);

                            return (
                                <tr key={sId || idx} className={`hover:bg-[var(--input-bg)]/40 transition ${isRefunded ? "opacity-45 bg-red-950/5" : ""}`}>
                                    <td className="p-4 font-medium text-[var(--text-h)]">
                                        <div className="flex items-center gap-2">
                                            <Receipt size={14} className="text-[var(--muted)]" />
                                            <span className="font-mono">#INV-{sId}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-xs text-[var(--muted)]">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} />
                                            <span>{formattedDate}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-xs">
                                        <div>
                                            <div className="font-semibold text-[var(--text-h)]">{sale.cashierName || sale.username || "Staff Cashier"}</div>
                                            <span className="text-[9px] text-[var(--muted)]">User ID: {sale.userId || sale.user_id || 1}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-xs max-w-sm truncate" title={itemsSummary}>
                                        <span className="text-[var(--muted)]">{itemsSummary || "No detailed items"}</span>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-xs ${isRefunded ? "line-through text-red-400" : "text-[var(--accent)]"}`}>
                                                PHP {Number(revenue).toFixed(2)}
                                            </span>
                                            {isRefunded && (
                                                <span className="text-[8px] uppercase tracking-wider text-red-400 font-bold mt-0.5">
                                                    Cancelled / Refunded
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {isAdminOrManager && !isRefunded && (
                                                <button
                                                    onClick={() => onCancelSale(sale)}
                                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                                                    title="Cancel sale and reverse inventory"
                                                >
                                                    <RefreshCw size={12} />
                                                    Cancel Sale
                                                </button>
                                            )}

                                            {isRefunded && (
                                                <span className="text-xs text-[var(--muted)] italic">Closed Ledger</span>
                                            )}

                                            {!isAdminOrManager && !isRefunded && (
                                                <span className="text-xs text-green-400 italic">Confirmed</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredSales.length > LEDGER_PAGE_SIZE && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-3 sm:flex-row">
                    <div className="text-sm text-[var(--muted)]">
                        Showing {((currentPage - 1) * LEDGER_PAGE_SIZE) + 1} - {Math.min(currentPage * LEDGER_PAGE_SIZE, filteredSales.length)} of {filteredSales.length} transactions
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            disabled={currentPage === 1}
                            className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-[var(--muted)]">{currentPage} / {totalPages}</span>
                        <button
                            type="button"
                            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                            disabled={currentPage === totalPages}
                            className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
