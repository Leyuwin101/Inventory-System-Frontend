import { api } from "./client";
import { asArray, normalizeInventoryLog, unwrapApiData } from "./normalizers";
import { cachedRequest, invalidateCache } from "./requestCache";

export const getInventoryLogs = async ({
    page = 1,
    limit = 10,
    startDate = "",
    endDate = "",
    product = "",
    productId = "",
    type = "",
    sortBy = "createdAt",
    sortDirection = "desc",
} = {}) => {
    const params = new URLSearchParams({
        page: Math.max(0, page - 1).toString(),
        limit: limit.toString(),
        sortBy,
        sortDirection,
    });

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (product) params.append("product", product);
    if (productId) params.append("productID", productId);
    if (type) params.append("type", type);

    return cachedRequest(`inventory-logs:list:${params.toString()}`, async () => {
        const res = await api.get(`/api/inventory-logs?${params}`);
        const data = unwrapApiData(res.data);
        const logs = asArray(data).map(normalizeInventoryLog);

        if (Array.isArray(data)) return logs;

        return {
            ...data,
            logs,
            totalItems: data?.totalItems ?? data?.totalElements ?? logs.length,
            totalPages: data?.totalPages ?? 1,
            page: (data?.page ?? 0) + 1,
            limit: data?.limit ?? limit,
        };
    }, { ttl: 45_000, staleTtl: 5 * 60_000 });
};

const createInventoryLog = async (path, payload) => {
    const res = await api.post(path, {
        productId: payload.productId,
        quantity: payload.quantity,
        reason: payload.reason,
    });

    invalidateCache("inventory-logs:");
    invalidateCache("products:");
    invalidateCache("dashboard:");

    return normalizeInventoryLog(unwrapApiData(res.data));
};

export const createStockInLog = (payload) => createInventoryLog("/api/inventory-logs/stock-in", payload);

export const createStockOutLog = (payload) => createInventoryLog("/api/inventory-logs/stock-out", payload);

export const createStockAdjustmentLog = (payload) => createInventoryLog("/api/inventory-logs/adjust", payload);
