"use client";

import { useQuery } from "@tanstack/react-query";
import { Layers, CheckCircle2, CircleOff } from "lucide-react";

import {
  departmentsService,
  DEPARTMENTS_LIST_KEY,
} from "@/api/departments.api";
import { ConsoleStatsCards } from "./_components/console-stats-cards";
import { CreateDepartmentCard } from "./_components/create-department-card";
import { DepartmentsCard } from "./_components/departments-card";

export function DepartmentsConsole() {
  const { data, isPending } = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, "stats"],
    queryFn: () => departmentsService.listDepartments({ limit: 100 }),
  });

  const departments = data?.data ?? [];
  const total = data?.meta?.total ?? departments.length;
  const active = departments.filter((d) => d.isActive).length;
  const inactive = departments.filter((d) => !d.isActive).length;

  const stats = [
    { icon: Layers, label: "Total departments", value: total },
    { icon: CheckCircle2, label: "Active", value: active },
    { icon: CircleOff, label: "Inactive", value: inactive },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Academic faculties, departments, and course allocations.
          </p>
        </div>
      </section>

      <ConsoleStatsCards stats={stats} isPending={isPending} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CreateDepartmentCard />
        <DepartmentsCard />
      </div>
    </div>
  );
}
