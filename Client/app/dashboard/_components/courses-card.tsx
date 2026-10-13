"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Layers,
  Search,
  Pencil,
  Trash2,
  Power,
  Loader2,
  ChevronDown,
} from "lucide-react";

import {
  coursesService,
  COURSES_LIST_KEY,
  Course,
} from "@/api/courses.api";
import { ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useDebouncedValue } from "./use-debounced-value";
import { useDepartments } from "./use-departments";
import {
  EditCourseDialog,
  DeleteCourseDialog,
} from "./course-dialogs";

function CourseRow({
  course,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  course: Course;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/25">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{course.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {course.code}
            {course.department.name
              ? ` · ${course.department.name}`
              : ""}
          </p>
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-1.5">
        {course.department.code && (
          <Badge variant="outline" className="hidden sm:inline-flex font-mono">
            {course.department.code}
          </Badge>
        )}
        <Badge variant={course.isActive ? "success" : "secondary"}>
          {course.isActive ? "Active" : "Inactive"}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          disabled={busy}
          aria-label={`Edit ${course.name}`}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggle}
          disabled={busy}
          aria-label={
            course.isActive
              ? `Deactivate ${course.name}`
              : `Activate ${course.name}`
          }
          title={course.isActive ? "Deactivate" : "Activate"}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={busy}
          aria-label={`Delete ${course.name}`}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CoursesCard() {
  const queryClient = useQueryClient();
  const { departments } = useDepartments();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: [
      ...COURSES_LIST_KEY,
      "console",
      debouncedSearch,
      departmentFilter,
    ],
    queryFn: () =>
      coursesService.listCourses({
        search: debouncedSearch || undefined,
        departmentId: departmentFilter || undefined,
        limit: 50,
      }),
  });
  const courses = data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: (c: Course) =>
      coursesService.updateCourse(c.id, { isActive: !c.isActive }),
    onSuccess: (_result, c) => {
      queryClient.invalidateQueries({ queryKey: COURSES_LIST_KEY });
      toast.success(c.isActive ? "Course deactivated" : "Course activated");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleDeactivate = (c: Course) => {
    setDeleting(null);
    updateMutation.mutate(c);
  };

  return (
    <>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Courses
          </CardTitle>
          <CardDescription>
            {isPending
              ? "Loading courses…"
              : `${data?.meta?.total ?? courses.length} course${
                  (data?.meta?.total ?? courses.length) === 1 ? "" : "s"
                } on record`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or code…"
                className="h-10 rounded-xl pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 appearance-none rounded-xl border pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter by department"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {isPending ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))
          ) : isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Couldn&apos;t load courses. Check the server and refresh.
            </p>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">
                {debouncedSearch || departmentFilter
                  ? "No matches"
                  : "No courses yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {debouncedSearch || departmentFilter
                  ? "Try a different search or filter."
                  : "Create the first one with the form on the left."}
              </p>
            </div>
          ) : (
            courses.map((c) => (
              <CourseRow
                key={c.id}
                course={c}
                busy={
                  updateMutation.isPending &&
                  updateMutation.variables?.id === c.id
                }
                onEdit={() => setEditing(c)}
                onToggle={() => updateMutation.mutate(c)}
                onDelete={() => setDeleting(c)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <EditCourseDialog course={editing} onClose={() => setEditing(null)} />
      <DeleteCourseDialog
        course={deleting}
        onClose={() => setDeleting(null)}
        onDeactivate={handleDeactivate}
      />
    </>
  );
}
