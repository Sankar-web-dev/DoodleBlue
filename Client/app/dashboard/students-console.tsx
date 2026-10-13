"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GraduationCap,
  BookOpen,
  UserCheck,
  UserX,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  Building2,
  Hash,
  ChevronDown,
} from "lucide-react";

import {
  studentsService,
  STUDENTS_LIST_KEY,
  Student,
} from "@/api/students.api";
import {
  departmentsService,
  DEPARTMENTS_LIST_KEY,
} from "@/api/departments.api";
import { ApiRequestError } from "@/lib/api";
import { EnrollStudentDialog } from "./enroll-student-dialog";
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

// ─── helpers ──────────────────────────────────────────────────────────────────

function generatePassword(length = 14): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function suggestStudentNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `STU-${year}-${seq}`;
}

// ─── create student card ──────────────────────────────────────────────────────

function CreateStudentCard() {
  const queryClient = useQueryClient();

  const { data: deptData, isPending: deptsPending } = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, "active"],
    queryFn: () => departmentsService.listDepartments({ isActive: true, limit: 100 }),
  });
  const departments = useMemo(() => deptData?.data ?? [], [deptData]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
    studentNumber: string;
  } | null>(null);

  // Auto-select the first active department so enrollment works out of the box.
  useEffect(() => {
    if (!departmentId && departments.length > 0) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  const createMutation = useMutation({
    mutationFn: () =>
      studentsService.createStudent({
        fullName: fullName.trim(),
        email: email.trim(),
        studentNumber: studentNumber.trim(),
        departmentId,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        temporaryPassword: password,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_LIST_KEY });
      setCreated({
        email: email.trim(),
        password,
        studentNumber: studentNumber.trim(),
      });
      setFullName("");
      setEmail("");
      setStudentNumber(suggestStudentNumber());
      setPhone("");
      setPassword(generatePassword());
      setFormError(null);
      toast.success("Student enrolled", {
        description: "Share the credentials with the student.",
      });
    },
    onError: (error) => {
      setCreated(null);
      setFormError(
        error instanceof ApiRequestError
          ? error.code === "EMAIL_IN_USE"
            ? "That email is already registered."
            : error.code === "STUDENT_NUMBER_IN_USE"
              ? "That student number is already taken."
              : error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setFormError("Enter the student's full name.");
      return;
    }
    if (!email.trim()) {
      setFormError("Enter an email address.");
      return;
    }
    if (studentNumber.trim().length < 3) {
      setFormError("Enter a student number (min 3 characters).");
      return;
    }
    if (!departmentId) {
      setFormError("Pick a department.");
      return;
    }
    if (password.length < 10) {
      setFormError("Temporary password must be at least 10 characters.");
      return;
    }
    setFormError(null);
    setCreated(null);
    createMutation.mutate();
  };

  const copyCredentials = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(
      `Student number: ${created.studentNumber}\nEmail: ${created.email}\nTemporary password: ${created.password}`
    );
    toast.success("Credentials copied");
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Enroll student
        </CardTitle>
        <CardDescription>
          Creates the student profile and their sign-in account. Share the
          credentials — they can log in right away.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stu-name">Full name</Label>
              <Input
                id="stu-name"
                placeholder="e.g. Arun Kumar"
                className="h-11 rounded-xl"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stu-number">Student number</Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="stu-number"
                  placeholder="STU-2026-0001"
                  className="h-11 rounded-xl pl-10 pr-10 font-mono text-sm"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  disabled={createMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setStudentNumber(suggestStudentNumber())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Suggest student number"
                  title="Suggest student number"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stu-email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="stu-email"
                type="email"
                placeholder="student@school.com"
                className="h-11 rounded-xl pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stu-dept">Department</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="stu-dept"
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
                  No departments yet — run{" "}
                  <code className="font-mono">pnpm seed:dept</code> in Server to
                  create a default one.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stu-phone">
                Phone <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="stu-phone"
                  placeholder="9876543210"
                  className="h-11 rounded-xl pl-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stu-password">Temporary password</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="stu-password"
                type={showPassword ? "text" : "password"}
                placeholder="Generate a password"
                className="h-11 rounded-xl pl-10 pr-20 font-mono text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={createMutation.isPending}
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword())}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Generate password"
                  title="Generate password"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters · shown only once
            </p>
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
                Enrolling…
              </>
            ) : (
              <>
                <GraduationCap className="h-4 w-4" />
                Enroll student
              </>
            )}
          </Button>
        </form>

        {created && (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
              Student enrolled — share these credentials
            </p>
            <div className="space-y-1 font-mono text-xs text-foreground/80">
              <p>Student no: {created.studentNumber}</p>
              <p>Email: {created.email}</p>
              <p>Password: {created.password}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
              onClick={copyCredentials}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy credentials
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── students list ────────────────────────────────────────────────────────────

function StudentRow({
  student,
  onEnroll,
}: {
  student: Student;
  onEnroll: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/25 text-sm font-bold">
          {initials(student.fullName)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{student.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {student.studentNumber} · {student.department.name}
          </p>
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2">
        <Badge variant="outline" className="hidden sm:inline-flex font-mono">
          {student.department.code}
        </Badge>
        <Badge
          variant={student.status === "ACTIVE" ? "success" : "secondary"}
        >
          {student.status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEnroll}
          aria-label={`Enroll ${student.fullName} in a course`}
          title="Enroll in course"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── main console ─────────────────────────────────────────────────────────────

export function StudentsConsole() {
  const [enrolling, setEnrolling] = useState<Student | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: STUDENTS_LIST_KEY,
    queryFn: () => studentsService.listStudents({ limit: 50 }),
  });

  const students = data?.data ?? [];
  const total = data?.meta?.total ?? students.length;
  const active = students.filter((s) => s.status === "ACTIVE").length;
  const inactive = students.filter((s) => s.status === "INACTIVE").length;

  const stats = [
    { icon: BookOpen, label: "Total students", value: total },
    { icon: UserCheck, label: "Active", value: active },
    { icon: UserX, label: "Inactive", value: inactive },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enroll students, map them to academic departments, and manage accounts.
          </p>
        </div>
      </section>

      {/* Stats Cards Grid - evenly distributed across the space */}
      <section className="w-full">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-none md:grid-flow-col md:auto-cols-fr">
          {stats.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="min-w-0 border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="truncate text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <span className="shrink-0 rounded-lg border border-border/60 bg-muted p-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="truncate text-3xl font-bold tracking-tight text-foreground">
                  {isPending ? "–" : value.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CreateStudentCard />

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Students
            </CardTitle>
            <CardDescription>
              {isPending
                ? "Loading students…"
                : `${total} student${total === 1 ? "" : "s"} enrolled`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))
            ) : isError ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Couldn&apos;t load students. Check the server and refresh.
              </p>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
                <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">No students yet</p>
                <p className="text-xs text-muted-foreground">
                  Enroll the first one with the form on the left.
                </p>
              </div>
            ) : (
              students.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  onEnroll={() => setEnrolling(s)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <EnrollStudentDialog
        student={enrolling}
        onClose={() => setEnrolling(null)}
      />
    </div>
  );
}
