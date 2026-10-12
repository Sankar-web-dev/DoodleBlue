import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const codeSchema = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .regex(/^[A-Za-z0-9-]+$/, "Code may only contain letters, numbers and hyphens")
  .transform((v) => v.toUpperCase());

// POST /api/v1/courses
export const createCourseSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    code: codeSchema,
    description: z.string().trim().max(1000).optional(),
    departmentId: objectId,
  })
  .strict();

// PATCH /api/v1/courses/:id
// `code` is treated as an immutable identifier — not updatable.
export const updateCourseSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    departmentId: objectId.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

// GET /api/v1/courses
export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  departmentId: objectId.optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

// :id route param
export const courseIdParamSchema = z.object({ id: objectId });

export type CreateCourseBody = z.infer<typeof createCourseSchema>;
export type UpdateCourseBody = z.infer<typeof updateCourseSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
