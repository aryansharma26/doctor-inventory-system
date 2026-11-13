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
  UserCheck,
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

  const role = identity?.selectedRole ?? "DOCTOR";
  const isDoctor = role === "DOCTOR" || role === "CLINIC_OWNER";
  const isReception = role === "RECEPTIONIST";

  // Dedicated role-based navigation tabs
  const doctorNav = [
    { href: "/consultation", label: "Doctor Desk", icon: Stethoscope },
    { href: "/queue", label: "My Patient Queue", icon: Clock },
    { href: "/patients", label: "Patient Records (EMR)", icon: FileText },
    { href: "/reminders", label: "Follow-up Recalls", icon: CalendarDays },
    { href: "/inventory", label: "Formulary & Drugs", icon: Pill },
    { href: "/analytics", label: "Clinic KPIs", icon: LayoutDashboard },
    { href: "/subscription", label: "Plan & Invoices", icon: CreditCard },
  ];

  const receptionNav = [
    { href: "/reception", label: "Patient Check-in", icon: Users },
    { href: "/queue", label: "Calling Queue Board", icon: Clock },
    { href: "/pos", label: "Billing & Cashier", icon: Receipt },
    { href: "/patients", label: "Patient Directory", icon: FileText },
    { href: "/inventory", label: "Stock Quick-Lookup", icon: Pill },
  ];

  const superAdminNav = [
    { href: "/superadmin", label: "Platform Overview", icon: ShieldCheck },
    { href: "/consultation", label: "Preview Doctor Desk", icon: Stethoscope },
    { href: "/reception", label: "Preview Reception", icon: Users },
    { href: "/subscription", label: "Tenant SaaS Subscriptions", icon: CreditCard },
  ];

  const currentNav = isReception ? receptionNav : isDoctor ? doctorNav : superAdminNav;

  const selectedClinic =
    identity?.clinics.find((c) => c.id === identity.selectedClinicId) ||
    identity?.clinics[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Top Header - Soft Clinical Glass Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-14 px-4 sm:px-6 flex items-center justify-between">
        {/* Brand & Clinic Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={isDoctor ? "/consultation" : "/reception"}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center font-bold text-sm shadow-2xs group-hover:bg-teal-100/70 transition-colors">
              <Activity className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
                MediStock
              </span>
              <span className="text-[10px] font-medium text-teal-700 block leading-none">
                Clinical OS
              </span>
            </div>
          </Link>

          <span className="text-slate-300">/</span>

          {/* Clinic Switcher */}
          <div className="relative group">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="truncate max-w-[130px] sm:max-w-[180px]">
                {selectedClinic?.name ?? "St. Jude Family Health"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="hidden group-hover:block absolute left-0 top-full mt-1 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Clinic Branch
              </div>
              {identity?.clinics.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectClinic(c.id)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    c.id === identity?.selectedClinicId
                      ? "font-semibold text-teal-900 bg-teal-50/60"
                      : "text-slate-600"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
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
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/70 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="font-semibold uppercase tracking-tight">
                {sub.planId}
              </span>
              {sub.status === "TRIAL" && (
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-1.5 py-0.2 rounded-full border border-amber-200">
                  14d Trial
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Right Tools & Role Quick Switcher */}
        <div className="flex items-center gap-3">
          {/* Active Workspace / Role Switcher */}
          <div className="flex items-center gap-1 border border-slate-200/90 rounded-lg p-0.5 bg-slate-50 text-[11px]">
            <span className="px-2 text-slate-400 font-medium hidden sm:inline">
              Workspace:
            </span>
            <button
              onClick={() => signInDemo("DOCTOR")}
              title="Switch to Doctor Consultation Desk"
              className={`px-2.5 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                isDoctor
                  ? "bg-teal-600 font-semibold text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor</span>
            </button>
            <button
              onClick={() => signInDemo("RECEPTIONIST")}
              title="Switch to Front Desk / Reception Check-in"
              className={`px-2.5 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                isReception
                  ? "bg-sky-600 font-semibold text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Reception</span>
            </button>
            <button
              onClick={() => signInDemo("SUPERADMIN")}
              title="Platform Admin"
              className={`px-2 py-1 rounded-md cursor-pointer transition-all hidden md:flex items-center gap-1 ${
                identity?.user.isPlatformAdmin
                  ? "bg-slate-900 font-semibold text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>

          {/* User Full Name & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">
                {identity?.user.fullName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                {isDoctor ? "Attending Physician" : isReception ? "Front Desk Officer" : "Super Admin"}
              </span>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Bar (Light soothing pastel tab styling) */}
      <nav className="bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? "border-teal-600 text-teal-800 font-semibold bg-teal-50/40"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? "text-teal-600" : "text-slate-400"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Soft Role Warning Pill (if Doctor visits Reception URL directly) */}
      {isDoctor && pathname === "/reception" && (
        <div className="bg-teal-50/80 border-b border-teal-200/70 px-4 py-2 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>
              You are currently viewing the <strong>Front Desk Check-in</strong>.
              Doctor records & consultation tools are on the Doctor Desk.
            </span>
          </div>
          <Link
            href="/consultation"
            className="font-semibold underline hover:text-teal-950 flex items-center gap-1"
          >
            Go to Doctor Desk →
          </Link>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
