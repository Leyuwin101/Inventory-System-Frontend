import { api } from "./client";
import { asArray, normalizeInventoryLog, unwrapApiData } from "./normalizers";
import { cachedRequest } from "./requestCache";

export const getInventoryLogs = async ({
    page = 1,
    limit = 10,
    startDate = "",
    endDate = "",
    product = "",
    type = "",
} = {}) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (product) params.append("product", product);
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
        };
    });
};
