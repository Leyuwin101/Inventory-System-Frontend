import { api } from "./client";
import { asArray, normalizeCategory, unwrapApiData } from "./normalizers";
import { cachedRequest, invalidateCache } from "./requestCache";

/**
 * Get all categories
 */
export const getAllCategories = async () => {
    return cachedRequest("categories:all", async () => {
        const res = await api.get("/api/categories");
        return asArray(res.data).map(normalizeCategory);
    });
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id) => {
    return cachedRequest(`categories:detail:${id}`, async () => {
        const res = await api.get(`/api/categories/${id}`);
        return normalizeCategory(unwrapApiData(res.data));
    });
};

/**
 * Create a new category
 */
export const createCategory = async (payload) => {
    const res = await api.post("/api/categories", payload);
    invalidateCache("categories:");
    invalidateCache("dashboard:");
    return normalizeCategory(unwrapApiData(res.data));
};

/**
 * Update an existing category
 */
export const updateCategory = async (id, payload) => {
    const res = await api.put(`/api/categories/${id}`, payload);
    invalidateCache("categories:");
    invalidateCache("products:");
    invalidateCache("dashboard:");
    return normalizeCategory(unwrapApiData(res.data));
};

/**
 * Delete a category (ADMIN only)
 */
export const deleteCategory = async (id) => {
    const res = await api.delete(`/api/categories/${id}`);
    invalidateCache("categories:");
    invalidateCache("products:");
    invalidateCache("dashboard:");
    return unwrapApiData(res.data);
};
