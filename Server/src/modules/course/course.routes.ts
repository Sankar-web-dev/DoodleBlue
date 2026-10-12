import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as CourseController from "./course.controller";

// Courses are institution-level config — both admin roles may manage them.
const router = Router();

router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN"));

router.post("/", CourseController.createCourse);
router.get("/", CourseController.listCourses);
router.get("/:id", CourseController.getCourse);
router.patch("/:id", CourseController.updateCourse);
router.delete("/:id", CourseController.deleteCourse);

export default router;
