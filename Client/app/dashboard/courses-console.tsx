"use client";

import { useQuery } from "@tanstack/react-query";
import { Layers, CheckCircle2, CircleOff } from "lucide-react";

import {
  coursesService,
  COURSES_LIST_KEY,
} from "@/api/courses.api";
import { ConsoleStatsCards } from "./_components/console-stats-cards";
import { CreateCourseCard } from "./_components/create-course-card";
import { CoursesCard } from "./_components/courses-card";

export function CoursesConsole() {
  const { data, isPending } = useQuery({
    queryKey: [...COURSES_LIST_KEY, "stats"],
    queryFn: () => coursesService.listCourses({ limit: 100 }),
  });

  const courses = data?.data ?? [];
  const total = data?.meta?.total ?? courses.length;
  const active = courses.filter((c) => c.isActive).length;
  const inactive = courses.filter((c) => !c.isActive).length;

  const stats = [
    { icon: Layers, label: "Total courses", value: total },
    { icon: CheckCircle2, label: "Active", value: active },
    { icon: CircleOff, label: "Inactive", value: inactive },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Academic curriculum, department course allocations, and course states.
          </p>
        </div>
      </section>

      <ConsoleStatsCards stats={stats} isPending={isPending} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CreateCourseCard />
        <CoursesCard />
      </div>
    </div>
  );
}
