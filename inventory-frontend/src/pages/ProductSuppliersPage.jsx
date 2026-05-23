import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { assignSupplierToProduct, getAllProducts, removeSupplierFromProduct } from "../api/products";
import { getAllSuppliers } from "../api/suppliers";
import { clearPageCache } from "../store/pageCache";
import { AlertCircle, Calendar, Loader2, PackageSearch, Plus, Search, Trash2, Truck } from "lucide-react";

const getId = (row, keys) => keys.map((key) => row?.[key]).find((value) => value != null);

const getProductId = (product) => getId(product, ["id", "productId", "product_id", "productID"]);
const getSupplierId = (supplier) => getId(supplier, ["id", "supplierId", "supplier_id", "supplierID"]);

const formatMoney = (value) =>
    `PHP ${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function ProductSuppliersPage() {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [supplierPrice, setSupplierPrice] = useState("");
    const [leadTimeDays, setLeadTimeDays] = useState("3");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [productRows, supplierRows] = await Promise.all([
                getAllProducts(),
                getAllSuppliers(),
            ]);
            const nextProducts = Array.isArray(productRows) ? productRows : [];
            const nextSuppliers = Array.isArray(supplierRows) ? supplierRows : [];
            setProducts(nextProducts);
            setSuppliers(nextSuppliers);

            if (!selectedProductId && nextProducts.length > 0) {
                setSelectedProductId(String(getProductId(nextProducts[0])));
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load product supplier data.");
        } finally {
            setLoading(false);
        }
    }, [selectedProductId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            loadData();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadData]);

    const selectedProduct = useMemo(
        () => products.find((product) => String(getProductId(product)) === String(selectedProductId)),
        [products, selectedProductId]
    );

    const assignedSuppliers = useMemo(() => selectedProduct?.suppliers || [], [selectedProduct]);
    const assignedSupplierIds = useMemo(
        () => new Set(assignedSuppliers.map((supplier) => String(getSupplierId(supplier)))),
        [assignedSuppliers]
    );

    const availableSuppliers = useMemo(
        () => suppliers.filter((supplier) => !assignedSupplierIds.has(String(getSupplierId(supplier)))),
        [assignedSupplierIds, suppliers]
    );

    const filteredProducts = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) return products;

        return products.filter((product) => [
            product.name,
            product.sku,
            product.category?.name,
            product.categoryName,
        ].some((field) => String(field || "").toLowerCase().includes(value)));
    }, [products, query]);

    const handleAssign = async (event) => {
        event.preventDefault();
        if (!selectedProductId || !selectedSupplierId || !supplierPrice) return;

        try {
            setSaving(true);
            setError("");
            await assignSupplierToProduct(selectedProductId, {
                supplierId: Number(selectedSupplierId),
                supplierPrice: Number(supplierPrice),
                leadTimeDays: Number(leadTimeDays) || 1,
            });
            setSelectedSupplierId("");
            setSupplierPrice("");
            setLeadTimeDays("3");
            clearPageCache("products:");
            clearPageCache("dashboard");
            await loadData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to assign supplier.");
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (supplierId) => {
        if (!selectedProductId || !supplierId) return;
        if (!window.confirm("Remove this supplier from the selected product?")) return;

        try {
            setSaving(true);
            setError("");
            await removeSupplierFromProduct(selectedProductId, supplierId);
            clearPageCache("products:");
            clearPageCache("dashboard");
            await loadData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to remove supplier.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-h)] sm:text-2xl">
                        <Truck className="text-[var(--accent)]" size={24} />
                        Product Suppliers
                    </h1>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Assign suppliers, contract prices, and lead times to products.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-12">
                    <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                    <span className="ml-3 text-sm text-[var(--muted)]">Loading product supplier workspace...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
                    <aside className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow)] xl:self-start">
                        <div className="relative mb-3">
                            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search products..."
                                className="w-full rounded-lg py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--accent)]"
                            />
                        </div>

                        <div className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
                            {filteredProducts.map((product) => {
                                const productId = getProductId(product);
                                const active = String(productId) === String(selectedProductId);

                                return (
                                    <button
                                        key={productId}
                                        type="button"
                                        onClick={() => setSelectedProductId(String(productId))}
                                        className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                                            active
                                                ? "border-[var(--accent)] bg-[var(--input-bg)]"
                                                : "border-[var(--border)] hover:bg-[var(--input-bg)]"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-[var(--text-h)]">{product.name}</div>
                                                <div className="mt-1 text-xs text-[var(--muted)]">SKU: {product.sku || "N/A"}</div>
                                            </div>
                                            <span className="rounded-full bg-[var(--bg)] px-2 py-1 text-xs text-[var(--muted)]">
                                                {(product.suppliers || []).length}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <section className="space-y-5">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow)]">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-[var(--text-h)]">
                                        {selectedProduct?.name || "Select a product"}
                                    </h2>
                                    <p className="mt-1 text-xs text-[var(--muted)]">
                                        {(assignedSuppliers || []).length} assigned supplier{assignedSuppliers.length === 1 ? "" : "s"}
                                    </p>
                                </div>
                                <PackageSearch className="text-[var(--accent)]" size={22} />
                            </div>

                            <form onSubmit={handleAssign} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_160px_160px_auto] lg:items-end">
                                <label className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase text-[var(--muted)]">Supplier</span>
                                    <select
                                        value={selectedSupplierId}
                                        onChange={(event) => setSelectedSupplierId(event.target.value)}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                                    >
                                        <option value="">Choose supplier</option>
                                        {availableSuppliers.map((supplier) => {
                                            const supplierId = getSupplierId(supplier);
                                            return (
                                                <option key={supplierId} value={supplierId}>
                                                    {supplier.name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase text-[var(--muted)]">Price</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={supplierPrice}
                                        onChange={(event) => setSupplierPrice(event.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                                    />
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase text-[var(--muted)]">Lead days</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={leadTimeDays}
                                        onChange={(event) => setLeadTimeDays(event.target.value)}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                                    />
                                </label>

                                <button
                                    disabled={saving || !selectedProductId || !selectedSupplierId || !supplierPrice}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-text)] transition hover:opacity-95 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Assign
                                </button>
                            </form>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow)]">
                            <table className="w-full min-w-[680px] text-left text-sm">
                                <thead className="border-b border-[var(--border)] bg-[var(--input-bg)] text-xs uppercase text-[var(--muted)]">
                                    <tr>
                                        <th className="p-4 font-medium">Supplier</th>
                                        <th className="p-4 font-medium">Company</th>
                                        <th className="p-4 font-medium">Contract Price</th>
                                        <th className="p-4 font-medium">Lead Time</th>
                                        <th className="p-4 text-right font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {assignedSuppliers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-sm text-[var(--muted)]">
                                                No suppliers are assigned to this product yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        assignedSuppliers.map((supplier) => {
                                            const supplierId = getSupplierId(supplier);

                                            return (
                                                <tr key={supplierId} className="hover:bg-[var(--input-bg)]/40">
                                                    <td className="p-4 font-semibold text-[var(--text-h)]">
                                                        {supplier.name || supplier.supplierName || "Unknown supplier"}
                                                    </td>
                                                    <td className="p-4 text-[var(--muted)]">
                                                        {supplier.companyName || supplier.company_name || "N/A"}
                                                    </td>
                                                    <td className="p-4 font-semibold text-[var(--accent)]">
                                                        {formatMoney(supplier.supplierPrice || supplier.price)}
                                                    </td>
                                                    <td className="p-4 text-[var(--muted)]">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Calendar size={14} />
                                                            {supplier.leadTimeDays || supplier.leadTime || 0} days
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemove(supplierId)}
                                                            disabled={saving}
                                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                                                        >
                                                            <Trash2 size={14} />
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
        </DashboardLayout>
    );
}
