import { api, PaginationMeta } from "@/lib/api";

export interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  isActive?: boolean;
}

interface ListDepartmentsParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const departmentsService = {
  // SUPER_ADMIN + ADMIN — creates a department. `code` is normalised
  // to uppercase by the API and must be unique (409 CODE_IN_USE).
  createDepartment: (input: CreateDepartmentInput) =>
    api.post<{ department: Department }>("/api/v1/departments", input),

  // SUPER_ADMIN + ADMIN — rename and/or activate/deactivate.
  // `code` is immutable server-side.
  updateDepartment: (id: string, input: UpdateDepartmentInput) =>
    api.patch<{ department: Department }>(`/api/v1/departments/${id}`, input),

  // SUPER_ADMIN + ADMIN — hard delete; fails with 409 DEPARTMENT_IN_USE
  // while students or courses still reference the department.
  deleteDepartment: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/departments/${id}`),

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
