import { Loader2, X, AlertTriangle } from "lucide-react";

export default function DeleteConfirm({ open, onClose, onConfirm, product, loading }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="p-5 sm:p-6 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] w-full max-w-sm">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <AlertTriangle size={20} className="text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-h)]">
                            Delete Product
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="p-1.5 rounded-lg hover:bg-[var(--input-bg)]"
                    >
                        <X size={20} className="text-[var(--muted)]" />
                    </button>
                </div>

                {/* WARNING */}
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 mb-5">
                    <p className="text-sm text-red-400">
                        <b>Warning:</b> This action cannot be undone. Deleting this product will remove it from your inventory entirely.
                    </p>
                </div>

                {/* PRODUCT INFO */}
                <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] mb-5">
                    <p className="text-sm text-[var(--muted)]">Deleting:</p>
                    <p className="font-medium text-[var(--text-h)]">{product?.name}</p>
                    {product?.sku && (
                        <p className="text-xs text-[var(--muted)]">SKU: {product.sku}</p>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-2 sm:gap-3">
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-lg text-[var(--muted)] hover:bg-[var(--input-bg)] transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Delete Product
                    </button>
                </div>
            </div>
        </div>
    );
}
