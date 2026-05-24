import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";

export default function StockModal({ open, onClose, onSave, product, loading }) {
    const [qty, setQty] = useState(0);
    const [mode, setMode] = useState("set"); // set, add, remove

    useEffect(() => {
        if (product) {
            setQty(product.stock_quantity || 0);
        }
    }, [product]);

    if (!open) return null;

    const handleSave = () => {
        if (mode === "set") {
            onSave(product.product_id, qty);
        } else if (mode === "add") {
            onSave(product.product_id, (product.stock_quantity || 0) + qty);
        } else if (mode === "remove") {
            onSave(product.product_id, Math.max(0, (product.stock_quantity || 0) - qty));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-0 sm:items-center sm:p-4">
            <div className="w-full max-w-md p-4 sm:p-6 rounded-t-2xl sm:rounded-xl bg-[var(--card-bg)] border border-[var(--border)] max-h-[92dvh] overflow-y-auto">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text-h)]">
                        Update Stock
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-[var(--input-bg)]"
                    >
                        <X size={20} className="text-[var(--muted)]" />
                    </button>
                </div>

                {/* PRODUCT INFO */}
                <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] mb-4">
                    <p className="font-medium text-[var(--text-h)]">{product.name}</p>
                    <p className="text-sm text-[var(--muted)]">Current stock: {product.stock_quantity}</p>
                </div>

                {/* MODE SELECTOR */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {["set", "add", "remove"].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                                mode === m
                                ? "bg-[var(--accent)] text-[var(--accent-text)]"
                                : "bg-[var(--input-bg)] border border-[var(--border)] text-[var(--muted)]"
                            }`}
                        >
                            {m === "set" ? "Set" : m === "add" ? "Add" : "Remove"}
                        </button>
                    ))}
                </div>

                {/* QUANTITY INPUT */}
                <div className="mb-4">
                    <label className="block text-sm text-[var(--muted)] mb-2">
                        {mode === "set" ? "New Quantity" : `Quantity to ${mode}`}
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)]"
                    />
                </div>

                {/* PREVIEW */}
                <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] mb-4">
                    <p className="text-sm text-[var(--muted)]">
                        New stock will be:{" "}
                        <span className="font-medium text-[var(--text-h)]">
                            {mode === "set" 
                                ? qty 
                                : mode === "add" 
                                    ? (product.stock_quantity || 0) + qty 
                                    : Math.max(0, (product.stock_quantity || 0) - qty)
                            }
                        </span>
                    </p>
                </div>

                {/* ACTIONS */}
                <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--card-bg)] px-4 pt-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:gap-3 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-0">
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-lg text-[var(--muted)] hover:bg-[var(--input-bg)] transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading || qty < 0}
                        className="px-4 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Update Stock
                    </button>
                </div>
            </div>
        </div>
    );
}
