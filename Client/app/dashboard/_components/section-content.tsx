"use client";

import { AdminConsole } from "../admin-console";
import { StudentsConsole } from "../students-console";
import { DepartmentsConsole } from "../departments-console";
import { CoursesConsole } from "../courses-console";
import { AnalyticsConsole } from "../analytics-console";
import type { SectionId } from "./console-nav";

export function SectionContent({
  section,
  isSuper,
}: {
  section: SectionId;
  isSuper: boolean;
}) {
  switch (section) {
    case "overview":
      return <AnalyticsConsole isSuper={isSuper} />;
    case "admins":
      return <AdminConsole />;
    case "students":
      return <StudentsConsole />;
    case "departments":
      return <DepartmentsConsole />;
    default:
      return <CoursesConsole />;
  }
}
