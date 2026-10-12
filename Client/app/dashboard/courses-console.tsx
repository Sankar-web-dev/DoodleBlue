"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Layers,
  CheckCircle2,
  CircleOff,
  Search,
  Pencil,
  Trash2,
  Power,
  Loader2,
  Hash,
  AlertTriangle,
  Building2,
  ChevronDown,
} from "lucide-react";

import {
  coursesService,
  COURSES_LIST_KEY,
  Course,
} from "@/api/courses.api";
import {
  departmentsService,
  DEPARTMENTS_LIST_KEY,
} from "@/api/departments.api";
import { ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── helpers ──────────────────────────────────────────────────────────────────

function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useDepartments() {
  const { data, isPending } = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, "active"],
    queryFn: () =>
      departmentsService.listDepartments({ isActive: true, limit: 100 }),
  });
  return { departments: data?.data ?? [], isPending };
}

// ─── create course card ───────────────────────────────────────────────────────

function CreateCourseCard() {
  const queryClient = useQueryClient();
  const { departments, isPending: deptsPending } = useDepartments();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-select the first active department so creation works out of the box.
  useEffect(() => {
    if (!departmentId && departments.length > 0) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  const createMutation = useMutation({
    mutationFn: () =>
      coursesService.createCourse({
        name: name.trim(),
        code: code.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        departmentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_LIST_KEY });
      setName("");
      setCode("");
      setDescription("");
      setFormError(null);
      toast.success("Course created");
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiRequestError
          ? error.code === "CODE_IN_USE"
            ? "That code is already taken by another course."
            : error.code === "DEPARTMENT_INACTIVE"
              ? "That department is inactive — activate it first."
              : error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Enter a course name (min 2 characters).");
      return;
    }
    if (!/^[A-Za-z0-9-]{2,20}$/.test(code.trim())) {
      setFormError(
        "Enter a code — 2 to 20 letters, numbers or hyphens (e.g. CS101)."
      );
      return;
    }
    if (!departmentId) {
      setFormError("Pick a department.");
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Create course
        </CardTitle>
        <CardDescription>
          Courses live inside a department. The code is a short unique
          identifier and can&apos;t be changed later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-name">Course name</Label>
              <Input
                id="course-name"
                placeholder="e.g. Data Structures"
                className="h-11 rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-code">Code</Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="course-code"
                  placeholder="CS101"
                  className="h-11 rounded-xl pl-10 font-mono text-sm uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-dept">Department</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="course-dept"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-11 w-full appearance-none rounded-xl border pl-10 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={createMutation.isPending || deptsPending}
              >
                <option value="">
                  {deptsPending ? "Loading…" : "Select department"}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {!deptsPending && departments.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No active departments — create one in the Departments section
                first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-desc">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="course-desc"
              placeholder="Short description"
              className="h-11 rounded-xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Create course
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── edit dialog ──────────────────────────────────────────────────────────────

function EditCourseDialog({
  course,
  onClose,
}: {
  course: Course | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed the inputs whenever a different row is opened.
  useEffect(() => {
    setName(course?.name ?? "");
    setDescription(course?.description ?? "");
    setFormError(null);
  }, [course]);

  const updateMutation = useMutation({
    mutationFn: () =>
      coursesService.updateCourse(course!.id, {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_LIST_KEY });
      toast.success("Course updated");
      onClose();
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Enter a course name (min 2 characters).");
      return;
    }
    setFormError(null);
    updateMutation.mutate();
  };

  return (
    <Dialog open={course !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit course</DialogTitle>
          <DialogDescription>
            Code <span className="font-mono">{course?.code}</span> and
            department stay the same — only the name and description can
            change.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="edit-course-name">Course name</Label>
            <Input
              id="edit-course-name"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-course-desc">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="edit-course-desc"
              className="h-11 rounded-xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── delete dialog ────────────────────────────────────────────────────────────

function DeleteCourseDialog({
  course,
  onClose,
  onDeactivate,
}: {
  course: Course | null;
  onClose: () => void;
  onDeactivate: (course: Course) => void;
}) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [inUse, setInUse] = useState(false);

  useEffect(() => {
    setFormError(null);
    setInUse(false);
  }, [course]);

  const deleteMutation = useMutation({
    mutationFn: () => coursesService.deleteCourse(course!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_LIST_KEY });
      toast.success("Course deleted");
      onClose();
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === "COURSE_IN_USE") {
        setInUse(true);
        setFormError(error.message);
      } else {
        setFormError(
          error instanceof ApiRequestError
            ? error.message
            : "Something went wrong. Please try again."
        );
      }
    },
  });

  return (
    <Dialog open={course !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {course?.name}?
          </DialogTitle>
          <DialogDescription>
            This permanently removes the course. If enrollments still
            reference it, deactivate it instead to keep their history.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {formError}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          {inUse && course?.isActive && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => course && onDeactivate(course)}
            >
              Deactivate instead
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── courses list ─────────────────────────────────────────────────────────────

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

function CoursesCard() {
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

// ─── main console ─────────────────────────────────────────────────────────────

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
    { icon: Layers, label: "Total courses", value: isPending ? "–" : total.toLocaleString() },
    { icon: CheckCircle2, label: "Active", value: isPending ? "–" : active.toLocaleString() },
    { icon: CircleOff, label: "Inactive", value: isPending ? "–" : inactive.toLocaleString() },
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

      {/* Stats */}
      <section className="w-full">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <Card
              key={label}
              className="border-border/70 bg-card/95 shadow-sm"
            >
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
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CreateCourseCard />
        <CoursesCard />
      </div>
    </div>
  );
}
