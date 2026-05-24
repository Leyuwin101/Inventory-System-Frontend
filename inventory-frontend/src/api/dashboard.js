import { api } from "./client";
import { unwrapApiData } from "./normalizers";
import { cachedRequest } from "./requestCache";

export const getDashboardSummary = async () => {
    return cachedRequest("dashboard:summary", async () => {
        const res = await api.get("/api/dashboard/summary");
        return unwrapApiData(res.data);
    }, { ttl: 60_000, staleTtl: 10 * 60_000 });
};
