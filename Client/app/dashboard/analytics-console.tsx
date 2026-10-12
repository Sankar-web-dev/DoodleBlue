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
} from "@/api/analytics.api";
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
  counts,
  breakdown,
  isPending,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  counts?: { total: number; active: number };
  breakdown?: string;
  isPending: boolean;
}) {
  const value = isPending ? "–" : (counts?.total ?? 0).toLocaleString();
  const subtitle = isPending
    ? "Loading…"
    : breakdown ??
      `${(counts?.active ?? 0).toLocaleString()} active · ${(
        (counts?.total ?? 0) - (counts?.active ?? 0)
      ).toLocaleString()} inactive`;

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className="rounded-lg border border-border/60 bg-muted p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
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
    <Card className="border-border/70 bg-card/95 shadow-sm">
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
  active: "oklch(0.5553 0.1455 48.9975)", // solar primary
  completed: "oklch(0.6806 0.1423 75.8340)", // dusk amber
  withdrawn: "oklch(0.4437 0.1613 26.8994)", // destructive
  students: "oklch(0.5553 0.1455 48.9975)", // solar primary
  departments: "oklch(0.6806 0.1423 75.8340)", // dusk amber
  courses: "oklch(0.5538 0.1207 66.4416)", // accent
  enrollments: "oklch(0.8276 0.0752 74.4400)", // secondary
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
    <Card className="border-border/70 bg-card/95 shadow-sm">
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
      counts: summary?.students,
    },
    {
      icon: Building2,
      label: "Departments",
      counts: summary?.departments,
    },
    {
      icon: BookOpen,
      label: "Courses",
      counts: summary?.courses,
    },
    {
      icon: ClipboardList,
      label: "Enrollments",
      counts: summary?.enrollments,
      breakdown: summary
        ? `${summary.enrollments.active} active · ${summary.enrollments.completed} completed · ${summary.enrollments.withdrawn} withdrawn`
        : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Institution-wide academic metrics and activity overview.
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="w-full">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <ResourceCard key={card.label} {...card} isPending={isPending} />
          ))}
          {isSuper && (
            <ResourceCard
              icon={UserCog}
              label="Admins"
              counts={summary?.admins}
              isPending={isPending}
            />
          )}
        </div>
      </section>

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
