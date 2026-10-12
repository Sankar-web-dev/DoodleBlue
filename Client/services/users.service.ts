import { api } from "@/lib/api";
import { AuthUser, UserRole } from "./auth.service";

export interface ListedUser extends AuthUser {
  createdAt: string;
}

export interface ListUsersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateAdminInput {
  name: string;
  email: string;
  temporaryPassword: string;
}

interface ListUsersParams {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}

export const usersService = {
  // SUPER_ADMIN only — provisions a new ADMIN account.
  createAdmin: (input: CreateAdminInput) =>
    api.post<{ user: ListedUser }>("/api/v1/users", input),

  // SUPER_ADMIN only — lists user accounts, filterable by role/search.
  listUsers: (params: ListUsersParams = {}) => {
    const qs = new URLSearchParams();
    if (params.role) qs.set("role", params.role);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<{ users: ListedUser[] }, ListUsersMeta>(
      `/api/v1/users${query ? `?${query}` : ""}`
    );
  },
};

export const USERS_LIST_KEY = ["users", "list"] as const;
