"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Layers,
  Search,
  Pencil,
  Trash2,
  Power,
  Loader2,
} from "lucide-react";

import {
  departmentsService,
  DEPARTMENTS_LIST_KEY,
  Department,
} from "@/api/departments.api";
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
import {
  EditDepartmentDialog,
  DeleteDepartmentDialog,
} from "./department-dialogs";

function DepartmentRow({
  department,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  department: Department;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/25">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{department.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {department.code}
          </p>
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-1.5">
        <Badge variant={department.isActive ? "success" : "secondary"}>
          {department.isActive ? "Active" : "Inactive"}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          disabled={busy}
          aria-label={`Rename ${department.name}`}
          title="Rename"
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
            department.isActive
              ? `Deactivate ${department.name}`
              : `Activate ${department.name}`
          }
          title={department.isActive ? "Deactivate" : "Activate"}
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
          aria-label={`Delete ${department.name}`}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DepartmentsCard() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, "console", debouncedSearch],
    queryFn: () =>
      departmentsService.listDepartments({
        search: debouncedSearch || undefined,
        limit: 50,
      }),
  });
  const departments = data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: (d: Department) =>
      departmentsService.updateDepartment(d.id, { isActive: !d.isActive }),
    onSuccess: (_result, d) => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY });
      toast.success(d.isActive ? "Department deactivated" : "Department activated");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleDeactivate = (d: Department) => {
    setDeleting(null);
    updateMutation.mutate(d);
  };

  return (
    <>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Departments
          </CardTitle>
          <CardDescription>
            {isPending
              ? "Loading departments…"
              : `${data?.meta?.total ?? departments.length} department${
                  (data?.meta?.total ?? departments.length) === 1 ? "" : "s"
                } on record`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or code…"
              className="h-10 rounded-xl pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isPending ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))
          ) : isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Couldn&apos;t load departments. Check the server and refresh.
            </p>
          ) : departments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">
                {debouncedSearch ? "No matches" : "No departments yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {debouncedSearch
                  ? `Nothing found for “${debouncedSearch}”.`
                  : "Create the first one with the form on the left."}
              </p>
            </div>
          ) : (
            departments.map((d) => (
              <DepartmentRow
                key={d.id}
                department={d}
                busy={updateMutation.isPending && updateMutation.variables?.id === d.id}
                onEdit={() => setEditing(d)}
                onToggle={() => updateMutation.mutate(d)}
                onDelete={() => setDeleting(d)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <EditDepartmentDialog
        department={editing}
        onClose={() => setEditing(null)}
      />
      <DeleteDepartmentDialog
        department={deleting}
        onClose={() => setDeleting(null)}
        onDeactivate={handleDeactivate}
      />
    </>
  );
}
