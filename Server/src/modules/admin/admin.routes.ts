import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as AdminController from "./admin.controller";

// Admin-account management — SUPER_ADMIN only.
const router = Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

router.post("/", AdminController.createAdmin);
router.get("/", AdminController.listAdmins);
router.get("/:id", AdminController.getAdmin);
router.patch("/:id", AdminController.updateAdmin);

export default router;
