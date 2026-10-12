import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as EnrollmentController from "./enrollment.controller";

// Enrollment management — both admin roles.
const router = Router();

router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN"));

router.post("/", EnrollmentController.createEnrollment);
router.get("/", EnrollmentController.listEnrollments);
router.get("/:id", EnrollmentController.getEnrollment);
router.patch("/:id", EnrollmentController.updateEnrollment);
router.delete("/:id", EnrollmentController.deleteEnrollment);

export default router;
