import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as StudentController from "./student.controller";

// ADMIN and SUPER_ADMIN — STUDENT is intentionally excluded.
const router = Router();

router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.post("/", StudentController.createStudent);
router.get("/", StudentController.listStudents);
router.get("/:id", StudentController.getStudent);
router.patch("/:id/status", StudentController.updateStudentStatus);
router.patch("/:id", StudentController.updateStudent);

export default router;
