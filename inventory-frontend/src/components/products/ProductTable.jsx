import ProductRow from "./ProductRow";
import { Loader2 } from "lucide-react";

export default function ProductTable({ products, loading, onEdit, onStock, onDelete, onSuppliers }) {
    if (loading && products.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 sm:p-12 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                <span className="ml-3 text-[var(--muted)]">Loading products...</span>
            </div>
        );
    }

    return (
        <div className={`w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] ${loading ? "opacity-60 pointer-events-none" : ""} transition-opacity duration-200`}>
            <table className="w-full min-w-[800px] text-sm sm:text-base">
                <thead className="text-left text-xs sm:text-sm text-[var(--muted)] border-b border-[var(--border)] bg-[var(--input-bg)]">
                    <tr>
                        <th className="p-3 sm:p-4 font-medium">Name</th>
                        <th className="p-3 sm:p-4 font-medium hidden md:table-cell">Category</th>
                        <th className="p-3 sm:p-4 font-medium hidden sm:table-cell">SKU</th>
                        <th className="p-3 sm:p-4 font-medium">Price</th>
                        <th className="p-3 sm:p-4 font-medium">Stock</th>
                        <th className="p-3 sm:p-4 font-medium">Status</th>
                        <th className="p-3 sm:p-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border)]">
                    {products.map((p) => (
                        <ProductRow
                            key={p.product_id}
                            product={p}
                            onEdit={onEdit}
                            onStock={onStock}
                            onDelete={onDelete}
                            onSuppliers={onSuppliers}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
