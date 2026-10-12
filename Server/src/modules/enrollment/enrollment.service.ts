import mongoose from "mongoose";
import Enrollment from "./enrollment.model";
import Student from "../student/student.model";
import Course from "../course/course.model";
import Attendance from "../attendance/attendance.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateEnrollmentBody,
  UpdateEnrollmentBody,
  ListEnrollmentsQuery,
} from "./enrollment.validation";

// ─── Lean document shapes ─────────────────────────────────────────────────────

interface StudentRef {
  _id: mongoose.Types.ObjectId;
  studentNumber: string;
  fullName: string;
  status: string;
}

interface CourseRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  isActive: boolean;
}

interface PopulatedEnrollment {
  _id: mongoose.Types.ObjectId;
  studentId: StudentRef;
  courseId: CourseRef;
  enrolledAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe enrollment payload — student/course resolved via populate. */
function toResponse(doc: PopulatedEnrollment) {
  return {
    id: doc._id.toString(),
    student: {
      id: doc.studentId._id.toString(),
      studentNumber: doc.studentId.studentNumber,
      fullName: doc.studentId.fullName,
      status: doc.studentId.status,
    },
    course: {
      id: doc.courseId._id.toString(),
      name: doc.courseId.name,
      code: doc.courseId.code,
      isActive: doc.courseId.isActive,
    },
    enrolledAt: doc.enrolledAt,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function fetchPopulated(id: string | mongoose.Types.ObjectId) {
  const doc = await Enrollment.findById(id)
    .populate("studentId", "studentNumber fullName status")
    .populate("courseId", "name code isActive")
    .lean();

  if (!doc) {
    throw new ApiError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
  }

  return toResponse(doc as unknown as PopulatedEnrollment);
}

// ─── createEnrollment ─────────────────────────────────────────────────────────

export async function createEnrollment(input: CreateEnrollmentBody) {
  // Both references must point at real, active records.
  const [student, course] = await Promise.all([
    Student.findById(input.studentId).select("status").lean(),
    Course.findById(input.courseId).select("isActive").lean(),
  ]);

  if (!student) {
    throw new ApiError(404, "STUDENT_NOT_FOUND", "Student not found");
  }
  if (student.status !== "ACTIVE") {
    throw new ApiError(
      400,
      "STUDENT_INACTIVE",
      "Only active students can be enrolled"
    );
  }

  if (!course) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }
  if (!course.isActive) {
    throw new ApiError(400, "COURSE_INACTIVE", "Course is not active");
  }

  // The compound unique index on (studentId, courseId) means a student can
  // never hold two enrollment records for the same course — even a WITHDRAWN
  // one. Surface that as a clear 409 before the insert.
  const existing = await Enrollment.exists({
    studentId: input.studentId,
    courseId: input.courseId,
  });
  if (existing) {
    throw new ApiError(
      409,
      "ENROLLMENT_EXISTS",
      "An enrollment already exists for this student and course"
    );
  }

  const doc = await Enrollment.create({
    studentId: input.studentId,
    courseId: input.courseId,
    enrolledAt: new Date(),
    status: "ACTIVE",
  });

  return fetchPopulated(doc._id as mongoose.Types.ObjectId);
}

// ─── listEnrollments ──────────────────────────────────────────────────────────

export async function listEnrollments(query: ListEnrollmentsQuery) {
  const { page, limit, studentId, courseId, status } = query;

  const filter: Record<string, unknown> = {};
  if (studentId) filter.studentId = studentId;
  if (courseId) filter.courseId = courseId;
  if (status) filter.status = status;

  const [total, docs] = await Promise.all([
    Enrollment.countDocuments(filter),
    Enrollment.find(filter)
      .populate("studentId", "studentNumber fullName status")
      .populate("courseId", "name code isActive")
      .sort({ enrolledAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as PopulatedEnrollment[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── getEnrollmentById ────────────────────────────────────────────────────────

export async function getEnrollmentById(id: string) {
  return fetchPopulated(id);
}

// ─── updateEnrollment ─────────────────────────────────────────────────────────

export async function updateEnrollment(
  id: string,
  input: UpdateEnrollmentBody
) {
  const doc = await Enrollment.findByIdAndUpdate(
    id,
    { $set: { status: input.status } },
    { new: true, runValidators: true }
  )
    .populate("studentId", "studentNumber fullName status")
    .populate("courseId", "name code isActive")
    .lean();

  if (!doc) {
    throw new ApiError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
  }

  return toResponse(doc as unknown as PopulatedEnrollment);
}

// ─── deleteEnrollment ─────────────────────────────────────────────────────────

export async function deleteEnrollment(id: string): Promise<void> {
  const enrollment = await Enrollment.findById(id)
    .select("studentId courseId")
    .lean();

  if (!enrollment) {
    throw new ApiError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
  }

  // Attendance history is keyed by (student, course) — deleting an enrollment
  // that already has attendance records would orphan them. Use WITHDRAWN
  // status instead in that case.
  const attendanceCount = await Attendance.countDocuments({
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
  });

  if (attendanceCount > 0) {
    throw new ApiError(
      409,
      "ENROLLMENT_IN_USE",
      "This enrollment has attendance records. Set its status to WITHDRAWN instead."
    );
  }

  await Enrollment.findByIdAndDelete(id);
}
