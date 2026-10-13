"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserPlus,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";

import { usersService, USERS_LIST_KEY } from "@/api/users.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { generatePassword } from "./console-utils";

export function CreateAdminCard() {
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
