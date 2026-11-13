"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Pill,
  Receipt,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { getClinicSubscription } from "@/features/subscription/saas-subscription-store";
import { useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { identity, signOut, selectClinic, signInDemo } = useAuth();
  const [sub, setSub] = useState<any>(null);

  useEffect(() => {
    setSub(getClinicSubscription());
  }, [identity?.selectedClinicId]);

  const navItems = [
    { href: "/reception", label: "Reception", icon: Users },
    { href: "/consultation", label: "Doctor Desk", icon: Stethoscope },
    { href: "/queue", label: "OPD Queue", icon: Clock },
    { href: "/pos", label: "Billing & POS", icon: Receipt },
    { href: "/inventory", label: "Pharmacy & Stock", icon: Pill },
    { href: "/patients", label: "Patients", icon: FileText },
    { href: "/analytics", label: "Analytics", icon: LayoutDashboard },
    { href: "/reminders", label: "Follow-ups", icon: CalendarDays },
    { href: "/subscription", label: "Plan & Invoices", icon: CreditCard },
  ];

  const selectedClinic =
    identity?.clinics.find((c) => c.id === identity.selectedClinicId) ||
    identity?.clinics[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfb]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 h-14 px-4 flex items-center justify-between">
        {/* Brand & Clinic Switcher */}
        <div className="flex items-center gap-4">
          <Link href="/reception" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
              <Activity className="w-4 h-4" />
            </span>
            <span className="font-semibold text-sm tracking-tight text-zinc-950">
              MediStock
            </span>
          </Link>

          <span className="text-zinc-300">/</span>

          {/* Clinic Switcher */}
          <div className="relative group">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {selectedClinic?.name ?? "My Clinic"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </div>

            <div className="hidden group-hover:block absolute left-0 top-full mt-1 w-56 bg-white border border-zinc-200 rounded-md shadow-lg py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Select Clinic Branch
              </div>
              {identity?.clinics.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectClinic(c.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-50 cursor-pointer ${
                    c.id === identity.selectedClinicId
                      ? "font-semibold text-zinc-900 bg-zinc-50"
                      : "text-zinc-600"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {c.code}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subscription Tier Pill */}
          {sub && (
            <Link
              href="/subscription"
              className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200 transition-colors"
            >
              <span className="text-zinc-500 font-normal">Plan:</span>
              <span className="font-semibold uppercase tracking-tight">
                {sub.planId}
              </span>
              {sub.status === "TRIAL" && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1 rounded border border-amber-200">
                  Trial
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Right Tools & Role Quick Switcher */}
        <div className="flex items-center gap-2">
          {/* 1-Click Role Switcher for instant testing */}
          <div className="hidden lg:flex items-center gap-1 border border-zinc-200 rounded-md p-0.5 bg-zinc-50 text-[11px]">
            <span className="px-2 text-zinc-400 font-medium">Test as:</span>
            <button
              onClick={() => signInDemo("DOCTOR")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                identity?.selectedRole === "CLINIC_OWNER"
                  ? "bg-white font-semibold text-zinc-900 shadow-2xs border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Doctor
            </button>
            <button
              onClick={() => signInDemo("RECEPTIONIST")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                identity?.selectedRole === "RECEPTIONIST"
                  ? "bg-white font-semibold text-zinc-900 shadow-2xs border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Reception
            </button>
            <button
              onClick={() => signInDemo("SUPERADMIN")}
              className="px-2 py-0.5 rounded text-zinc-500 hover:text-zinc-900 cursor-pointer transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-zinc-400" />
              Admin
            </button>
          </div>

          {/* User Email & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
            <span className="text-xs text-zinc-600 hidden sm:inline">
              {identity?.user.fullName}
            </span>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-md hover:bg-zinc-100 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Bar (Clean Linear style tabs) */}
      <nav className="bg-white border-b border-zinc-200 px-4 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-zinc-900 text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
