"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserPlus,
  Users,
  UserCheck,
  UserX,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";

import { usersService, USERS_LIST_KEY, ListedUser } from "@/api/users.api";
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

// ─── create admin card ────────────────────────────────────────────────────────

function CreateAdminCard() {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      usersService.createAdmin({
        name: name.trim(),
        email: email.trim(),
        temporaryPassword: password,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_LIST_KEY });
      setCreated({ email: email.trim(), password });
      setName("");
      setEmail("");
      setPassword(generatePassword());
      setFormError(null);
      toast.success("Admin account created", {
        description: "Share the credentials with them.",
      });
    },
    onError: (error) => {
      setCreated(null);
      setFormError(
        error instanceof ApiRequestError
          ? error.code === "EMAIL_IN_USE"
            ? "That email is already registered."
            : error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Enter the admin's full name.");
      return;
    }
    if (!email.trim()) {
      setFormError("Enter an email address.");
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
      `Email: ${created.email}\nTemporary password: ${created.password}`
    );
    toast.success("Credentials copied");
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Create admin
        </CardTitle>
        <CardDescription>
          Admins manage students and enrollment. Share the credentials with
          them — they can sign in right away.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="admin-name">Full name</Label>
            <Input
              id="admin-name"
              placeholder="e.g. Priya Sharma"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@school.com"
                className="h-11 rounded-xl pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Temporary password</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-password"
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
                Creating…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create admin account
              </>
            )}
          </Button>
        </form>

        {created && (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
              Account ready — share these credentials
            </p>
            <div className="space-y-1 font-mono text-xs text-foreground/80">
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

// ─── admins list card ─────────────────────────────────────────────────────────

function AdminRow({ admin }: { admin: ListedUser }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/25 text-sm font-bold">
          {initials(admin.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{admin.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {admin.email}
          </p>
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2">
        <Badge variant={admin.isActive ? "success" : "secondary"}>
          {admin.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>
  );
}

// ─── main console ─────────────────────────────────────────────────────────────

export function AdminConsole() {
  const { data, isPending, isError } = useQuery({
    queryKey: [...USERS_LIST_KEY, "ADMIN"],
    queryFn: () => usersService.listUsers({ role: "ADMIN", limit: 50 }),
  });

  const admins = data?.data.users ?? [];
  const total = data?.meta?.total ?? admins.length;
  const active = admins.filter((a) => a.isActive).length;
  const inactive = admins.filter((a) => !a.isActive).length;

  const stats = [
    { icon: Users, label: "Total admins", value: total },
    { icon: UserCheck, label: "Active", value: active },
    { icon: UserX, label: "Inactive", value: inactive },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Provision and manage administrator credentials and portal access.
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
        <CreateAdminCard />

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Admins
            </CardTitle>
            <CardDescription>
              {isPending
                ? "Loading accounts…"
                : `${total} account${total === 1 ? "" : "s"} provisioned`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))
            ) : isError ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Couldn&apos;t load admins. Check the server and refresh.
              </p>
            ) : admins.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
                <Users className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">No admins yet</p>
                <p className="text-xs text-muted-foreground">
                  Create the first one with the form on the left.
                </p>
              </div>
            ) : (
              admins.map((admin) => <AdminRow key={admin.id} admin={admin} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
