"use client";

import { BookOpen, GraduationCap } from "lucide-react";

import { Student } from "@/api/students.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { initials } from "./console-utils";

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

export function StudentsListCard({
  students,
  total,
  isPending,
  isError,
  onEnroll,
}: {
  students: Student[];
  total: number;
  isPending: boolean;
  isError: boolean;
  onEnroll: (student: Student) => void;
}) {
  return (
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
              onEnroll={() => onEnroll(s)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
