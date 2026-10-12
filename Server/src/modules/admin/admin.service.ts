import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../auth/user.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateAdminBody,
  UpdateAdminBody,
  ListAdminsQuery,
} from "./admin.validation";

const BCRYPT_ROUNDS = 12;

// ─── Lean document shape ──────────────────────────────────────────────────────

interface LeanAdmin {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe admin payload — passwordHash is never selected or returned. */
function toResponse(doc: LeanAdmin) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    mustChangePassword: doc.mustChangePassword,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── createAdmin ──────────────────────────────────────────────────────────────

export async function createAdmin(input: CreateAdminBody) {
  const taken = await User.exists({ email: input.email });
  if (taken) {
    throw new ApiError(
      409,
      "EMAIL_IN_USE",
      "A user with this email already exists"
    );
  }

  const passwordHash = await bcrypt.hash(
    input.temporaryPassword,
    BCRYPT_ROUNDS
  );

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: "ADMIN",
    mustChangePassword: true,
    isActive: true,
  });

  return toResponse(user.toObject() as LeanAdmin);
}

// ─── listAdmins ───────────────────────────────────────────────────────────────

export async function listAdmins(query: ListAdminsQuery) {
  const { page, limit, search, isActive } = query;

  // This module manages ADMIN accounts only — SUPER_ADMIN and STUDENT
  // records are out of scope no matter what filters are passed.
  const filter: Record<string, unknown> = { role: "ADMIN" };
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanAdmin[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── getAdminById ─────────────────────────────────────────────────────────────

export async function getAdminById(id: string) {
  const doc = await User.findOne({ _id: id, role: "ADMIN" }).lean();
  if (!doc) {
    throw new ApiError(404, "ADMIN_NOT_FOUND", "Admin not found");
  }
  return toResponse(doc as unknown as LeanAdmin);
}

// ─── updateAdmin ──────────────────────────────────────────────────────────────

export async function updateAdmin(id: string, input: UpdateAdminBody) {
  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.isActive !== undefined) set.isActive = input.isActive;

  // Scoped to role ADMIN — a SUPER_ADMIN's own record can never be
  // deactivated through this endpoint.
  const doc = await User.findOneAndUpdate(
    { _id: id, role: "ADMIN" },
    { $set: set },
    { new: true, runValidators: true }
  ).lean();

  if (!doc) {
    throw new ApiError(404, "ADMIN_NOT_FOUND", "Admin not found");
  }

  return toResponse(doc as unknown as LeanAdmin);
}
