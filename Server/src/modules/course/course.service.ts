import mongoose from "mongoose";
import Course from "./course.model";
import Department from "../department/department.model";
import Enrollment from "../enrollment/enrollment.model";
import Attendance from "../attendance/attendance.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateCourseBody,
  UpdateCourseBody,
  ListCoursesQuery,
} from "./course.validation";

// ─── Lean document shapes ─────────────────────────────────────────────────────

interface DepartmentRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
}

interface PopulatedCourse {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  departmentId: DepartmentRef;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe course payload — department details resolved via populate. */
function toResponse(doc: PopulatedCourse) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    code: doc.code,
    description: doc.description,
    department: {
      id: doc.departmentId._id.toString(),
      name: doc.departmentId.name,
      code: doc.departmentId.code,
    },
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertActiveDepartment(departmentId: string): Promise<void> {
  const department = await Department.findById(departmentId).select("isActive");

  if (!department) {
    throw new ApiError(400, "DEPARTMENT_NOT_FOUND", "Department not found");
  }
  if (!department.isActive) {
    throw new ApiError(400, "DEPARTMENT_INACTIVE", "Department is not active");
  }
}

async function fetchPopulated(id: string | mongoose.Types.ObjectId) {
  const doc = await Course.findById(id)
    .populate("departmentId", "name code")
    .lean();

  if (!doc) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  return toResponse(doc as unknown as PopulatedCourse);
}

// ─── createCourse ─────────────────────────────────────────────────────────────

export async function createCourse(input: CreateCourseBody) {
  // A course must belong to an existing, active department.
  await assertActiveDepartment(input.departmentId);

  const taken = await Course.exists({ code: input.code });
  if (taken) {
    throw new ApiError(
      409,
      "CODE_IN_USE",
      "A course with this code already exists"
    );
  }

  const doc = await Course.create({
    name: input.name,
    code: input.code,
    description: input.description,
    departmentId: input.departmentId,
    isActive: true,
  });

  return fetchPopulated(doc._id as mongoose.Types.ObjectId);
}

// ─── listCourses ──────────────────────────────────────────────────────────────

export async function listCourses(query: ListCoursesQuery) {
  const { page, limit, search, departmentId, isActive } = query;

  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (departmentId) filter.departmentId = departmentId;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { code: { $regex: safe, $options: "i" } },
    ];
  }

  const [total, docs] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .populate("departmentId", "name code")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as PopulatedCourse[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── getCourseById ────────────────────────────────────────────────────────────

export async function getCourseById(id: string) {
  return fetchPopulated(id);
}

// ─── updateCourse ─────────────────────────────────────────────────────────────

export async function updateCourse(id: string, input: UpdateCourseBody) {
  if (input.departmentId) {
    await assertActiveDepartment(input.departmentId);
  }

  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) set[key] = value;
  }

  const doc = await Course.findByIdAndUpdate(
    id,
    { $set: set },
    { new: true, runValidators: true }
  )
    .populate("departmentId", "name code")
    .lean();

  if (!doc) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  return toResponse(doc as unknown as PopulatedCourse);
}

// ─── deleteCourse ─────────────────────────────────────────────────────────────

export async function deleteCourse(id: string): Promise<void> {
  // A course may only be physically removed when nothing references it.
  // Otherwise the caller should deactivate it, which preserves history.
  const [enrollmentCount, attendanceCount] = await Promise.all([
    Enrollment.countDocuments({ courseId: id }),
    Attendance.countDocuments({ courseId: id }),
  ]);

  if (enrollmentCount > 0 || attendanceCount > 0) {
    throw new ApiError(
      409,
      "COURSE_IN_USE",
      `Course is referenced by ${enrollmentCount} enrollment(s) and ${attendanceCount} attendance record(s). Deactivate it instead.`
    );
  }

  const deleted = await Course.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }
}
