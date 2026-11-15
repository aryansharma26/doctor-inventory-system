"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Pill,
  Stethoscope,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { useState } from "react";
import { HospitalProvider, useHospital } from "@/features/hospital/provider";
import {
  ROLE_HOME,
  ROLE_LABELS,
  canAcknowledge,
} from "@/features/hospital/types";
import { MessageAudio } from "@/features/hospital/messages";
const links = [
  {
    href: "/",
    label: "Hospital overview",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    href: "/reception",
    label: "Reception desk",
    icon: ClipboardList,
    roles: ["ADMIN", "RECEPTION"],
  },
  {
    href: "/consultation",
    label: "Doctor's desk",
    icon: Stethoscope,
    roles: ["ADMIN", "DOCTOR"],
  },
  {
    href: "/queue",
    label: "Patient queue",
    icon: Users,
    roles: ["ADMIN", "RECEPTION", "DOCTOR"],
  },
  {
    href: "/appointments",
    label: "Appointments",
    icon: CalendarDays,
    roles: ["ADMIN", "RECEPTION", "DOCTOR"],
  },
  {
    href: "/patients",
    label: "Patient records",
    icon: Users,
    roles: ["ADMIN", "RECEPTION"],
  },
  {
    href: "/pos",
    label: "Consultation payments",
    icon: CreditCard,
    roles: ["ADMIN", "RECEPTION"],
  },
  {
    href: "/pharmacy",
    label: "Pharmacy counter",
    icon: Pill,
    roles: ["ADMIN", "PHARMACY"],
  },
  {
    href: "/inventory",
    label: "Medicine stock",
    icon: Package,
    roles: ["ADMIN", "PHARMACY"],
  },
  {
    href: "/messages",
    label: "Team messages",
    icon: MessageSquare,
    roles: ["ADMIN", "RECEPTION", "DOCTOR", "PHARMACY"],
  },
];
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Activity size={23} />
      </span>
      <span>MediStock.</span>
    </span>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { staff, role, demo, loading, error, refresh, messages, signOut } =
    useHospital();
  const [mobile, setMobile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const active = links.find((l) => l.href === path);
  const allowed = active
    ? !!role && active.roles.includes(role)
    : (path === "/reminders" &&
        ["ADMIN", "RECEPTION", "DOCTOR"].includes(role || "")) ||
      (path === "/analytics" && role === "ADMIN");
  const unread = messages.filter(
    (m) =>
      staff &&
      canAcknowledge(m, staff) &&
      m.senderId !== staff?.id &&
      !m.readBy.includes(staff?.id || "") &&
      m.recipient !== "LOBBY",
  ).length;
  return (
    <div className="hospital-app staff-workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`app-sidebar ${mobile ? "sidebar-open" : ""}`}>
        <Link
          className="sidebar-brand"
          href={role ? ROLE_HOME[role] : "/login"}
        >
          <Brand />
        </Link>
        <div className="staff-hospital">
          <strong>Harmony Hospital</strong>
          <span>Hisar · {role ? ROLE_LABELS[role] : "Staff workspace"}</span>
        </div>
        <nav aria-label="Main navigation">
          {links
            .filter((l) => role && l.roles.includes(role))
            .map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className={`nav-item ${path === item.href ? "nav-active" : ""}`}
                aria-current={path === item.href ? "page" : undefined}
                onClick={() => setMobile(false)}
              >
                <item.icon size={19} />
                <span>{item.label}</span>
                {item.href === "/messages" && unread > 0 && (
                  <span className="nav-count">{unread}</span>
                )}
              </Link>
            ))}
        </nav>
        <div className="staff-sidebar-bottom">
          <span className={`live-indicator ${error ? "text-amber" : ""}`}>
            <i />
            {error ? "Connection interrupted" : "Hospital connected"}
          </span>
          {demo && <span className="sample-label">SAMPLE DATA</span>}
        </div>
      </aside>
      <div className="app-workspace">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X size={22} /> : <Menu size={22} />}
            </button>
            <strong className="workspace-title">
              {active?.label || "Hospital workspace"}
            </strong>
          </div>
          <div className="topbar-right">
            <MessageAudio />
            <Link
              className="header-messages"
              href="/messages"
              aria-label={`Team messages, ${unread} unread`}
            >
              <MessageSquare size={20} />
              {unread > 0 && <span>{unread}</span>}
            </Link>
            <div className="staff-profile">
              <span className="staff-avatar">
                {staff?.name
                  .replace("Dr. ", "")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <strong>{staff?.name || "Staff"}</strong>
                <span className="profile-subtitle">{staff?.username}</span>
              </div>
            </div>
            <button
              className="icon-button staff-logout"
              aria-label="Sign out"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                try {
                  await signOut();
                } catch {
                  setSigningOut(false);
                }
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="main-content" className="workspace-content">
          {error && (
            <div className="connection-error" role="alert">
              {error}
              <button onClick={() => void refresh()}>Retry</button>
            </div>
          )}
          {loading || !staff ? (
            <div className="workspace-loading">
              <span className="loading-spinner" />
              Loading your department…
            </div>
          ) : allowed ? (
            children
          ) : (
            <div className="empty-state">
              <h2>This page belongs to another department.</h2>
              <Link className="button primary" href={ROLE_HOME[staff.role]}>
                Open my workspace
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <HospitalProvider>
      <Shell>{children}</Shell>
    </HospitalProvider>
  );
}
