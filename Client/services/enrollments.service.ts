import { api, PaginationMeta } from "@/lib/api";

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "WITHDRAWN";

export interface Enrollment {
  id: string;
  student: {
    id: string;
    fullName?: string;
    studentNumber?: string;
  };
  course: {
    id: string;
    name?: string;
    code?: string;
  };
  status: EnrollmentStatus;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentInput {
  studentId: string;
  courseId: string;
}

interface ListEnrollmentsParams {
  studentId?: string;
  courseId?: string;
  status?: EnrollmentStatus;
  page?: number;
  limit?: number;
}

export const enrollmentsService = {
  // ADMIN only — maps a student to a course. The API rejects the pairing
  // when the course sits outside the student's department
  // (409 COURSE_DEPARTMENT_MISMATCH) or the pair already exists
  // (409 ALREADY_ENROLLED).
  createEnrollment: (input: CreateEnrollmentInput) =>
    api.post<{ enrollment: Enrollment }>("/api/v1/enrollments", input),

  // ADMIN only — marks an enrollment ACTIVE / COMPLETED / WITHDRAWN.
  updateEnrollmentStatus: (id: string, status: EnrollmentStatus) =>
    api.patch<{ enrollment: Enrollment }>(`/api/v1/enrollments/${id}`, {
      status,
    }),

  // ADMIN only — removes the enrollment record entirely.
  deleteEnrollment: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/enrollments/${id}`),

  // ADMIN only — lists enrollments with pagination and filters.
  listEnrollments: (params: ListEnrollmentsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.studentId) qs.set("studentId", params.studentId);
    if (params.courseId) qs.set("courseId", params.courseId);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Enrollment[], PaginationMeta>(
      `/api/v1/enrollments${query ? `?${query}` : ""}`
    );
  },
};

export const ENROLLMENTS_LIST_KEY = ["enrollments", "list"] as const;
