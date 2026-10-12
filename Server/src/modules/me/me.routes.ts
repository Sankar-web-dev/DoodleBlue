import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as MeController from "./me.controller";

// Self-service endpoints — STUDENT role only, always scoped to the linked
// student profile of the authenticated account. Nothing here trusts a
// client-supplied student id.
const router = Router();

router.use(authenticate, authorize("STUDENT"));

router.get("/profile", MeController.getMyProfile);
router.get("/enrollments", MeController.getMyEnrollments);
router.get("/attendance", MeController.getMyAttendance);

export default router;
