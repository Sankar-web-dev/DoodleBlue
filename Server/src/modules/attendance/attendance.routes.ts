import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as AttendanceController from "./attendance.controller";

// Attendance is recorded/managed by admins only; students read their own
// records via /api/v1/me/attendance.
const router = Router();

router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN"));

router.post("/", AttendanceController.recordAttendance);
router.get("/", AttendanceController.listAttendance);
router.get("/:id", AttendanceController.getAttendance);
router.patch("/:id", AttendanceController.updateAttendance);
router.delete("/:id", AttendanceController.deleteAttendance);

export default router;
