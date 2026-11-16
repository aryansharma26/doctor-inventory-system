"use client";

import type { ReactNode } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  ConciergeBell,
  LayoutDashboard,
  ListOrdered,
  Settings,
  Stethoscope,
  UserCog,
  Users,
} from "lucide-react";
import { AppShell, Badge, type ShellConfig } from "@/design-system";
import { DEMO_TODAY } from "@/mocks/catalog";
import { HospitalStoreProvider, useHospitalStore } from "./store";
import { WorkspaceGate } from "./shared";

function Shell({ children }: { children: ReactNode }) {
  const { state } = useHospitalStore();
  const today = state?.appointments.filter((a) => a.date === DEMO_TODAY) ?? [];
  const waiting = today.filter((a) => a.status === "waiting").length;

  const config: ShellConfig = {
    product: "MediStock",
    context: state?.hospital.name ?? "Hospital workspace",
    contextMeta: state ? `${state.hospital.area}, ${state.hospital.city}` : undefined,
    accent: "brand",
    user: { name: "Pooja Kale", role: "Front desk · Receptionist" },
    searchPlaceholder: "Search patients by name, mobile or UHID",
    searchHref: "/hospital/patients",
    sections: [
      { items: [{ href: "/hospital", label: "Overview", icon: <LayoutDashboard />, exact: true }] },
      {
        title: "Front desk",
        items: [
          { href: "/hospital/reception", label: "Reception desk", icon: <ConciergeBell /> },
          { href: "/hospital/queue", label: "Consultation queue", icon: <ListOrdered />, badge: waiting || undefined },
          { href: "/hospital/appointments", label: "Appointments", icon: <ClipboardList /> },
          { href: "/hospital/calendar", label: "Calendar", icon: <CalendarDays /> },
        ],
      },
      {
        title: "Records",
        items: [
          { href: "/hospital/patients", label: "Patients", icon: <Users /> },
          { href: "/hospital/doctors", label: "Doctors", icon: <Stethoscope /> },
          { href: "/hospital/departments", label: "Departments", icon: <Building2 /> },
        ],
      },
      {
        title: "Administration",
        items: [
          { href: "/hospital/reports", label: "Reports", icon: <BarChart3 /> },
          { href: "/hospital/staff", label: "Staff", icon: <UserCog /> },
          { href: "/hospital/settings", label: "Settings", icon: <Settings /> },
        ],
      },
    ],
  };

  return (
    <AppShell
      config={config}
      topbarActions={
        <Badge tone="success" dot className="mr-1 hidden sm:inline-flex">
          OPD open
        </Badge>
      }
      notifications={[
        { id: "n1", title: "Sneha Patil is waiting", body: "Checked in for Dr. Meera Iyer at 11:05 AM.", time: "15 min ago", unread: true },
        { id: "n2", title: "New online booking", body: "Aarav Sharma with Dr. Kavya Reddy, today 5:15 PM.", time: "1 h ago", unread: true },
      ]}
    >
      <WorkspaceGate>{children}</WorkspaceGate>
    </AppShell>
  );
}

export function HospitalLayoutClient({ children }: { children: ReactNode }) {
  return (
    <HospitalStoreProvider>
      <Shell>{children}</Shell>
    </HospitalStoreProvider>
  );
}
