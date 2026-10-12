"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
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

// ─── create department card ───────────────────────────────────────────────────

function CreateDepartmentCard() {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      departmentsService.createDepartment({
        name: name.trim(),
        code: code.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY });
      setName("");
      setCode("");
      setFormError(null);
      toast.success("Department created");
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiRequestError
          ? error.code === "CODE_IN_USE"
            ? "That code is already taken by another department."
            : error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Enter a department name (min 2 characters).");
      return;
    }
    if (!/^[A-Za-z0-9-]{2,20}$/.test(code.trim())) {
      setFormError(
        "Enter a code — 2 to 20 letters, numbers or hyphens (e.g. CSE)."
      );
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Create department
        </CardTitle>
        <CardDescription>
          Departments group students and courses. The code is a short unique
          identifier and can&apos;t be changed later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="dept-name">Department name</Label>
            <Input
              id="dept-name"
              placeholder="e.g. Computer Science"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept-code">Code</Label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="dept-code"
                placeholder="CSE"
                className="h-11 rounded-xl pl-10 font-mono text-sm uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Unique, stored uppercase · permanent once created
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
                Creating…
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                Create department
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── edit dialog ──────────────────────────────────────────────────────────────

function EditDepartmentDialog({
  department,
  onClose,
}: {
  department: Department | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed the input whenever a different row is opened.
  useEffect(() => {
    setName(department?.name ?? "");
    setFormError(null);
  }, [department]);

  const updateMutation = useMutation({
    mutationFn: () =>
      departmentsService.updateDepartment(department!.id, {
        name: name.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY });
      toast.success("Department renamed");
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
      setFormError("Enter a department name (min 2 characters).");
      return;
    }
    setFormError(null);
    updateMutation.mutate();
  };

  return (
    <Dialog open={department !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Rename department</DialogTitle>
          <DialogDescription>
            Code <span className="font-mono">{department?.code}</span> stays
            the same — it&apos;s the permanent identifier.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="edit-dept-name">Department name</Label>
            <Input
              id="edit-dept-name"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

function DeleteDepartmentDialog({
  department,
  onClose,
  onDeactivate,
}: {
  department: Department | null;
  onClose: () => void;
  onDeactivate: (department: Department) => void;
}) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [inUse, setInUse] = useState(false);

  useEffect(() => {
    setFormError(null);
    setInUse(false);
  }, [department]);

  const deleteMutation = useMutation({
    mutationFn: () => departmentsService.deleteDepartment(department!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY });
      toast.success("Department deleted");
      onClose();
    },
    onError: (error) => {
      if (
        error instanceof ApiRequestError &&
        error.code === "DEPARTMENT_IN_USE"
      ) {
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
    <Dialog open={department !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {department?.name}?
          </DialogTitle>
          <DialogDescription>
            This permanently removes the department. If students or courses
            still reference it, deactivate it instead to keep their history.
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
          {inUse && department?.isActive && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => department && onDeactivate(department)}
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

// ─── departments list ─────────────────────────────────────────────────────────

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

function DepartmentsCard() {
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

// ─── main console ─────────────────────────────────────────────────────────────

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
        <CreateDepartmentCard />
        <DepartmentsCard />
      </div>
    </div>
  );
}
