"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronsUpDown, LayoutGrid, LogOut, Menu as MenuIcon, Search, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, IconButton, Kbd } from "./primitives";
import { Menu } from "./overlays";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
  exact?: boolean;
};
export type NavSection = { title?: string; items: NavItem[] };
export type ShellNotification = { id: string; title: string; body: string; time: string; unread?: boolean };

export type ShellConfig = {
  product: string;
  context: string;
  contextMeta?: string;
  accent: "brand" | "teal";
  sections: NavSection[];
  user: { name: string; role: string };
  searchPlaceholder?: string;
  /** Route that the global search submits to; receives ?q= */
  searchHref?: string;
};

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function Brand({ config }: { config: ShellConfig }) {
  return (
    <div className="flex h-14 items-center gap-2.5 px-4">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-[8px] text-white",
          config.accent === "teal" ? "bg-teal-600" : "bg-brand-600",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13px] font-semibold text-ink">{config.product}</p>
        <p className="truncate text-[11px] text-ink-subtle">{config.context}</p>
      </div>
    </div>
  );
}

function SidebarNav({ config, onNavigate }: { config: ShellConfig; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="ds-scroll flex-1 overflow-y-auto px-2.5 pb-4">
      {config.sections.map((section, si) => (
        <div key={si} className={cn(si > 0 && "mt-5")}>
          {section.title && (
            <p className="mb-1 px-2.5 text-[11px] font-medium tracking-wide text-ink-subtle uppercase">
              {section.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-8 items-center gap-2.5 rounded-[7px] px-2.5 text-[13px] transition-colors",
                      active
                        ? "bg-ink/[0.06] font-medium text-ink"
                        : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
                    )}
                  >
                    <span
                      className={cn(
                        "[&_svg]:size-4",
                        active
                          ? config.accent === "teal"
                            ? "text-teal-600"
                            : "text-brand-600"
                          : "text-ink-subtle group-hover:text-ink-muted",
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="tnum ml-auto rounded-full bg-brand-50 px-1.5 text-[11px] font-medium text-brand-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserCard({ config }: { config: ShellConfig }) {
  const router = useRouter();
  return (
    <div className="border-t border-line p-2.5">
      <Menu
        align="start"
        items={[
          { label: "My profile", icon: <UserRound />, onSelect: () => router.push(config.sections[0]!.items[0]!.href) },
          { label: "Switch workspace", icon: <LayoutGrid />, onSelect: () => router.push("/design") },
          "divider",
          { label: "Sign out", icon: <LogOut />, onSelect: () => router.push("/design"), tone: "danger" },
        ]}
        trigger={(p) => (
          <button
            type="button"
            {...p}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left transition-colors hover:bg-ink/[0.04]"
          >
            <Avatar name={config.user.name} size="sm" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-medium text-ink">{config.user.name}</span>
              <span className="block truncate text-[11px] text-ink-subtle">{config.user.role}</span>
            </span>
            <ChevronsUpDown className="size-3.5 text-ink-subtle" />
          </button>
        )}
      />
    </div>
  );
}

function Notifications({ items }: { items: ShellNotification[] }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const unread = items.filter((n) => n.unread && !read.has(n.id)).length;
  return (
    <div ref={ref} className="relative">
      <IconButton label="Notifications" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-danger-600 ring-2 ring-surface" />
        )}
      </IconButton>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-[min(360px,calc(100vw-24px))] animate-pop-in rounded-[12px] border border-line bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
              onClick={() => setRead(new Set(items.map((i) => i.id)))}
            >
              Mark all read
            </button>
          </div>
          <ul className="ds-scroll max-h-96 divide-y divide-line overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-ink-muted">You’re all caught up.</li>}
            {items.map((n) => {
              const isUnread = n.unread && !read.has(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setRead((s) => new Set(s).add(n.id))}
                    className="flex w-full gap-3 px-4 py-3 text-left hover:bg-subtle"
                  >
                    <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", isUnread ? "bg-brand-500" : "bg-transparent")} />
                    <span className="min-w-0">
                      <span className={cn("block text-[13px]", isUnread ? "font-semibold text-ink" : "text-ink")}>{n.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-muted">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-ink-subtle">{n.time}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function GlobalSearch({ config }: { config: ShellConfig }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  if (!config.searchHref) return <div className="flex-1" />;
  return (
    <form
      role="search"
      className="relative hidden max-w-md flex-1 md:block"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`${config.searchHref}?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={config.searchPlaceholder ?? "Search"}
        aria-label={config.searchPlaceholder ?? "Search"}
        className="h-9 w-full rounded-control border border-transparent bg-ink/[0.04] pr-12 pl-9 text-[13px] outline-none transition-colors placeholder:text-ink-subtle focus:border-brand-500 focus:bg-surface focus:shadow-focus"
      />
      <span className="absolute top-1/2 right-2 flex -translate-y-1/2 gap-0.5">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </span>
    </form>
  );
}

export function AppShell({
  config,
  notifications = [],
  topbarActions,
  children,
}: {
  config: ShellConfig;
  notifications?: ShellNotification[];
  topbarActions?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="ds-root min-h-screen bg-canvas">
      <a href="#main" className="fixed -top-20 left-2 z-[200] rounded bg-surface px-3 py-2 shadow-pop focus:top-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <Brand config={config} />
        <SidebarNav config={config} />
        <UserCard config={config} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] animate-slide-in flex-col bg-surface shadow-pop">
            <div className="flex items-center justify-between pr-2">
              <Brand config={config} />
              <IconButton label="Close menu" onClick={() => setMobileOpen(false)}>
                <X className="size-4" />
              </IconButton>
            </div>
            <SidebarNav config={config} onNavigate={() => setMobileOpen(false)} />
            <UserCard config={config} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6">
          <IconButton label="Open menu" className="-ml-1.5 lg:hidden" onClick={() => setMobileOpen(true)}>
            <MenuIcon className="size-5" />
          </IconButton>
          <div className="min-w-0 lg:hidden">
            <p className="truncate text-[13px] font-semibold">{config.context}</p>
          </div>
          {config.contextMeta && (
            <span className="hidden text-[13px] text-ink-muted xl:inline">{config.contextMeta}</span>
          )}
          <div className="flex flex-1 justify-center">
            <GlobalSearch config={config} />
          </div>
          <div className="flex items-center gap-1.5">
            {topbarActions}
            <Notifications items={notifications} />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
