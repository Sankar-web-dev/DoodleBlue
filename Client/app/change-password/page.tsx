"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Loader2, Lock, ShieldAlert } from "lucide-react";

import { authService, AUTH_ME_KEY } from "@/api/auth.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const changeMutation = useMutation({
    mutationFn: () => authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_ME_KEY });
      toast.success("Password updated", {
        description: "You can now access your account.",
      });
      router.replace("/dashboard");
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
    if (newPassword.length < 10) {
      setFormError("New password must be at least 10 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setFormError("Choose a different password from your current one.");
      return;
    }
    setFormError(null);
    changeMutation.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ambient-mesh px-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <KeyRound className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            <span className="gradient-text">Set a new password</span>
          </h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Required before you can continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {(
            [
              { id: "current", label: "Current password", value: currentPassword, set: setCurrentPassword, auto: "current-password" },
              { id: "new", label: "New password", value: newPassword, set: setNewPassword, auto: "new-password" },
              { id: "confirm", label: "Confirm new password", value: confirmPassword, set: setConfirmPassword, auto: "new-password" },
            ] as const
          ).map(({ id, label, value, set, auto }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id}>{label}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={id}
                  type="password"
                  autoComplete={auto}
                  className="h-11 rounded-xl pl-10 border-border/70 focus-visible:ring-primary"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  disabled={changeMutation.isPending}
                  required
                />
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            Minimum 10 characters.
          </p>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
            disabled={changeMutation.isPending}
          >
            {changeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
