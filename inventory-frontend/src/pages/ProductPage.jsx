/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getAllProducts, createProduct, updateProduct, deleteProduct, updateStock } from "../api/products";
import { getAllCategories } from "../api/categories";
import ProductTable from "../components/products/ProductTable";
import Toolbar from "../components/products/Toolbar";
import ProductModal from "../components/products/ProductModal";
import StockModal from "../components/products/StockModal";
import DeleteConfirm from "../components/products/DeleteConfirm";
import ProductSuppliersModal from "../components/products/ProductSuppliersModal";
import { AlertCircle, RefreshCw, Package, Loader2 } from "lucide-react";
import { clearPageCache, getPageCache, setPageCache } from "../store/pageCache";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { exportToCsv, exportToPdf } from "../utils/exportUtils";

const ITEMS_PER_PAGE = 10;
const PRODUCT_FILTER_KEY = "products:filters";

const getProductCategoryId = (product) =>
    String(product.categoryId || product.category_id || product.category?.id || product.category?.categoryId || "");

const getProductStock = (product) => Number(product.stockQuantity ?? product.stock_quantity ?? product.stock ?? 0);

const getProductMinimumStock = (product) => Number(product.minimumStock ?? product.minimum_stock ?? product.reorderLevel ?? 0);

const productExportColumns = [
    { header: "Name", accessor: (product) => product.name || "Unnamed product" },
    { header: "SKU", accessor: (product) => product.sku || "" },
    { header: "Category", accessor: (product) => product.categoryName || product.category?.name || "Uncategorized" },
    { header: "Price", accessor: (product) => Number(product.price || 0).toFixed(2) },
    { header: "Stock", accessor: (product) => getProductStock(product) },
    { header: "Minimum Stock", accessor: (product) => getProductMinimumStock(product) },
];

export default function ProductPage() {
    const savedFilters = getPageCache(PRODUCT_FILTER_KEY) || {};
    const initialCache = getPageCache("products:all-page");
    const [allProducts, setAllProducts] = useState(initialCache?.products || []);
    const [categories, setCategories] = useState(initialCache?.categories || []);
    const [loading, setLoading] = useState(!initialCache);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(savedFilters.search || "");
    const [filters, setFilters] = useState(savedFilters.filters || { categoryId: "", stockStatus: "" });
    const [page, setPage] = useState(savedFilters.page || 1);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSuppliersModalOpen, setIsSuppliersModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const activeFetchRef = useRef(0);
    const mountedRef = useRef(false);
    const debouncedSearch = useDebouncedValue(search, 300);

    useEffect(() => {
        setPageCache(PRODUCT_FILTER_KEY, { search, filters, page });
    }, [search, filters, page]);

    const filteredProducts = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();
        return allProducts.filter((product) => {
            const matchesQuery = !query || [
                product.name,
                product.sku,
                product.categoryName,
                product.category?.name,
            ].some((value) => String(value || "").toLowerCase().includes(query));

            const matchesCategory = !filters.categoryId || getProductCategoryId(product) === String(filters.categoryId);
            const stock = getProductStock(product);
            const minimumStock = getProductMinimumStock(product);
            const matchesStock =
                !filters.stockStatus ||
                (filters.stockStatus === "out-of-stock" && stock <= 0) ||
                (filters.stockStatus === "low-stock" && stock > 0 && stock <= minimumStock) ||
                (filters.stockStatus === "in-stock" && stock > Math.max(minimumStock, 0));

            return matchesQuery && matchesCategory && matchesStock;
        });
    }, [allProducts, debouncedSearch, filters]);

    const totalItems = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const products = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [currentPage, filteredProducts]);

    const loadProducts = useCallback(async ({ force = false } = {}) => {
        const cached = getPageCache("products:all-page");
        if (cached) {
            setAllProducts(cached.products);
            setCategories(cached.categories || []);
            setLoading(false);
            if (!force) return;
        }

        activeFetchRef.current += 1;
        const currentFetchId = activeFetchRef.current;

        try {
            if (!allProducts.length) setLoading(true);
            setError(null);
            const [productRows, categoryRows] = await Promise.all([
                getAllProducts(),
                getAllCategories().catch(() => []),
            ]);
            
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;

            const nextProducts = Array.isArray(productRows) ? productRows : [];
            const nextCategories = Array.isArray(categoryRows) ? categoryRows : [];
            setAllProducts(nextProducts);
            setCategories(nextCategories);
            setPageCache("products:all-page", { products: nextProducts, categories: nextCategories });
        } catch (err) {
            if (currentFetchId !== activeFetchRef.current || !mountedRef.current) return;
            console.error(err);
            setError(err.response?.data?.message || "Failed to load products");
        } finally {
            if (currentFetchId === activeFetchRef.current && mountedRef.current) {
                setLoading(false);
            }
        }
    }, [allProducts.length]);

    useEffect(() => {
        mountedRef.current = true;
        loadProducts();
        return () => {
            mountedRef.current = false;
        };
    }, [loadProducts]);

    const handleSearch = useCallback((query) => {
        setSearch(query);
        setPage(1);
    }, []);

    const handleFilterChange = useCallback((key, value) => {
        setPage(1);
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearch("");
        setFilters({ categoryId: "", stockStatus: "" });
        setPage(1);
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
            loadProducts({ force: true });
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
            loadProducts({ force: true });
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
            loadProducts({ force: true });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to delete product");
        } finally {
            setModalLoading(false);
        }
    };

    const exportSubtitle = `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} matching current search and filters`;

    const handleExportCsv = useCallback(() => {
        exportToCsv({ title: "Products", columns: productExportColumns, rows: filteredProducts });
    }, [filteredProducts]);

    const handleExportPdf = useCallback(() => {
        exportToPdf({ title: "Products", subtitle: exportSubtitle, columns: productExportColumns, rows: filteredProducts });
    }, [exportSubtitle, filteredProducts]);

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
            <Toolbar
                onSearch={handleSearch}
                onCreate={handleCreateProduct}
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={categories}
                onClearFilters={handleClearFilters}
                onExportCsv={handleExportCsv}
                onExportPdf={handleExportPdf}
                exportDisabled={filteredProducts.length === 0}
            />
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
                        onClick={() => loadProducts({ force: true })}
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
            refresh={() => loadProducts({ force: true })}
            onEdit={handleEditProduct}
            onStock={handleStockModal}
            onDelete={handleDeleteModal}
            onSuppliers={handleSuppliersModal}
        />

        {/* PAGINATION CONTROLS */}
        {!loading && products.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]">
                <div className="text-sm text-[var(--muted)] order-2 sm:order-1">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} products
                </div>
                
                <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
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
                                        currentPage === pageNum
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
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
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
                loadProducts({ force: true });
            }}
        />
        </DashboardLayout>
    );
}
