import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import User, { IUser } from "../auth/user.model";
import { authenticate, authorize } from "../auth/auth.middleware";

// SUPER_ADMIN only — provisions and lists user accounts (e.g. ADMINs).
// Student accounts are created via /api/v1/students (ADMIN role).
const router = Router();

const BCRYPT_ROUNDS = 12;

const createAdminSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase()),
    temporaryPassword: z.string().min(10).max(128),
  })
  .strict();

const listUsersQuerySchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "STUDENT"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function safeUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// POST /api/v1/users — create an ADMIN account
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    const parsed = createAdminSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
          })),
        },
      });
      return;
    }

    const { name, email, temporaryPassword } = parsed.data;

    const emailTaken = await User.exists({ email });
    if (emailTaken) {
      res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_IN_USE",
          message: "A user with this email already exists",
        },
      });
      return;
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS),
      role: "ADMIN",
      mustChangePassword: false,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: { user: safeUser(user) },
    });
  }
);

// GET /api/v1/users — list accounts (filterable by role/search)
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    const parsed = listUsersQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join(".") || "query",
            message: issue.message,
          })),
        },
      });
      return;
    }

    const { role, search, page, limit } = parsed.data;

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
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
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: { users: docs.map(safeUser) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

export default router;
