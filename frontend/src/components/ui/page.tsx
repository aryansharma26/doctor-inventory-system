import { Search } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function TableToolbar({
  search,
  onSearch,
  count,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
      <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 sm:max-w-sm">
        <Search size={16} className="text-slate-400" />
        <span className="sr-only">Search</span>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </label>
      {children}
      <span className="ml-auto text-xs text-slate-500">
        {count ?? 0} records
      </span>
    </div>
  );
}

export function EmptyRows({
  columns,
  loading,
  label,
}: {
  columns: number;
  loading: boolean;
  label: string;
}) {
  return (
    <tr>
      <td colSpan={columns} className="h-48 text-center text-sm text-slate-500">
        {loading ? "Loading…" : label}
      </td>
    </tr>
  );
}
