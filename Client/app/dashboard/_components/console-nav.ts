import {
  BookOpen,
  Building2,
  GraduationCap,
  LayoutDashboard,
  UserCog,
} from "lucide-react";

export type SectionId =
  | "overview"
  | "admins"
  | "students"
  | "departments"
  | "courses";

export type NavItem = {
  id: SectionId;
  label: string;
  icon: typeof Building2;
};

export function getNavItems(isSuper: boolean): NavItem[] {
  return isSuper
    ? [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "admins", label: "Admins", icon: UserCog },
        { id: "departments", label: "Departments", icon: Building2 },
        { id: "courses", label: "Courses", icon: BookOpen },
      ]
    : [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "students", label: "Students", icon: GraduationCap },
        { id: "departments", label: "Departments", icon: Building2 },
        { id: "courses", label: "Courses", icon: BookOpen },
      ];
}
