"use client";

import { useQuery } from "@tanstack/react-query";

import { usersService, USERS_LIST_KEY } from "@/api/users.api";
import { CreateAdminCard } from "./_components/create-admin-card";
import { AdminsListCard } from "./_components/admins-list-card";
import { AdminStatsCards } from "./_components/admin-stats-cards";

export function AdminConsole() {
  const { data, isPending, isError } = useQuery({
    queryKey: [...USERS_LIST_KEY, "ADMIN"],
    queryFn: () => usersService.listUsers({ role: "ADMIN", limit: 50 }),
  });

  const admins = data?.data.users ?? [];
  const total = data?.meta?.total ?? admins.length;
  const active = admins.filter((a) => a.isActive).length;
  const inactive = admins.filter((a) => !a.isActive).length;

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

      <AdminStatsCards
        total={total}
        active={active}
        inactive={inactive}
        isPending={isPending}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CreateAdminCard />
        <AdminsListCard
          admins={admins}
          total={total}
          isPending={isPending}
          isError={isError}
        />
      </div>
    </div>
  );
}
