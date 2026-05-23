import { memo } from "react";
import { Edit3, Package, Trash2, Truck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function ProductRow({ product, onEdit, onStock, onDelete, onSuppliers }) {
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
        <tr className="border-b border-[var(--border)] hover:bg-[var(--input-bg)] transition group">
            <td className="p-3 sm:p-4">
                <div className="font-medium text-[var(--text-h)] text-sm sm:text-base">{product.name}</div>
                <div className="text-xs text-[var(--muted)] md:hidden mt-1">SKU: {product.sku}</div>
            </td>

            <td className="p-3 sm:p-4 hidden md:table-cell text-[var(--muted)] text-sm">{categoryName}</td>
            <td className="p-3 sm:p-4 hidden sm:table-cell text-[var(--muted)] text-sm">{product.sku}</td>
            <td className="p-3 sm:p-4 text-[var(--text-h)] text-sm font-medium">
                PHP {Number(product.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </td>

            <td className="p-3 sm:p-4 text-[var(--muted)] text-sm">
                <span className={lowStock ? "text-red-400" : ""}>{stock}</span>
            </td>

            <td className="p-3 sm:p-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border whitespace-nowrap ${
                    lowStock
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : "bg-green-500/10 text-green-400 border-green-500/30"
                }`}>
                    <Package size={12} className="mr-1" />
                    {lowStock ? "Low" : "In"}
                </span>
            </td>

            <td className="p-3 sm:p-4 text-right">
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                    {canEdit && (
                        <button onClick={() => onEdit(product)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[var(--input-bg)] hover:bg-[var(--border)] transition" title="Edit">
                            <Edit3 size={14} className="text-[var(--muted)]" />
                        </button>
                    )}

                    {canStock && (
                        <button onClick={() => onStock(product)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[var(--input-bg)] hover:bg-[var(--border)] transition" title="Update Stock">
                            <Package size={14} className="text-[var(--muted)]" />
                        </button>
                    )}

                    {canManageSuppliers && (
                        <button onClick={() => onSuppliers(product)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[var(--input-bg)] hover:bg-[var(--border)] transition" title="Manage Suppliers">
                            <Truck size={14} className="text-[var(--muted)]" />
                        </button>
                    )}

                    {canDelete && (
                        <button onClick={() => onDelete(product)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 transition" title="Delete">
                            <Trash2 size={14} className="text-red-400" />
                        </button>
                    )}

                    {!canEdit && !canStock && !canDelete && !canManageSuppliers && (
                        <span className="text-xs text-[var(--muted)] italic">No actions</span>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default memo(ProductRow);
