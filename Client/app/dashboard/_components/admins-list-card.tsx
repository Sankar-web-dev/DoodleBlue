"use client";

import { Users } from "lucide-react";

import { ListedUser } from "@/api/users.api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { initials } from "./console-utils";

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

export function AdminsListCard({
  admins,
  total,
  isPending,
  isError,
}: {
  admins: ListedUser[];
  total: number;
  isPending: boolean;
  isError: boolean;
}) {
  return (
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
  );
}
