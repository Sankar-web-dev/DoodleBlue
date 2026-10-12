"use client";

import { useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  Crown,
  GraduationCap,
  Loader2,
  UserCog,
} from "lucide-react";

import { AuthUser, ROLE_LABELS } from "@/services/auth.service";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/ui/logout-button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminConsole } from "./admin-console";
import { StudentsConsole } from "./students-console";
import { DepartmentsConsole } from "./departments-console";
import { CoursesConsole } from "./courses-console";

type SectionId = "admins" | "students" | "departments" | "courses";

export function ConsoleShell({ user }: { user: AuthUser }) {
  const isSuper = user.role === "SUPER_ADMIN";

  const items: { id: SectionId; label: string; icon: typeof Building2 }[] =
    isSuper
      ? [
          { id: "admins", label: "Admins", icon: UserCog },
          { id: "departments", label: "Departments", icon: Building2 },
          { id: "courses", label: "Courses", icon: BookOpen },
        ]
      : [
          { id: "students", label: "Students", icon: GraduationCap },
          { id: "departments", label: "Departments", icon: Building2 },
          { id: "courses", label: "Courses", icon: BookOpen },
        ];

  const [section, setSection] = useState<SectionId>(items[0].id);
  const RoleIcon = isSuper ? Crown : UserCog;
  const activeItem = items.find((i) => i.id === section);
  const isFetching = useIsFetching();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              StudentMS
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={section === item.id}
                      onClick={() => setSection(item.id)}
                      className="h-10"
                    >
                      {section === item.id && isFetching > 0 ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <item.icon />
                      )}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="bg-ambient-mesh">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/60 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            {activeItem && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                {isFetching > 0 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <activeItem.icon className="h-4 w-4" />
                )}
                {activeItem.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={
                isSuper
                  ? "border-transparent bg-violet-600 text-white"
                  : "border-transparent bg-indigo-600 text-white"
              }
            >
              <RoleIcon className="h-3.5 w-3.5" />
              {ROLE_LABELS[user.role]}
            </Badge>
            <LogoutButton
              showIcon
              className="w-auto"
              variant="outline"
              size="sm"
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-6 py-10">
          {section === "admins" ? (
            <AdminConsole />
          ) : section === "students" ? (
            <StudentsConsole />
          ) : section === "departments" ? (
            <DepartmentsConsole />
          ) : (
            <CoursesConsole />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
