import { api } from "./client";
import { asArray, normalizeSupplier, unwrapApiData } from "./normalizers";
import { cachedRequest, invalidateCache } from "./requestCache";

/**
 * Get all suppliers
 */
export const getAllSuppliers = async () => {
    return cachedRequest("suppliers:all", async () => {
        const res = await api.get("/api/suppliers");
        return asArray(res.data).map(normalizeSupplier);
    }, { ttl: 5 * 60_000, staleTtl: 30 * 60_000 });
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id) => {
    return cachedRequest(`suppliers:detail:${id}`, async () => {
        const res = await api.get(`/api/suppliers/${id}`);
        return normalizeSupplier(unwrapApiData(res.data));
    }, { ttl: 5 * 60_000, staleTtl: 30 * 60_000 });
};

/**
 * Create a new supplier
 */
export const createSupplier = async (payload) => {
    const res = await api.post("/api/suppliers", payload);
    invalidateCache("suppliers:");
    invalidateCache("dashboard:");
    return normalizeSupplier(unwrapApiData(res.data));
};

/**
 * Update an existing supplier
 */
export const updateSupplier = async (id, payload) => {
    const res = await api.put(`/api/suppliers/${id}`, payload);
    invalidateCache("suppliers:");
    invalidateCache("products:");
    invalidateCache("dashboard:");
    return normalizeSupplier(unwrapApiData(res.data));
};

/**
 * Delete a supplier (ADMIN only)
 */
export const deleteSupplier = async (id) => {
    const res = await api.delete(`/api/suppliers/${id}`);
    invalidateCache("suppliers:");
    invalidateCache("products:");
    invalidateCache("dashboard:");
    return unwrapApiData(res.data);
};
