import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as DepartmentController from "./department.controller";

// Departments are institution-level config — both admin roles may manage them.
const router = Router();

router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN"));

router.post("/", DepartmentController.createDepartment);
router.get("/", DepartmentController.listDepartments);
router.get("/:id", DepartmentController.getDepartment);
router.patch("/:id", DepartmentController.updateDepartment);
router.delete("/:id", DepartmentController.deleteDepartment);

export default router;
