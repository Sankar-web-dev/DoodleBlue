import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as StudentController from "./student.controller";

// ADMIN only — SUPER_ADMIN and STUDENT are intentionally excluded.
const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.post("/", StudentController.createStudent);
router.get("/", StudentController.listStudents);
router.get("/:id", StudentController.getStudent);
router.patch("/:id/status", StudentController.updateStudentStatus);
router.patch("/:id", StudentController.updateStudent);

export default router;
