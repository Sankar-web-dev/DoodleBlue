"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  Mail,
  ShieldCheck,
  Crown,
  UserCog,
  BookOpen,
} from "lucide-react";

import { authService, AUTH_ME_KEY, ROLE_LABELS, UserRole } from "@/api/auth.api";
import { ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton } from "@/components/ui/logout-button";
import { ConsoleShell } from "./console-shell";

const ROLE_STYLES: Record<UserRole, { badge: string; icon: typeof Crown; label: string }> = {
  SUPER_ADMIN: { badge: "bg-violet-600 text-white border-transparent", icon: Crown, label: "Super Admin" },
  ADMIN: { badge: "bg-indigo-600 text-white border-transparent", icon: UserCog, label: "Admin" },
  STUDENT: { badge: "bg-sky-600 text-white border-transparent", icon: BookOpen, label: "Student" },
};

export default function DashboardPage() {
  const router = useRouter();

  const { data, error, isPending, refetch } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: authService.me,
    retry: false,
  });

  useEffect(() => {
    if (error instanceof ApiRequestError && error.status === 401) {
      router.replace("/login");
    }
  }, [error, router]);

  if (error) {
    // 401s redirect via the effect above; anything else means the API is
    // unreachable or failed — don't hang on the skeleton.
    if (!(error instanceof ApiRequestError && error.status === 401)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ambient-mesh p-6">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>Can&apos;t reach the server</CardTitle>
              <CardDescription>
                {error instanceof Error ? error.message : "Something went wrong."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
              <Button variant="ghost" onClick={() => router.replace("/login")}>
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  if (isPending || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ambient-mesh p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center space-y-3">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user } = data;
  const role = ROLE_STYLES[user.role];
  const RoleIcon = role.icon;

  // Admin roles get the sidebar layout with section navigation.
  if (user.role !== "STUDENT") {
    return <ConsoleShell user={user} />;
  }

  return (
    <div className="min-h-screen bg-ambient-mesh">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">StudentMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={role.badge}>
              <RoleIcon className="h-3.5 w-3.5" />
              {ROLE_LABELS[user.role]}
            </Badge>
            <LogoutButton showIcon className="w-auto" variant="outline" size="sm" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s your account overview.
          </p>
        </div>

        <Card className="glass-card rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Signed in account
            </CardTitle>
            <CardDescription>
              Your session is active for 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/50 px-5 py-4">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
