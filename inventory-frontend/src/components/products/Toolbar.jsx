import { useState, useCallback } from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ExportButtons from "../ui/ExportButtons";

export default function ProductToolbar({
    onSearch,
    onCreate,
    filters,
    onFilterChange,
    categories = [],
    onClearFilters,
    onExportCsv,
    onExportPdf,
    exportDisabled,
}) {
    const { user } = useAuth();
    const [query, setQuery] = useState("");

    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    }, [onSearch]);

    const role = user?.role?.replace("ROLE_", "").toUpperCase() || "";
    const canCreate = ["ADMIN", "MANAGER", "INVENTORY_CLERK"].includes(role);

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow)]">
        <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            {/* SEARCH INPUT */}
            <div className="relative flex-1">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder="Search products by name or SKU..."
                    className="
                        w-full pl-10 pr-4 py-2.5 sm:py-3
                        rounded-lg text-sm sm:text-base
                        bg-[var(--input-bg)]
                        border border-[var(--border)]
                        placeholder:text-[var(--muted)]
                        focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
                        transition
                    "
                />
            </div>

            {/* ADD PRODUCT BUTTON */}
            {canCreate && (
                <button
                    onClick={onCreate}
                    className="
                        flex items-center justify-center gap-2
                        px-4 py-2.5 sm:py-3 rounded-lg
                        bg-[var(--accent)]
                        text-[var(--accent-text)]
                        font-medium text-sm sm:text-base
                        hover:opacity-90
                        transition
                        whitespace-nowrap
                    "
                >
                    <Plus size={18} />
                    <span>Add Product</span>
                </button>
            )}
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-[540px]">
                <label className="relative">
                    <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <select
                        value={filters.categoryId}
                        onChange={(e) => onFilterChange("categoryId", e.target.value)}
                        className="w-full rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category.id || category.categoryId} value={category.id || category.categoryId}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </label>
                <select
                    value={filters.stockStatus}
                    onChange={(e) => onFilterChange("stockStatus", e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
                >
                    <option value="">All stock</option>
                    <option value="in-stock">In stock</option>
                    <option value="low-stock">Low stock</option>
                    <option value="out-of-stock">Out of stock</option>
                </select>
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--border)]"
                >
                    <X size={16} />
                    Clear
                </button>
            </div>

            <ExportButtons
                className="justify-end"
                onCsv={onExportCsv}
                onPdf={onExportPdf}
                disabled={exportDisabled}
            />
        </div>
        </div>
        </div>
    );
}
