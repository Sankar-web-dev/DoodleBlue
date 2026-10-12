"use client";

import { useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  Crown,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  UserCog,
} from "lucide-react";

import { AuthUser, ROLE_LABELS } from "@/api/auth.api";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/ui/logout-button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AdminConsole } from "./admin-console";
import { StudentsConsole } from "./students-console";
import { DepartmentsConsole } from "./departments-console";
import { CoursesConsole } from "./courses-console";
import { AnalyticsConsole } from "./analytics-console";

type SectionId =
  | "overview"
  | "admins"
  | "students"
  | "departments"
  | "courses";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ConsoleShell({ user }: { user: AuthUser }) {
  const isSuper = user.role === "SUPER_ADMIN";

  const items: { id: SectionId; label: string; icon: typeof Building2 }[] =
    isSuper
      ? [
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "admins", label: "Admins", icon: UserCog },
          { id: "departments", label: "Departments", icon: Building2 },
          { id: "courses", label: "Courses", icon: BookOpen },
        ]
      : [
          { id: "overview", label: "Overview", icon: LayoutDashboard },
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
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-4 py-5 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
              CampusLMS
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Manage
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={section === item.id}
                      onClick={() => setSection(item.id)}
                      className="h-10 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                    >
                      {section === item.id && isFetching > 0 ? (
                        <Loader2 className="animate-spin text-primary" />
                      ) : (
                        <item.icon className={section === item.id ? "text-primary" : ""} />
                      )}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="mt-auto border-t border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:p-2">
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-3 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:justify-center">
            <div
              title={user.name}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-sm font-bold text-primary"
            >
              {initials(user.name)}
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
            <Badge
              className={
                isSuper
                  ? "border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/25 group-data-[collapsible=icon]:p-1.5"
                  : "border-border bg-secondary text-secondary-foreground group-data-[collapsible=icon]:p-1.5"
              }
            >
              <RoleIcon className="h-3.5 w-3.5" />
              <span className="group-data-[collapsible=icon]:hidden">
                {ROLE_LABELS[user.role]}
              </span>
            </Badge>
            <LogoutButton
              showIcon
              title="Log out"
              className="w-full justify-start group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 [&>span]:group-data-[collapsible=icon]:hidden [&>svg]:group-data-[collapsible=icon]:mr-0"
              variant="outline"
              size="sm"
            />
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-x-hidden bg-ambient-mesh">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/60 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
           
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-8rem)] flex-1 flex-col gap-4 p-4 md:gap-8 md:px-5 md:py-2">
          {section === "overview" ? (
            <AnalyticsConsole isSuper={isSuper} />
          ) : section === "admins" ? (
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
