import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as AnalyticsController from "./analytics.controller";

// Institution-level analytics — both admin roles may view them.
const router = Router();

router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN"));

router.get("/summary", AnalyticsController.getSummary);

export default router;
