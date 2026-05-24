import { api } from "./client";
import { asArray, normalizeSale, unwrapApiData } from "./normalizers";
import { cachedRequest, invalidateCache } from "./requestCache";

/**
 * Get all sales (ADMIN, MANAGER only)
 */
export const getAllSales = async () => {
    return cachedRequest("sales:all", async () => {
        const res = await api.get("/api/sales");
        return asArray(res.data).map(normalizeSale);
    }, { ttl: 45_000, staleTtl: 5 * 60_000 });
};

/**
 * Get sale by ID
 */
export const getSaleById = async (id) => {
    return cachedRequest(`sales:detail:${id}`, async () => {
        const res = await api.get(`/api/sales/${id}`);
        return normalizeSale(unwrapApiData(res.data));
    }, { ttl: 60_000, staleTtl: 5 * 60_000 });
};

/**
 * Get sales by User ID (Cashier sales history)
 */
export const getSalesByUser = async (userId) => {
    return cachedRequest(`sales:user:${userId}`, async () => {
        const res = await api.get(`/api/sales/user/${userId}`);
        return asArray(res.data).map(normalizeSale);
    }, { ttl: 45_000, staleTtl: 5 * 60_000 });
};

/**
 * Create a new sale transaction (Checkout)
 */
export const createSale = async (payload) => {
    const res = await api.post("/api/sales", payload);
    invalidateCache("sales:");
    invalidateCache("products:");
    invalidateCache("inventory-logs:");
    invalidateCache("dashboard:");
    return normalizeSale(unwrapApiData(res.data));
};

/**
 * Cancel/Refund a sale (ADMIN, MANAGER only)
 */
export const cancelSale = async (id) => {
    const res = await api.delete(`/api/sales/${id}`);
    invalidateCache("sales:");
    invalidateCache("products:");
    invalidateCache("inventory-logs:");
    invalidateCache("dashboard:");
    return unwrapApiData(res.data);
};
