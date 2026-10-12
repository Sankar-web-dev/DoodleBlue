"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  PieChart,
  UserCog,
} from "lucide-react";

import {
  analyticsService,
  ANALYTICS_SUMMARY_KEY,
  AnalyticsSummary,
} from "@/services/analytics.service";
import { Badge } from "@/components/ui/badge";
import { DonutChart } from "@/components/ui/donut-chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// ─── resource card ────────────────────────────────────────────────────────────

function ResourceCard({
  icon: Icon,
  label,
  gradient,
  counts,
  breakdown,
  isPending,
}: {
  icon: typeof Building2;
  label: string;
  gradient: string;
  counts?: { total: number; active: number };
  breakdown?: string;
  isPending: boolean;
}) {
  return (
    <Card className="glass-card rounded-3xl">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md ${gradient}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">
            {isPending ? "–" : counts?.total ?? 0}
          </p>
          <p className="mt-1 text-xs font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {isPending
              ? "Loading…"
              : breakdown ??
                `${counts?.active ?? 0} active · ${
                  (counts?.total ?? 0) - (counts?.active ?? 0)
                } inactive`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── recent enrollments feed ──────────────────────────────────────────────────

const STATUS_VARIANTS: Record<string, "success" | "secondary" | "warning"> = {
  ACTIVE: "success",
  COMPLETED: "secondary",
  WITHDRAWN: "warning",
};

function RecentEnrollmentsCard({
  summary,
  isPending,
  isError,
}: {
  summary?: AnalyticsSummary;
  isPending: boolean;
  isError: boolean;
}) {
  const recent = summary?.recentEnrollments ?? [];

  return (
    <Card className="glass-card rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent enrollments
        </CardTitle>
        <CardDescription>The 5 latest student–course mappings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))
        ) : isError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Couldn&apos;t load recent enrollments.
          </p>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
            <ClipboardList className="h-7 w-7 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              No enrollments yet — map students to courses from the Students
              section.
            </p>
          </div>
        ) : (
          recent.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {e.student.fullName ?? "Student"} →{" "}
                  {e.course.name ?? "Course"}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {e.student.studentNumber ?? ""} · {e.course.code ?? ""} ·{" "}
                  {new Date(e.enrolledAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={STATUS_VARIANTS[e.status] ?? "secondary"}>
                {e.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── charts row ───────────────────────────────────────────────────────────────

const CHART_COLORS = {
  active: "#10b981",
  completed: "#0ea5e9",
  withdrawn: "#f59e0b",
  students: "#6366f1",
  departments: "#10b981",
  courses: "#06b6d4",
  enrollments: "#f59e0b",
};

function ChartCard({
  title,
  description,
  isPending,
  isError,
  children,
}: {
  title: string;
  description: string;
  isPending: boolean;
  isError: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass-card rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-[220px] items-center justify-center">
        {isPending ? (
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
        ) : isError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Couldn&apos;t load chart data.
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

// ─── main console ─────────────────────────────────────────────────────────────

export function AnalyticsConsole({ isSuper }: { isSuper: boolean }) {
  const { data: summary, isPending, isError } = useQuery({
    queryKey: ANALYTICS_SUMMARY_KEY,
    queryFn: analyticsService.getSummary,
  });

  const cards = [
    {
      icon: GraduationCap,
      label: "Students",
      gradient: "from-sky-600 to-indigo-600 shadow-indigo-500/25",
      counts: summary?.students,
    },
    {
      icon: Building2,
      label: "Departments",
      gradient: "from-emerald-600 to-teal-600 shadow-emerald-500/25",
      counts: summary?.departments,
    },
    {
      icon: BookOpen,
      label: "Courses",
      gradient: "from-cyan-600 to-blue-600 shadow-cyan-500/25",
      counts: summary?.courses,
    },
    {
      icon: ClipboardList,
      label: "Enrollments",
      gradient: "from-amber-500 to-orange-600 shadow-amber-500/25",
      counts: summary?.enrollments,
      breakdown: summary
        ? `${summary.enrollments.active} active · ${summary.enrollments.completed} completed · ${summary.enrollments.withdrawn} withdrawn`
        : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Overview</span>
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          Institution-wide analytics at a glance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isSuper && (
          <ResourceCard
            icon={UserCog}
            label="Admins"
            gradient="from-indigo-600 to-violet-600 shadow-indigo-500/25"
            counts={summary?.admins}
            isPending={isPending}
          />
        )}
        {cards.map((card) => (
          <ResourceCard key={card.label} {...card} isPending={isPending} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Enrollment status"
          description="How student–course mappings are distributed."
          isPending={isPending}
          isError={isError}
        >
          <DonutChart
            centerLabel="enrollments"
            slices={[
              {
                label: "Active",
                value: summary?.enrollments.active ?? 0,
                color: CHART_COLORS.active,
              },
              {
                label: "Completed",
                value: summary?.enrollments.completed ?? 0,
                color: CHART_COLORS.completed,
              },
              {
                label: "Withdrawn",
                value: summary?.enrollments.withdrawn ?? 0,
                color: CHART_COLORS.withdrawn,
              },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Records split"
          description="Share of all records by resource."
          isPending={isPending}
          isError={isError}
        >
          <DonutChart
            centerLabel="records"
            slices={[
              {
                label: "Students",
                value: summary?.students.total ?? 0,
                color: CHART_COLORS.students,
              },
              {
                label: "Departments",
                value: summary?.departments.total ?? 0,
                color: CHART_COLORS.departments,
              },
              {
                label: "Courses",
                value: summary?.courses.total ?? 0,
                color: CHART_COLORS.courses,
              },
              {
                label: "Enrollments",
                value: summary?.enrollments.total ?? 0,
                color: CHART_COLORS.enrollments,
              },
            ]}
          />
        </ChartCard>
      </div>

      <RecentEnrollmentsCard
        summary={summary}
        isPending={isPending}
        isError={isError}
      />
    </div>
  );
}
