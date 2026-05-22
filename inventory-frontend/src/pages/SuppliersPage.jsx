import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../components/context/AuthContext";
import { 
    getAllSuppliers, 
    createSupplier, 
    updateSupplier, 
    deleteSupplier 
} from "../api/suppliers";
import { 
    Truck, 
    Plus, 
    Search, 
    Loader2, 
    AlertCircle 
} from "lucide-react";
import SupplierTable from "../components/suppliers/SupplierTable";
import SupplierModal from "../components/suppliers/SupplierModal";
import { clearPageCache, getPageCache, setPageCache } from "../store/pageCache";

export default function SuppliersPage() {
    const { user } = useAuth();
    const cachedSuppliers = getPageCache("suppliers");
    const [suppliers, setSuppliers] = useState(cachedSuppliers?.suppliers || []);
    const [loading, setLoading] = useState(!cachedSuppliers);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const activeFetchRef = useRef(0);
    const loadingRef = useRef(false);
    const mountedRef = useRef(false);

    // Authority Checks
    const role = user?.role?.replace("ROLE_", "").toUpperCase() || "";
    const canCreateOrUpdate = ["ADMIN", "MANAGER"].includes(role);
    const canDelete = ["ADMIN"].includes(role);

    useEffect(() => {
        mountedRef.current = true;
        if (!cachedSuppliers) {
            loadSuppliers();
        }

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadSuppliers = async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        activeFetchRef.current += 1;
        const currentFetchId = activeFetchRef.current;
        try {
            setLoading(true);
            setError(null);
            const data = await getAllSuppliers();
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;
            const rows = Array.isArray(data) ? data : data.data || [];
            setSuppliers(rows);
            setPageCache("suppliers", { suppliers: rows });
        } catch (err) {
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;
            console.error(err);
            setError(err.response?.data?.message || "Failed to load suppliers");
        } finally {
            loadingRef.current = false;
            if (currentFetchId === activeFetchRef.current && mountedRef.current) {
                setLoading(false);
            }
        }
    };

    const handleOpenModal = (sup = null) => {
        setSelectedSupplier(sup);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSupplier(null);
    };

    const handleSave = async (payload) => {
        try {
            setModalLoading(true);
            const id = selectedSupplier?.id || selectedSupplier?.supplierId || selectedSupplier?.supplier_id;
            if (selectedSupplier) {
                await updateSupplier(id, payload);
            } else {
                await createSupplier(payload);
            }
            clearPageCache("suppliers");
            clearPageCache("dashboard");
            handleCloseModal();
            loadSuppliers();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to save supplier. Email might be in use.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (sup) => {
        const id = sup.id || sup.supplierId || sup.supplier_id;
        if (!window.confirm(`Are you sure you want to delete supplier "${sup.name}"?`)) return;

        try {
            setLoading(true);
            await deleteSupplier(id);
            clearPageCache("suppliers");
            clearPageCache("dashboard");
            loadSuppliers();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to delete supplier");
            setLoading(false);
        }
    };

    const filteredSuppliers = suppliers.filter((sup) =>
        sup.name?.toLowerCase().includes(search.toLowerCase()) ||
        sup.contactName?.toLowerCase().includes(search.toLowerCase()) ||
        sup.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        sup.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        sup.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-h)] flex items-center gap-2">
                        <Truck className="text-[var(--accent)]" size={24} />
                        Suppliers
                        {loading && suppliers.length > 0 && (
                            <Loader2 size={18} className="animate-spin text-[var(--accent)] ml-2" />
                        )}
                    </h1>
                    <p className="text-sm text-[var(--muted)] mt-1">
                        Manage supply channels, pricing partnerships, and contact logistics
                    </p>
                </div>

                {canCreateOrUpdate && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="
                            flex items-center gap-2
                            px-4 py-2.5 rounded-lg
                            bg-[var(--accent)] text-[var(--accent-text)]
                            font-medium hover:opacity-90 transition
                            shadow-[var(--shadow)] text-sm
                        "
                    >
                        <Plus size={18} />
                        Add Supplier
                    </button>
                )}
            </div>

            {/* SEARCH */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search by supplier name, contact, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none"
                    />
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-1 rounded transition text-xs font-semibold"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* CONTENT */}
            {loading && suppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                    <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                    <span className="mt-3 text-sm text-[var(--muted)]">Loading partner supply network...</span>
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-center">
                    <Truck size={48} className="text-[var(--muted)] mb-3" />
                    <h3 className="text-lg text-[var(--text-h)] font-medium mb-1">No Suppliers Found</h3>
                    <p className="text-sm text-[var(--muted)] max-w-md">
                        {search ? `No suppliers match your search "${search}"` : "Establish procurement links by adding your first supplier."}
                    </p>
                </div>
            ) : (
                /* TABLE */
                <div className={`${loading ? "opacity-60 pointer-events-none" : ""} transition-opacity duration-200`}>
                    <SupplierTable
                        suppliers={filteredSuppliers}
                        canEdit={canCreateOrUpdate}
                        canDelete={canDelete}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                    />
                </div>
            )}

            {/* MODAL */}
            <SupplierModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                selectedSupplier={selectedSupplier}
                onSave={handleSave}
                loading={modalLoading}
            />
        </DashboardLayout>
    );
}
