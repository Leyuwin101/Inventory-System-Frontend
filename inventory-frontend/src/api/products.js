import { api } from "./client";
import { asArray, normalizeProduct, toProductRequest, unwrapApiData } from "./normalizers";
import { cachedRequest, invalidateCache, mutateCache } from "./requestCache";

export const PRODUCTS_ALL_CACHE_KEY = "products:all";

/**
 * Get all products with pagination
 */
export const getProducts = async (page = 1, limit = 10, search = "") => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) params.append("search", search);
    return cachedRequest(`products:list:${params.toString()}`, async () => {
        const res = await api.get(`/api/products?${params}`);
        const data = unwrapApiData(res.data);
        const products = asArray(data).map(normalizeProduct);

        if (Array.isArray(data)) return products;

        return {
            ...data,
            products,
            totalItems: data?.totalItems ?? data?.totalElements ?? products.length,
            totalPages: data?.totalPages ?? 1,
        };
    }, { ttl: 90_000, staleTtl: 10 * 60_000 });
};

/**
 * Get all products (legacy, no pagination)
 */
export const getAllProducts = async () => {
    return cachedRequest(PRODUCTS_ALL_CACHE_KEY, async () => {
        const res = await api.get("/api/products");
        return asArray(res.data).map(normalizeProduct);
    }, { ttl: 2 * 60_000, staleTtl: 20 * 60_000 });
};

/**
 * Get single product
 */
export const getProductById = async (id) => {
    return cachedRequest(`products:detail:${id}`, async () => {
        const res = await api.get(`/api/products/${id}`);
        return normalizeProduct(unwrapApiData(res.data));
    }, { ttl: 2 * 60_000, staleTtl: 15 * 60_000 });
};

/**
 * Create product
 */
export const createProduct = async (payload) => {
    const res = await api.post("/api/products", toProductRequest(payload));
    invalidateCache("products:");
    invalidateCache("dashboard:");
    return normalizeProduct(unwrapApiData(res.data));
};

/**
 * Update product
 */
export const updateProduct = async (id, payload) => {
    const res = await api.put(`/api/products/${id}`, toProductRequest(payload));
    invalidateCache("products:");
    invalidateCache("dashboard:");
    return normalizeProduct(unwrapApiData(res.data));
};

/**
 * Delete product (ADMIN only)
 */
export const deleteProduct = async (id) => {
    const res = await api.delete(`/api/products/${id}`);
    invalidateCache("products:");
    invalidateCache("dashboard:");
    return unwrapApiData(res.data);
};

/**
 * Update stock
 */
export const updateStock = async (id, quantity) => {
    const res = await api.patch(`/api/products/${id}/stock`, {
        quantity,
    });
    invalidateCache("products:");
    invalidateCache("inventory-logs:");
    invalidateCache("dashboard:");
    return normalizeProduct(unwrapApiData(res.data));
};

export const mergeProductIntoCache = (product, fallbackRows = []) => {
    mutateCache(PRODUCTS_ALL_CACHE_KEY, (current = []) => {
        const rows = Array.isArray(current) && current.length ? current : fallbackRows;
        const id = product.id ?? product.productId ?? product.product_id;
        const exists = rows.some((row) => (row.id ?? row.productId ?? row.product_id) === id);
        return exists
            ? rows.map((row) => ((row.id ?? row.productId ?? row.product_id) === id ? { ...row, ...product } : row))
            : [product, ...rows];
    });
};

/**
 * Low stock products
 */
export const getLowStockProducts = async () => {
    return cachedRequest("products:low-stock", async () => {
        const res = await api.get("/api/products/low-stock");
        return asArray(res.data).map(normalizeProduct);
    });
};

/**
 * Assign a supplier to a product (ADMIN, MANAGER only)
 */
export const assignSupplierToProduct = async (productId, payload) => {
    const res = await api.post(`/api/products/${productId}/suppliers`, payload);
    invalidateCache("products:");
    invalidateCache("suppliers:");
    return unwrapApiData(res.data);
};

/**
 * Remove a supplier from a product (ADMIN, MANAGER only)
 */
export const removeSupplierFromProduct = async (productId, supplierId) => {
    const res = await api.delete(`/api/products/${productId}/suppliers/${supplierId}`);
    invalidateCache("products:");
    invalidateCache("suppliers:");
    return unwrapApiData(res.data);
};
