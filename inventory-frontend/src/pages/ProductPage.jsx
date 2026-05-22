import { useEffect, useState, useCallback, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getProducts, createProduct, updateProduct, deleteProduct, updateStock } from "../api/products";
import ProductTable from "../components/products/ProductTable";
import Toolbar from "../components/products/Toolbar";
import ProductModal from "../components/products/ProductModal";
import StockModal from "../components/products/StockModal";
import DeleteConfirm from "../components/products/DeleteConfirm";
import ProductSuppliersModal from "../components/products/ProductSuppliersModal";
import { AlertCircle, RefreshCw, Package, Loader2 } from "lucide-react";
import { clearPageCache, getPageCache, setPageCache } from "../store/pageCache";

const ITEMS_PER_PAGE = 10;

export default function ProductPage() {
    const initialCache = getPageCache("products:1:");
    const [products, setProducts] = useState(initialCache?.products || []);
    const [loading, setLoading] = useState(!initialCache);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSuppliersModalOpen, setIsSuppliersModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const activeFetchRef = useRef(0);
    const loadingRef = useRef(false);
    const mountedRef = useRef(false);

    // Debounce search input to debouncedSearch state
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // When debounced search changes, reset page to 1
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    // Load products when page or debouncedSearch changes
    useEffect(() => {
        loadProducts(page, debouncedSearch);
    }, [page, debouncedSearch]);

    const loadProducts = async (pageNum = page, searchQuery = debouncedSearch) => {
        const cacheKey = `products:${pageNum}:${searchQuery}`;
        const cached = getPageCache(cacheKey);
        if (cached) {
            setProducts(cached.products);
            setTotalPages(cached.totalPages);
            setTotalItems(cached.totalItems);
            setLoading(false);
            return;
        }

        if (loadingRef.current) return;
        loadingRef.current = true;
        activeFetchRef.current += 1;
        const currentFetchId = activeFetchRef.current;

        try {
            setLoading(true);
            setError(null);
            const data = await getProducts(pageNum, ITEMS_PER_PAGE, searchQuery);
            
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;

            // Handle both paginated and non-paginated responses
            if (data.products) {
                setProducts(data.products);
                setTotalPages(data.totalPages || 1);
                setTotalItems(data.totalItems || 0);
                setPageCache(cacheKey, {
                    products: data.products,
                    totalPages: data.totalPages || 1,
                    totalItems: data.totalItems || 0,
                });
            } else {
                // Legacy non-paginated response
                setProducts(data.data || data);
                setTotalPages(1);
                setTotalItems(Array.isArray(data.data || data) ? (data.data || data).length : 0);
                setPageCache(cacheKey, {
                    products: data.data || data,
                    totalPages: 1,
                    totalItems: Array.isArray(data.data || data) ? (data.data || data).length : 0,
                });
            }
        } catch (err) {
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;
            console.error(err);
            setError(err.response?.data?.message || "Failed to load products");
        } finally {
            loadingRef.current = false;
            if (currentFetchId === activeFetchRef.current && mountedRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const handleSearch = useCallback((query) => {
        setSearch(query);
    }, []);

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    }, [totalPages]);

    const handleCreateProduct = useCallback(() => {
        setSelectedProduct(null);
        setIsProductModalOpen(true);
    }, []);

    const handleEditProduct = useCallback((product) => {
        setSelectedProduct(product);
        setIsProductModalOpen(true);
    }, []);

    const handleStockModal = useCallback((product) => {
        setSelectedProduct(product);
        setIsStockModalOpen(true);
    }, []);

    const handleDeleteModal = useCallback((product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    }, []);

    const handleSuppliersModal = useCallback((product) => {
        setSelectedProduct(product);
        setIsSuppliersModalOpen(true);
    }, []);

    const handleSaveProduct = async (id, payload) => {
        try {
            setModalLoading(true);
            if (id) {
                await updateProduct(id, payload);
            } else {
                await createProduct(payload);
            }
            clearPageCache("products:");
            clearPageCache("dashboard");
            setIsProductModalOpen(false);
            loadProducts(page, search);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to save product");
        } finally {
            setModalLoading(false);
        }
    };

    const handleSaveStock = async (id, quantity) => {
        try {
            setModalLoading(true);
            await updateStock(id, quantity);
            clearPageCache("products:");
            clearPageCache("dashboard");
            setIsStockModalOpen(false);
            loadProducts(page, search);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to update stock");
        } finally {
            setModalLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedProduct) return;
        try {
            setModalLoading(true);
            await deleteProduct(selectedProduct.product_id);
            clearPageCache("products:");
            clearPageCache("dashboard");
            setIsDeleteModalOpen(false);
            loadProducts(page, search);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to delete product");
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <DashboardLayout>
        <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-h)] flex items-center gap-2">
                Products
                {loading && products.length > 0 && (
                    <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                )}
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">
                Manage inventory products
            </p>
        </div>

        {/* SEARCH TOOLBAR */}
        <div className="mb-4 sm:mb-6">
            <Toolbar onSearch={handleSearch} onCreate={handleCreateProduct} />
        </div>

        {/* ERROR ALERT */}
        {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                        onClick={() => loadProducts(page, search)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition text-sm whitespace-nowrap"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition text-sm font-semibold"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        )}

        {/* PRODUCT TABLE */}
        <ProductTable
            products={products}
            loading={loading}
            refresh={() => loadProducts(page, search)}
            onEdit={handleEditProduct}
            onStock={handleStockModal}
            onDelete={handleDeleteModal}
            onSuppliers={handleSuppliersModal}
        />

        {/* PAGINATION CONTROLS */}
        {!loading && products.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]">
                <div className="text-sm text-[var(--muted)] order-2 sm:order-1">
                    Showing {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, totalItems)} of {totalItems} products
                </div>
                
                <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-8 h-8 text-sm rounded-lg transition ${
                                        page === pageNum
                                        ? "bg-[var(--accent)] text-[var(--accent-text)]"
                                        : "bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--border)]"
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                    
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Next
                    </button>
                </div>
            </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
                <Package size={48} className="text-[var(--muted)] mb-4" />
                <p className="text-lg text-[var(--text-h)] mb-2">No products found</p>
                <p className="text-sm text-[var(--muted)]">
                    {search ? `No results for "${search}"` : "Add your first product to get started"}
                </p>
            </div>
        )}

        {/* MODALS */}
        <ProductModal
            open={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            onSave={handleSaveProduct}
            product={selectedProduct}
            loading={modalLoading}
        />

        <StockModal
            open={isStockModalOpen}
            onClose={() => setIsStockModalOpen(false)}
            onSave={handleSaveStock}
            product={selectedProduct}
            loading={modalLoading}
        />

        <DeleteConfirm
            open={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            product={selectedProduct}
            loading={modalLoading}
        />

        <ProductSuppliersModal
            open={isSuppliersModalOpen}
            onClose={() => setIsSuppliersModalOpen(false)}
            product={selectedProduct}
            onUpdate={() => {
                clearPageCache("products:");
                clearPageCache("dashboard");
                loadProducts(page, search);
            }}
        />
        </DashboardLayout>
    );
}
