import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Crown,
  Factory,
  FileHeart,
  FolderTree,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  PackageSearch,
  Pill,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import {
  getClinicSubscription,
  getDaysLeftInTrial,
} from "@/features/subscription/saas-subscription-store";

type NavigationItem = {
  label: string;
  to: string;
  icon: typeof Activity;
  permission?: string;
};

const groups: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: "Patient OPD Workflow",
    items: [
      {
        label: "🛎️ Reception Desk (Ticket)",
        to: "/reception",
        icon: FileHeart,
      },
      { label: "🩺 Doctor Consultation", to: "/consultation", icon: Activity },
      { label: "📅 Follow-up Reminders", to: "/reminders", icon: CalendarDays },
      {
        label: "📊 Philippines Clinic Analytics (₱)",
        to: "/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Practice & Clinic",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard },
      {
        label: "Point of Sale",
        to: "/pos",
        icon: ShoppingCart,
        permission: "invoice.issue",
      },
      {
        label: "Appointments",
        to: "/appointments",
        icon: CalendarDays,
        permission: "appointment.read",
      },
      {
        label: "Daily Queue",
        to: "/queue",
        icon: ListChecks,
        permission: "appointment.read",
      },
      {
        label: "Patients",
        to: "/patients",
        icon: FileHeart,
        permission: "patient_record.read",
      },
      {
        label: "Prescriptions",
        to: "/prescriptions",
        icon: Pill,
        permission: "prescription.read",
      },
    ],
  },
  {
    label: "Inventory & Stock",
    items: [
      {
        label: "Products",
        to: "/products",
        icon: PackageSearch,
        permission: "inventory.read",
      },
      {
        label: "Categories",
        to: "/categories",
        icon: FolderTree,
        permission: "inventory.manage",
      },
      {
        label: "Brands & makers",
        to: "/manufacturers",
        icon: Factory,
        permission: "inventory.manage",
      },
      {
        label: "Stock",
        to: "/inventory",
        icon: Boxes,
        permission: "inventory.read",
      },
    ],
  },
  {
    label: "Business & Reports",
    items: [
      {
        label: "Suppliers",
        to: "/suppliers",
        icon: Truck,
        permission: "purchase_order.read",
      },
      {
        label: "Purchases",
        to: "/purchases",
        icon: ClipboardList,
        permission: "purchase_order.read",
      },
      {
        label: "Sales & invoices",
        to: "/sales",
        icon: ReceiptText,
        permission: "invoice.read",
      },
      {
        label: "Daily Collection",
        to: "/daily-collection",
        icon: Wallet,
        permission: "invoice.read",
      },
      {
        label: "Expenses",
        to: "/expenses",
        icon: CircleDollarSign,
        permission: "invoice.read",
      },
      {
        label: "Reports",
        to: "/reports",
        icon: BarChart3,
        permission: "invoice.read",
      },
      {
        label: "Audit trail",
        to: "/audit",
        icon: ShieldCheck,
        permission: "audit.read",
      },
    ],
  },
  {
    label: "Staff & SaaS",
    items: [
      { label: "📋 Staff Attendance", to: "/attendance", icon: UserCheck },
      { label: "📢 Notice Board", to: "/notices", icon: Megaphone },
      { label: "💎 SaaS Plan & Billing", to: "/subscription", icon: Crown },
    ],
  },
];

function SideContent({ close }: { close?: () => void }) {
  const { signOut, identity, selectClinic } = useAuth();
  const selectedClinic = identity?.clinics.find(
    (clinic) => clinic.id === identity.selectedClinicId,
  );
  const canSee = (permission?: string) =>
    !permission ||
    identity?.user.isPlatformAdmin ||
    identity?.permissions.includes(permission);

  return (
    <div className="flex h-full flex-col border-r border-slate-200/80 bg-white">
      {/* Brand Header */}
      <div className="flex h-[72px] items-center gap-3.5 border-b border-slate-200/80 px-5 bg-slate-50/40">
        <span className="relative grid size-10 place-items-center rounded-2xl bg-gradient-to-tr from-[#071b4a] via-blue-900 to-indigo-900 text-white shadow-md shadow-blue-950/20">
          <Activity size={20} className="text-white" />
          <i className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-amber-400" />
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[17px] font-black tracking-tight text-[#071b4a]">
              MediStock
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold border border-blue-100 uppercase tracking-wider">
              SaaS
            </span>
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[.18em] text-blue-600">
            Cloud Clinic Suite
          </div>
        </div>
      </div>

      {/* Modern Active Clinic Switcher Card */}
      <div className="p-3">
        <label className="relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 transition-all hover:bg-slate-100/80 hover:border-slate-300 cursor-pointer shadow-2xs">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs shadow-xs">
            {selectedClinic?.name?.[0]?.toUpperCase() ?? "C"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-slate-800">
              {selectedClinic?.name ?? "Select clinic"}
            </span>
            <span className="block truncate text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {selectedClinic?.role.replaceAll("_", " ") ?? "Workspace"}
            </span>
          </span>
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
          <select
            aria-label="Active clinic"
            value={identity?.selectedClinicId ?? ""}
            onChange={(event) => void selectClinic(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="" disabled>
              Select clinic
            </option>
            {identity?.clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
        {groups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            canSee(item.permission),
          );
          if (!visibleItems.length) return null;
          return (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={close}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                        isActive
                          ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/25"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                      )
                    }
                  >
                    <item.icon size={16} />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Refined Bottom User Card & Super Admin Access */}
      <div className="border-t border-slate-200/80 p-3 bg-slate-50/40 space-y-2">
        {identity?.user.isPlatformAdmin && (
          <NavLink
            to="/platform"
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md transition-all"
          >
            <Building2 size={15} />
            🛡️ Super Admin Panel
          </NavLink>
        )}
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <NavLink
            to="/settings"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Settings size={15} className="text-slate-400" />
            Settings
          </NavLink>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/reception": "Reception Desk & OPD Ticket Terminal",
  "/consultation": "Doctor Consultation & Rx Room",
  "/reminders": "Follow-up Reminders & Calendar",
  "/analytics": "Philippines Clinic Revenue & OPD Analytics",
  "/pos": "Point of Sale",
  "/appointments": "Appointments",
  "/queue": "Daily Queue",
  "/prescriptions": "Prescriptions",
  "/products": "Products",
  "/categories": "Categories",
  "/manufacturers": "Brands & makers",
  "/inventory": "Inventory",
  "/suppliers": "Suppliers",
  "/patients": "Patients",
  "/purchases": "Purchases",
  "/sales": "Sales & invoices",
  "/expenses": "Expenses",
  "/reports": "Reports",
  "/users": "Team & roles",
  "/audit": "Audit trail",
  "/documents": "Documents",
  "/settings": "Settings",
  "/platform": "Platform admin",
  "/platform/clinics": "Clinics",
  "/attendance": "Staff Attendance",
  "/notices": "Clinic Notice Board",
  "/daily-collection": "Daily Financial Collection Summary (₱)",
  "/subscription": "SaaS Subscription & Billing Management",
};

type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  path: string;
};

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const results = useQuery({
    queryKey: ["global-search", deferredQuery],
    queryFn: () =>
      api<SearchResult[]>(`/search?q=${encodeURIComponent(deferredQuery)}`),
    enabled: deferredQuery.length >= 2,
    staleTime: 30_000,
  });
  const select = (result: SearchResult) => {
    setQuery("");
    navigate(result.path);
  };

  return (
    <div className="relative ml-auto hidden w-full max-w-sm sm:block">
      <label className="flex items-center gap-2 rounded-lg border border-line bg-slate-50 px-3 py-2 transition-colors focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
        <Search size={15} className="text-slate-400" />
        <span className="sr-only">Global search</span>
        <input
          ref={inputRef}
          aria-label="Global search"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          placeholder="Search patients, medicines, invoices..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
              inputRef.current?.blur();
            }
          }}
        />
        <kbd className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 shadow-2xs">
          Ctrl K
        </kbd>
      </label>
      {deferredQuery.length >= 2 && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-xl border border-line bg-white shadow-xl">
          <div className="max-h-80 overflow-y-auto p-2">
            {results.isLoading && (
              <div className="p-5 text-center text-xs text-slate-400">
                Searching...
              </div>
            )}
            {results.data?.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => select(result)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-50"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[10px] font-bold uppercase text-blue-700">
                  {result.type.slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {result.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                    {result.subtitle}
                  </span>
                </span>
              </button>
            ))}
            {!results.isLoading && results.data?.length === 0 && (
              <div className="p-5 text-center text-xs text-slate-400">
                No matching records.
              </div>
            )}
            {results.isError && (
              <div className="p-5 text-center text-xs text-rose-500">
                Search is temporarily unavailable.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { identity } = useAuth();
  const [sub, setSub] = useState(getClinicSubscription());

  useEffect(() => {
    const handleUpdate = () => setSub(getClinicSubscription());
    window.addEventListener("medistock-subscription-update", handleUpdate);
    return () => window.removeEventListener("medistock-subscription-update", handleUpdate);
  }, []);
  const daysLeft = getDaysLeftInTrial(sub.trialEndsAt);

  const initials =
    identity?.user.fullName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";
  const pageTitle = location.pathname.startsWith("/patients/")
    ? "Patient 360 record"
    : location.pathname.startsWith("/appointments/")
      ? "Appointment encounter"
      : location.pathname.startsWith("/doctors/")
        ? "Doctor profile"
        : (titles[location.pathname] ?? "MediStock");

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SideContent />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="h-full w-64"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="absolute right-3 top-3 z-10"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
              <SideContent close={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <div className="hidden xl:block">
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                {pageTitle}
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Healthcare Operating System
              </span>
            </div>
          </div>

          {/* Quick OPD Workflow Switcher Pills */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs font-bold shadow-2xs">
            <NavLink
              to="/reception"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`
              }
            >
              🛎️ Reception Desk
            </NavLink>
            <NavLink
              to="/consultation"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`
              }
            >
              🩺 Doctor Room
            </NavLink>
            <NavLink
              to="/reminders"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-teal-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`
              }
            >
              📅 Reminders
            </NavLink>
          </div>

          <div className="flex items-center gap-3">
            {/* SaaS Subscription Plan / Trial Badge */}
            <NavLink
              to="/subscription"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all shadow-2xs cursor-pointer ${
                sub.status === "TRIAL"
                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border-amber-300/80"
                  : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-900 border-blue-300/80"
              }`}
              title="Manage SaaS Subscription Plan, Seats & Invoices"
            >
              <Crown className={`w-3.5 h-3.5 ${sub.status === "TRIAL" ? "text-amber-600" : "text-blue-600"}`} />
              <span>
                {sub.status === "TRIAL"
                  ? `Pro Trial (${daysLeft}d left)`
                  : "Plan: Pro"}
              </span>
            </NavLink>

            <GlobalSearch />

            <button
              className="relative grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell size={16} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-orange-500 animate-pulse" />
            </button>

            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-tr from-[#071b4a] to-blue-950 text-xs font-black text-white shadow-xs">
                {initials}
              </span>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {identity?.user.fullName}
                </div>
                <div className="text-[10px] font-bold text-slate-400 capitalize">
                  {identity?.selectedRole?.replaceAll("_", " ") ??
                    "Platform admin"}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
