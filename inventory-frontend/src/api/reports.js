import { api } from "./client";
import { normalizeInventoryLog, normalizeProduct, normalizeSale, unwrapApiData } from "./normalizers";
import { cachedRequest } from "./requestCache";

const REPORT_ENDPOINTS = {
    "sales-summary": "/api/reports/sales-summary",
    "inventory-movement": "/api/reports/inventory-movement",
    "low-stock": "/api/reports/low-stock",
    "category-performance": "/api/reports/category-performance",
    "supplier-performance": "/api/reports/supplier-performance",
};

export const reportLabels = {
    "sales-summary": "Sales Summary",
    "inventory-movement": "Inventory Movement",
    "low-stock": "Low Stock",
    "category-performance": "Category Performance",
    "supplier-performance": "Supplier Performance",
};

const cleanParams = (filters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, value);
        }
    });

    return params;
};

const normalizeReport = (reportId, payload = {}) => {
    if (reportId === "sales-summary") {
        return {
            ...payload,
            sales: (payload.sales || []).map(normalizeSale),
            chartRows: payload.salesTrend || [],
            tableRows: (payload.sales || []).map(normalizeSale),
        };
    }

    if (reportId === "inventory-movement") {
        return {
            ...payload,
            logs: (payload.logs || []).map(normalizeInventoryLog),
            chartRows: payload.movementTrend || payload.logs || [],
            tableRows: (payload.logs || []).map(normalizeInventoryLog),
        };
    }

    if (reportId === "low-stock") {
        return {
            ...payload,
            lowStockProducts: (payload.lowStockProducts || []).map(normalizeProduct),
            chartRows: payload.lowStockProducts || [],
            tableRows: (payload.lowStockProducts || []).map(normalizeProduct),
        };
    }

    if (reportId === "category-performance") {
        return {
            ...payload,
            chartRows: payload.categoryRevenue || [],
            tableRows: payload.categoryRevenue || [],
        };
    }

    if (reportId === "supplier-performance") {
        return {
            ...payload,
            chartRows: payload.supplierContributions || [],
            tableRows: payload.supplierContributions || [],
        };
    }

    return payload;
};

export const getReport = async (reportId, filters = {}) => {
    const endpoint = REPORT_ENDPOINTS[reportId];
    if (!endpoint) throw new Error(`Unknown report: ${reportId}`);

    const params = cleanParams(filters);
    const query = params.toString();

    return cachedRequest(`reports:${reportId}:${query}`, async () => {
        const res = await api.get(`${endpoint}${query ? `?${query}` : ""}`);
        return normalizeReport(reportId, unwrapApiData(res.data));
    });
};
