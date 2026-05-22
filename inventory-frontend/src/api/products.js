import { api } from "./client";
import { asArray, normalizeProduct, toProductRequest, unwrapApiData } from "./normalizers";
import { cachedRequest, invalidateCache } from "./requestCache";

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
    });
};

/**
 * Get all products (legacy, no pagination)
 */
export const getAllProducts = async () => {
    return cachedRequest("products:all", async () => {
        const res = await api.get("/api/products");
        return asArray(res.data).map(normalizeProduct);
    });
};

/**
 * Get single product
 */
export const getProductById = async (id) => {
    return cachedRequest(`products:detail:${id}`, async () => {
        const res = await api.get(`/api/products/${id}`);
        return normalizeProduct(unwrapApiData(res.data));
    });
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
