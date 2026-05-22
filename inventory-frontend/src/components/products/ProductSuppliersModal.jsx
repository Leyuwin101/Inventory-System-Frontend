import { useEffect, useState } from "react";
import { Loader2, X, Plus, Trash2, Truck, DollarSign, Calendar } from "lucide-react";
import { getAllSuppliers } from "../../api/suppliers";
import { assignSupplierToProduct, removeSupplierFromProduct, getProductById } from "../../api/products";

export default function ProductSuppliersModal({ open, onClose, product, onUpdate }) {
    const [allSuppliers, setAllSuppliers] = useState([]);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    
    // Assignment Form
    const [form, setForm] = useState({
        supplierId: "",
        price: "",
        leadTime: "3"
    });

    useEffect(() => {
        if (open && product) {
            loadSuppliersAndProduct();
        }
    }, [open, product]);

    const loadSuppliersAndProduct = async () => {
        try {
            setLoading(true);
            const productId = product.product_id || product.id;
            
            // Parallel fetches
            const [suppliersData, freshProduct] = await Promise.all([
                getAllSuppliers(),
                getProductById(productId)
            ]);
            
            setAllSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.data || []);
            setCurrentProduct(freshProduct || product);
        } catch (err) {
            console.error("Failed to load product/supplier relations:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!form.supplierId || !form.price) return;

        try {
            setModalLoading(true);
            const productId = currentProduct?.product_id || currentProduct?.id;
            
            const payload = {
                supplierID: Number(form.supplierId),
                supplierId: Number(form.supplierId),
                supplierPrice: Number(form.price),
                price: Number(form.price),
                leadTimeDays: Number(form.leadTime) || 3,
                leadTime: Number(form.leadTime) || 3
            };

            await assignSupplierToProduct(productId, payload);
            
            // Reset form
            setForm({ supplierId: "", price: "", leadTime: "3" });
            
            // Reload relations
            await loadSuppliersAndProduct();
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to assign supplier to product");
        } finally {
            setModalLoading(false);
        }
    };

    const handleRemove = async (supplierId) => {
        if (!window.confirm("Are you sure you want to remove this supplier association?")) return;

        try {
            setModalLoading(true);
            const productId = currentProduct?.product_id || currentProduct?.id;
            
            await removeSupplierFromProduct(productId, supplierId);
            
            // Reload relations
            await loadSuppliersAndProduct();
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to remove supplier");
        } finally {
            setModalLoading(false);
        }
    };

    // Filter out suppliers that are already assigned
    const assignedSupplierIds = new Set(
        (currentProduct?.suppliers || []).map((s) => s.id || s.supplierId || s.supplier_id)
    );
    const unassignedSuppliers = allSuppliers.filter(
        (s) => !assignedSupplierIds.has(s.id || s.supplierId || s.supplier_id)
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl p-6 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-5 border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                            <Truck size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-h)]">
                                Manage Suppliers
                            </h2>
                            <p className="text-xs text-[var(--muted)] mt-0.5">
                                Product: <span className="text-[var(--text-h)] font-medium">{product?.name}</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={modalLoading}
                        className="p-1 rounded-lg hover:bg-[var(--input-bg)] transition"
                    >
                        <X size={20} className="text-[var(--muted)]" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                        <span className="ml-3 text-sm text-[var(--muted)]">Loading suppliers network...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* CURRENT ASSIGNMENTS */}
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--text-h)] mb-3 flex items-center gap-1.5">
                                Assigned Suppliers ({(currentProduct?.suppliers || []).length})
                            </h3>
                            
                            {(currentProduct?.suppliers || []).length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted)]">
                                    No suppliers assigned yet. Use the form below to connect one.
                                </div>
                            ) : (
                                <div className="w-full overflow-x-auto rounded-lg border border-[var(--border)]">
                                    <table className="w-full text-xs text-left">
                                        <thead className="text-[var(--muted)] border-b border-[var(--border)] bg-[var(--input-bg)]">
                                            <tr>
                                                <th className="p-3 font-medium">Supplier</th>
                                                <th className="p-3 font-medium">Supply Price</th>
                                                <th className="p-3 font-medium">Lead Time</th>
                                                <th className="p-3 font-medium text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                                            {currentProduct.suppliers.map((sup, idx) => {
                                                const sId = sup.id || sup.supplierId || sup.supplier_id;
                                                return (
                                                    <tr key={sId || idx} className="hover:bg-[var(--input-bg)]/50 transition">
                                                        <td className="p-3 font-medium text-[var(--text-h)]">
                                                            {sup.name || "Unknown Supplier"}
                                                        </td>
                                                        <td className="p-3 text-[var(--accent)] font-semibold">
                                                            ₱{Number(sup.pivot?.price || sup.price || sup.supplierPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="p-3">
                                                            {sup.pivot?.leadTime || sup.leadTime || sup.leadTimeDays || 3} days
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemove(sId)}
                                                                disabled={modalLoading}
                                                                className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                                                title="Remove Association"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* ASSIGN NEW FORM */}
                        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)]/20">
                            <h3 className="text-sm font-semibold text-[var(--text-h)] mb-4 flex items-center gap-1.5">
                                <Plus size={16} className="text-[var(--accent)]" />
                                Assign / Update Supplier Contract
                            </h3>
                            
                            <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1.5">Select Supplier *</label>
                                    <select
                                        required
                                        value={form.supplierId}
                                        onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-xs focus:outline-none"
                                    >
                                        <option value="">-- Choose Supplier --</option>
                                        {unassignedSuppliers.map((s) => {
                                            const sId = s.id || s.supplierId || s.supplier_id;
                                            return (
                                                <option key={sId} value={sId}>
                                                    {s.name}
                                                </option>
                                            );
                                        })}
                                        {assignedSupplierIds.size > 0 && (
                                            <optgroup label="Already Assigned (Select to Update)">
                                                {(currentProduct?.suppliers || []).map((s) => {
                                                    const sId = s.id || s.supplierId || s.supplier_id;
                                                    return (
                                                        <option key={sId} value={sId}>
                                                            {s.name}
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1.5 flex items-center gap-1">
                                        <DollarSign size={12} /> Contract Price (₱) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-xs focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1.5 flex items-center gap-1">
                                        <Calendar size={12} /> Lead Time (days)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="3"
                                            value={form.leadTime}
                                            onChange={(e) => setForm({ ...form, leadTime: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-xs focus:outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={modalLoading || !form.supplierId || !form.price}
                                            className="
                                                flex items-center justify-center p-2 rounded-lg
                                                bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 transition disabled:opacity-50
                                            "
                                        >
                                            {modalLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
