import { api, PaginationMeta } from "@/lib/api";

export interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListDepartmentsParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const departmentsService = {
  // SUPER_ADMIN + ADMIN — lists departments (e.g. for the student picker).
  listDepartments: (params: ListDepartmentsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.isActive !== undefined) {
      qs.set("isActive", String(params.isActive));
    }
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Department[], PaginationMeta>(
      `/api/v1/departments${query ? `?${query}` : ""}`
    );
  },
};

export const DEPARTMENTS_LIST_KEY = ["departments", "list"] as const;
