import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../components/context/AuthContext";
import { 
    getAllCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} from "../api/categories";
import { 
    Folder, 
    FolderPlus, 
    Search, 
    Loader2, 
    AlertCircle 
} from "lucide-react";
import CategoryCard from "../components/categories/CategoryCard";
import CategoryModal from "../components/categories/CategoryModal";
import { clearPageCache, getPageCache, setPageCache } from "../store/pageCache";

export default function CategoryPage() {
    const { user } = useAuth();
    const cachedCategories = getPageCache("categories");
    const [categories, setCategories] = useState(cachedCategories?.categories || []);
    const [loading, setLoading] = useState(!cachedCategories);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const activeFetchRef = useRef(0);
    const loadingRef = useRef(false);
    const mountedRef = useRef(false);

    // Authority Checks
    const role = user?.role?.replace("ROLE_", "").toUpperCase() || "";
    const canCreateOrUpdate = ["ADMIN", "MANAGER", "INVENTORY_CLERK"].includes(role);
    const canDelete = ["ADMIN"].includes(role);

    useEffect(() => {
        mountedRef.current = true;
        if (!cachedCategories) {
            loadCategories();
        }

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadCategories = async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        activeFetchRef.current += 1;
        const currentFetchId = activeFetchRef.current;
        try {
            setLoading(true);
            setError(null);
            const data = await getAllCategories();
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;
            const rows = Array.isArray(data) ? data : data.data || [];
            setCategories(rows);
            setPageCache("categories", { categories: rows });
        } catch (err) {
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;
            console.error(err);
            setError(err.response?.data?.message || "Failed to load categories");
        } finally {
            loadingRef.current = false;
            if (currentFetchId === activeFetchRef.current && mountedRef.current) {
                setLoading(false);
            }
        }
    };

    const handleOpenModal = (cat = null) => {
        setSelectedCategory(cat);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCategory(null);
    };

    const handleSave = async (payload) => {
        try {
            setModalLoading(true);
            if (selectedCategory) {
                const id = selectedCategory.id || selectedCategory.categoryId || selectedCategory.category_id;
                await updateCategory(id, payload);
            } else {
                await createCategory(payload);
            }
            clearPageCache("categories");
            clearPageCache("dashboard");
            handleCloseModal();
            loadCategories();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to save category");
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (cat) => {
        const id = cat.id || cat.categoryId || cat.category_id;
        if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

        try {
            setLoading(true);
            await deleteCategory(id);
            clearPageCache("categories");
            clearPageCache("dashboard");
            loadCategories();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to delete category. It might be assigned to products.");
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter((cat) =>
        cat.name?.toLowerCase().includes(search.toLowerCase()) ||
        cat.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-h)] flex items-center gap-2">
                        <Folder className="text-[var(--accent)]" size={24} />
                        Categories
                        {loading && categories.length > 0 && (
                            <Loader2 size={18} className="animate-spin text-[var(--accent)] ml-2" />
                        )}
                    </h1>
                    <p className="text-sm text-[var(--muted)] mt-1">
                        Organize and classify products in your inventory
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
                        <FolderPlus size={18} />
                        Add Category
                    </button>
                )}
            </div>

            {/* SEARCH TOOLBAR */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none"
                    />
                </div>
            </div>

            {/* ERROR STATUS */}
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

            {/* LOADING STATE */}
            {loading && categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                    <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                    <span className="mt-3 text-sm text-[var(--muted)]">Loading classification categories...</span>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-center">
                    <Folder size={48} className="text-[var(--muted)] mb-3" />
                    <h3 className="text-lg text-[var(--text-h)] font-medium mb-1">No Categories Found</h3>
                    <p className="text-sm text-[var(--muted)] max-w-md">
                        {search ? `No categories match your search "${search}"` : "Get started by adding your first product category."}
                    </p>
                </div>
            ) : (
                /* CATEGORIES GRID */
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${loading ? "opacity-60 pointer-events-none" : ""} transition-opacity duration-200`}>
                    {filteredCategories.map((cat, index) => (
                        <CategoryCard
                            key={cat.id || cat.categoryId || cat.category_id || index}
                            category={cat}
                            index={index}
                            canEdit={canCreateOrUpdate}
                            canDelete={canDelete}
                            onEdit={handleOpenModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* CREATE/EDIT MODAL */}
            <CategoryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                selectedCategory={selectedCategory}
                onSave={handleSave}
                loading={modalLoading}
            />
        </DashboardLayout>
    );
}
