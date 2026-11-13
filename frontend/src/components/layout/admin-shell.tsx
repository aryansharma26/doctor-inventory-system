import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Building2,
  Globe,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";

function AdminSideContent({ close }: { close?: () => void }) {
  const { signOut } = useAuth();

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-slate-900 text-slate-300">
      <div className="flex h-[72px] items-center gap-3 border-b border-slate-800 px-5 bg-slate-950">
        <span className="relative grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg">
          <Globe size={21} />
        </span>
        <div>
          <div className="text-[18px] font-extrabold tracking-tight text-white">
            MediStock Admin
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[.18em] text-blue-400">
            Super Platform
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Platform Overview
        </div>
        <nav className="space-y-1.5">
          <NavLink
            to="/superadmin"
            end
            onClick={close}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-slate-800 hover:text-white",
              )
            }
          >
            <Activity size={18} />
            <span>Command Center</span>
          </NavLink>
          <NavLink
            to="/superadmin/clinics"
            onClick={close}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-slate-800 hover:text-white",
              )
            }
          >
            <Building2 size={18} />
            <span>Manage Clinics</span>
          </NavLink>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-4 pb-1">
            Management
          </div>
          <NavLink
            to="/users"
            onClick={close}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-slate-800 hover:text-white",
              )
            }
          >
            <Users size={18} />
            <span>All Users</span>
          </NavLink>
          <NavLink
            to="/reports"
            onClick={close}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-slate-800 hover:text-white",
              )
            }
          >
            <BarChart3 size={18} />
            <span>Revenue Reports</span>
          </NavLink>
          <NavLink
            to="/audit"
            onClick={close}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-slate-800 hover:text-white",
              )
            }
          >
            <ShieldCheck size={18} />
            <span>Audit Logs</span>
          </NavLink>
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-800 p-3 bg-slate-950">
        <NavLink
          to="/"
          className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <Users size={17} /> Back to Clinic View
        </NavLink>
        <NavLink
          to="/settings"
          className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <Settings size={17} /> Platform Settings
        </NavLink>
        <button
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </div>
  );
}

const titles: Record<string, string> = {
  "/superadmin": "Super Admin Command Center",
  "/superadmin/clinics": "Manage Clinics & Subscriptions",
  "/platform": "Super Admin Command Center",
  "/platform/clinics": "Manage Clinics & Subscriptions",
};

export function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { identity } = useAuth();
  const initials =
    identity?.user.fullName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SA";
  const pageTitle = titles[location.pathname] ?? "MediStock Platform";

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block shadow-2xl">
        <AdminSideContent />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="h-full w-64 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="absolute right-3 top-3 z-10 text-slate-400 hover:text-white"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
              <AdminSideContent close={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-7 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-600"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <h1 className="hidden text-lg font-black tracking-tight text-slate-900 xl:block">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center px-4 py-1.5 bg-rose-100 text-rose-800 rounded-full text-xs font-bold tracking-wider">
              🚨 SUPER ADMIN MODE
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
              <span className="grid size-9 place-items-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow">
                {initials}
              </span>
              <div className="hidden xl:block">
                <div className="text-xs font-bold text-slate-900">
                  {identity?.user.fullName}
                </div>
                <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">
                  Platform Admin
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-[1600px] p-4 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
