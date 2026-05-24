import { useState, useEffect } from "react";
import { Loader2, X, Package } from "lucide-react";
import { getAllCategories } from "../../api/categories";

export default function ProductModal({ open, onClose, onSave, product, loading }) {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        name: "",
        sku: "",
        category_id: "",
        price: "",
        stock_quantity: "",
        minimum_stock: "5"
    });

    useEffect(() => {
        if (product) {
            setForm({
                name: product.name || "",
                sku: product.sku || "",
                category_id: product.category_id || "",
                price: product.price || "",
                stock_quantity: product.stock_quantity || "",
                minimum_stock: product.minimum_stock || "5"
            });
        } else {
            // Reset for new product
            setForm({
                name: "",
                sku: "",
                category_id: "",
                price: "",
                stock_quantity: "",
                minimum_stock: "5"
            });
        }
    }, [product, open]);

    useEffect(() => {
        if (open) {
            loadCategories();
        }
    }, [open]);

    const loadCategories = async () => {
        try {
            const data = await getAllCategories();
            setCategories(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            console.error("Failed to load categories in modal dropdown:", err);
        }
    };

    if (!open) return null;

    const handleSave = () => {
        // Validate
        if (!form.name.trim()) return;
        if (!form.price || Number(form.price) <= 0) return;
        
        const payload = {
            name: form.name.trim(),
            sku: form.sku?.trim() || null,
            category_id: form.category_id || null,
            price: Number(form.price),
            stock_quantity: Number(form.stock_quantity) || 0,
            minimum_stock: Number(form.minimum_stock) || 5
        };
        
        onSave(product?.product_id, payload);
    };

    const isValid = form.name.trim() && form.price && Number(form.price) > 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-0 sm:items-center sm:p-4">
            <div className="w-full max-w-lg p-4 sm:p-6 rounded-t-2xl sm:rounded-xl bg-[var(--card-bg)] border border-[var(--border)] max-h-[92dvh] overflow-y-auto">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--accent)]/10">
                            <Package size={20} className="text-[var(--accent)]" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-h)]">
                            {product ? "Edit Product" : "Add New Product"}
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

                {/* FORM */}
                <div className="space-y-4">
                    {/* NAME */}
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1.5">Product Name *</label>
                        <input
                            type="text"
                            placeholder="Enter product name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)]"
                        />
                    </div>

                    {/* SKU */}
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1.5">SKU</label>
                        <input
                            type="text"
                            placeholder="Enter SKU (optional)"
                            value={form.sku}
                            onChange={(e) => setForm({ ...form, sku: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)]"
                        />
                    </div>

                    {/* CATEGORY & PRICE ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--muted)] mb-1.5">Category</label>
                            <select
                                value={form.category_id || ""}
                                onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none"
                            >
                                <option value="">-- Choose Category --</option>
                                {categories.map((cat) => {
                                    const id = cat.id || cat.categoryId || cat.category_id;
                                    return (
                                        <option key={id} value={id}>
                                            {cat.name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--muted)] mb-1.5">Price *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)]"
                            />
                        </div>
                    </div>

                    {/* STOCK ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--muted)] mb-1.5">
                                {product ? "Current Stock" : "Initial Stock"}
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={form.stock_quantity}
                                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--muted)] mb-1.5">Minimum Stock</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="5"
                                value={form.minimum_stock}
                                onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)]"
                            />
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--card-bg)] px-4 pt-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:gap-3 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-0">
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-lg text-[var(--muted)] hover:bg-[var(--input-bg)] transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading || !isValid}
                        className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {product ? "Save Changes" : "Add Product"}
                    </button>
                </div>
            </div>
        </div>
    );
}
