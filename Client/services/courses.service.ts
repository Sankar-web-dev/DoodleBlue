import { api, PaginationMeta } from "@/lib/api";

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  department: {
    id: string;
    name?: string;
    code?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  name: string;
  code: string;
  description?: string;
  departmentId: string;
}

export interface UpdateCourseInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

interface ListCoursesParams {
  search?: string;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const coursesService = {
  // SUPER_ADMIN + ADMIN — creates a course under a department. `code` is
  // normalised to uppercase by the API and must be unique (409 CODE_IN_USE).
  createCourse: (input: CreateCourseInput) =>
    api.post<{ course: Course }>("/api/v1/courses", input),

  // SUPER_ADMIN + ADMIN — rename, edit description and/or activate/deactivate.
  // `code` and `departmentId` are immutable server-side.
  updateCourse: (id: string, input: UpdateCourseInput) =>
    api.patch<{ course: Course }>(`/api/v1/courses/${id}`, input),

  // SUPER_ADMIN + ADMIN — hard delete; fails with 409 COURSE_IN_USE
  // while enrollments still reference the course.
  deleteCourse: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/courses/${id}`),

  // SUPER_ADMIN + ADMIN — lists courses with pagination and filters.
  listCourses: (params: ListCoursesParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.departmentId) qs.set("departmentId", params.departmentId);
    if (params.isActive !== undefined) {
      qs.set("isActive", String(params.isActive));
    }
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Course[], PaginationMeta>(
      `/api/v1/courses${query ? `?${query}` : ""}`
    );
  },
};

export const COURSES_LIST_KEY = ["courses", "list"] as const;
