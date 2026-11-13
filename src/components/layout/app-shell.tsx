"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  Package,
  Pill,
  Receipt,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

/* ── Section-based navigation: features grouped cleanly ── */

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { title: string; items: NavItem[] };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { identity, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = identity?.selectedRole ?? "DOCTOR";
  const isDoctor = role === "DOCTOR" || role === "CLINIC_OWNER";

  /* Doctor gets: Clinical → Operations → Account */
  const doctorSections: NavSection[] = [
    {
      title: "Clinical",
      items: [
        { href: "/consultation", label: "Consultation Desk", icon: Stethoscope },
        { href: "/queue", label: "Patient Queue", icon: Clock },
        { href: "/patients", label: "Patients & EMR", icon: FileText },
        { href: "/reminders", label: "Follow-up Recalls", icon: CalendarDays },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/inventory", label: "Formulary & Drugs", icon: Pill },
        { href: "/analytics", label: "Clinic Analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/subscription", label: "Plan & Billing", icon: CreditCard },
      ],
    },
  ];

  /* Reception gets: Front Desk → Operations */
  const receptionSections: NavSection[] = [
    {
      title: "Front Desk",
      items: [
        { href: "/reception", label: "Patient Intake", icon: Users },
        { href: "/queue", label: "Calling Queue", icon: Clock },
        { href: "/patients", label: "Patient Directory", icon: FileText },
        { href: "/reminders", label: "Follow-up Recalls", icon: CalendarDays },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/pos", label: "Cashier & Billing", icon: Receipt },
        { href: "/inventory", label: "Stock Lookup", icon: Package },
      ],
    },
  ];

  const sections = isDoctor ? doctorSections : receptionSections;

  const selectedClinic =
    identity?.clinics.find((c) => c.id === identity.selectedClinicId) ||
    identity?.clinics[0];

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200/80 h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900">MediStock</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
                MediStock
              </span>
              <span className="text-[11px] font-medium text-slate-400 block truncate max-w-[150px]">
                {selectedClinic?.name ?? "St. Jude Clinic"}
              </span>
            </div>
          </div>

          {/* Role Badge */}
          <div className="px-5 py-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50/70 border border-teal-100 text-xs font-semibold text-teal-900">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>{isDoctor ? "Doctor Portal" : "Front Desk"}</span>
            </div>
          </div>

          {/* Sectioned Navigation */}
          <nav className="px-3 pb-4">
            {sections.map((section, idx) => (
              <div key={section.title} className={idx > 0 ? "mt-5" : ""}>
                <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all ${
                          isActive
                            ? "bg-teal-600 text-white font-semibold shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom: Staff Profile & Sign Out */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <div className="truncate pr-2">
              <span className="font-semibold text-xs text-slate-900 block truncate leading-tight">
                {identity?.user.fullName}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {identity?.user.email}
              </span>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 p-5 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
