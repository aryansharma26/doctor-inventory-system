"use client";

import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton, Skeleton } from "./primitives";

/* --------------------------------------------------------------- Stat tile */

export function StatCard({
  label,
  value,
  delta,
  deltaLabel = "vs last week",
  icon,
  footnote,
  loading,
  invertDelta,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  deltaLabel?: string;
  icon?: ReactNode;
  footnote?: ReactNode;
  loading?: boolean;
  /** For metrics where going down is good (e.g. wait time). */
  invertDelta?: boolean;
}) {
  const good = delta === undefined ? undefined : invertDelta ? delta <= 0 : delta >= 0;
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        {icon && <span className="text-ink-subtle [&_svg]:size-4">{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-20" />
      ) : (
        <p className="tnum mt-2 text-[26px] leading-tight font-semibold tracking-tight text-ink">{value}</p>
      )}
      <div className="mt-1.5 flex min-h-5 items-center gap-1.5 text-xs">
        {delta !== undefined && !loading && (
          <span
            className={cn(
              "tnum inline-flex items-center gap-0.5 font-medium",
              good ? "text-success-700" : "text-danger-700",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
        {delta !== undefined && !loading && <span className="text-ink-subtle">{deltaLabel}</span>}
        {footnote && !loading && <span className="text-ink-subtle">{footnote}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Table */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("ds-scroll w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-y border-line bg-subtle text-xs font-medium text-ink-muted">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cn("h-9 px-4 font-medium whitespace-nowrap first:pl-5 last:pr-5", className)} {...rest}>
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function Tr({
  children,
  onClick,
  className,
  selected,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition-colors",
        onClick && "cursor-pointer hover:bg-subtle",
        selected && "bg-brand-50/60",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Td({ className, children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("h-14 px-4 align-middle first:pl-5 last:pr-5", className)} {...rest}>
      {children}
    </td>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-2.5 text-[13px] text-ink-muted">
      <span className="tnum">
        {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <IconButton label="Previous page" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} className="disabled:opacity-30">
          <ChevronLeft className="size-4" />
        </IconButton>
        <span className="tnum px-1">
          {page} / {pages}
        </span>
        <IconButton label="Next page" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} className="disabled:opacity-30">
          <ChevronRight className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Page title */

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-2 text-[13px] text-ink-muted">{breadcrumb}</div>}
        <h1 className="text-[22px] leading-tight font-semibold text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      {children}
    </div>
  );
}

export function KeyValue({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-2 text-sm", className)}>
      <span className="text-ink-muted">{label}</span>
      <span className="tnum text-right font-medium text-ink">{value}</span>
    </div>
  );
}
