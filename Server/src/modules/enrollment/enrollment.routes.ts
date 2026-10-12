import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as EnrollmentController from "./enrollment.controller";

// Enrollment is student management — ADMIN only, like the student routes.
const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.post("/", EnrollmentController.enrollStudent);
router.get("/", EnrollmentController.listEnrollments);
router.get("/:id", EnrollmentController.getEnrollment);
router.patch("/:id", EnrollmentController.updateEnrollment);
router.delete("/:id", EnrollmentController.deleteEnrollment);

export default router;
