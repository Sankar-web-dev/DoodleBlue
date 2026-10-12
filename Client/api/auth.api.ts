import { api } from "@/lib/api";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STUDENT";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  mustChangePassword: boolean;
  isActive: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  STUDENT: "Student",
};

export const authApi = {
  signIn: (email: string, password: string) =>
    api.post<{ user: AuthUser }>("/api/v1/auth/login", { email, password }),

  signOut: () => api.post<{ message: string }>("/api/v1/auth/logout"),

  me: () => api.get<{ user: AuthUser }>("/api/v1/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string }>("/api/v1/auth/change-password", {
      currentPassword,
      newPassword,
    }),
};

export const authService = authApi;
export const AUTH_ME_KEY = ["auth", "me"] as const;
