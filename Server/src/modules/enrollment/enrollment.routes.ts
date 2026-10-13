import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as EnrollmentController from "./enrollment.controller";

// Enrollment is student management — ADMIN and SUPER_ADMIN.
const router = Router();

router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.post("/", EnrollmentController.enrollStudent);
router.get("/", EnrollmentController.listEnrollments);
router.get("/:id", EnrollmentController.getEnrollment);
router.patch("/:id", EnrollmentController.updateEnrollment);
router.delete("/:id", EnrollmentController.deleteEnrollment);

export default router;
