import { useState, useCallback } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProductToolbar({ onSearch, onCreate }) {
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

        {/* SEARCH INPUT */}
        <div className="relative flex-1 order-2 sm:order-1">
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

        {/* ACTION BUTTONS */}
        <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
            {/* FILTER BUTTON (placeholder for future) */}
            <button
                className="
                    flex items-center justify-center gap-2
                    px-3 py-2.5 sm:py-3 rounded-lg
                    bg-[var(--input-bg)]
                    border border-[var(--border)]
                    text-[var(--text-h)]
                    text-sm font-medium
                    hover:bg-[var(--border)]
                    transition
                "
            >
                <Filter size={18} />
                <span className="hidden sm:inline">Filter</span>
            </button>

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
        </div>
    );
}
