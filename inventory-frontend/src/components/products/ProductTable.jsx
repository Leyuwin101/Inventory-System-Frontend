import { memo } from "react";
import { Edit3, Package, Trash2, Truck } from "lucide-react";
import ProductRow from "./ProductRow";
import { useAuth } from "../context/AuthContext";

const ProductSkeleton = () => (
    <>
        <div className="space-y-3 md:hidden">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4">
                    <div className="h-4 w-2/3 rounded bg-[var(--input-bg)]" />
                    <div className="mt-3 h-3 w-1/2 rounded bg-[var(--input-bg)]" />
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="h-9 rounded bg-[var(--input-bg)]" />
                        <div className="h-9 rounded bg-[var(--input-bg)]" />
                        <div className="h-9 rounded bg-[var(--input-bg)]" />
                    </div>
                </div>
            ))}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow)] md:block">
            <table className="w-full min-w-[800px] text-sm">
                <tbody>
                    {Array.from({ length: 8 }).map((_, rowIndex) => (
                        <tr key={rowIndex} className="animate-pulse border-b border-[var(--border)]">
                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                <td key={cellIndex} className="p-4">
                                    <div className="h-4 rounded bg-[var(--input-bg)]" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </>
);

const ProductCard = memo(function ProductCard({ product, onEdit, onStock, onDelete, onSuppliers }) {
    const { user } = useAuth();
    const stock = Number(product.stock_quantity ?? product.stockQuantity ?? 0);
    const minimumStock = Number(product.minimum_stock ?? product.minimumStock ?? 0);
    const lowStock = stock <= minimumStock;
    const categoryName = product.category?.name || product.categoryName || product.category_id || "N/A";
    const role = user?.role?.replace("ROLE_", "").toUpperCase() || "";
    const canEdit = ["ADMIN", "MANAGER", "INVENTORY_CLERK"].includes(role);
    const canStock = ["ADMIN", "MANAGER", "INVENTORY_CLERK"].includes(role);
    const canDelete = ["ADMIN"].includes(role);
    const canManageSuppliers = ["ADMIN", "MANAGER"].includes(role);

    return (
        <article className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[var(--text-h)]">{product.name}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">SKU: {product.sku || "N/A"}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{categoryName}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-xs ${
                    lowStock
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-green-500/30 bg-green-500/10 text-green-400"
                }`}>
                    {lowStock ? "Low" : "In"}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                    <div className="text-xs text-[var(--muted)]">Price</div>
                    <div className="font-semibold text-[var(--text-h)]">
                        PHP {Number(product.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-[var(--muted)]">Stock</div>
                    <div className={lowStock ? "font-semibold text-red-400" : "font-semibold text-[var(--text-h)]"}>{stock}</div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
                {canEdit && (
                    <button onClick={() => onEdit(product)} className="flex min-h-11 items-center justify-center rounded-lg bg-[var(--input-bg)] transition hover:bg-[var(--border)]" title="Edit">
                        <Edit3 size={15} />
                    </button>
                )}
                {canStock && (
                    <button onClick={() => onStock(product)} className="flex min-h-11 items-center justify-center rounded-lg bg-[var(--input-bg)] transition hover:bg-[var(--border)]" title="Update Stock">
                        <Package size={15} />
                    </button>
                )}
                {canManageSuppliers && (
                    <button onClick={() => onSuppliers(product)} className="flex min-h-11 items-center justify-center rounded-lg bg-[var(--input-bg)] transition hover:bg-[var(--border)]" title="Manage Suppliers">
                        <Truck size={15} />
                    </button>
                )}
                {canDelete && (
                    <button onClick={() => onDelete(product)} className="flex min-h-11 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition hover:bg-red-500/20" title="Delete">
                        <Trash2 size={15} />
                    </button>
                )}
            </div>
        </article>
    );
});

function ProductTable({ products, loading, onEdit, onStock, onDelete, onSuppliers }) {
    if (loading && products.length === 0) {
        return <ProductSkeleton />;
    }

    return (
        <>
            <div className={`space-y-3 md:hidden ${loading ? "opacity-70 pointer-events-none" : ""} transition-opacity duration-200`}>
                {products.map((product) => (
                    <ProductCard
                        key={product.product_id || product.id}
                        product={product}
                        onEdit={onEdit}
                        onStock={onStock}
                        onDelete={onDelete}
                        onSuppliers={onSuppliers}
                    />
                ))}
            </div>

            <div className={`hidden w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow)] md:block ${loading ? "opacity-60 pointer-events-none" : ""} transition-opacity duration-200`}>
                <table className="w-full min-w-[800px] text-sm sm:text-base">
                    <thead className="sticky top-0 z-10 text-left text-xs sm:text-sm text-[var(--muted)] border-b border-[var(--border)] bg-[var(--input-bg)]">
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
                                key={p.product_id || p.id}
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
        </>
    );
}

export default memo(ProductTable);
