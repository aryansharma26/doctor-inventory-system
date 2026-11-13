import { useQuery } from "@tanstack/react-query";
import { Download, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiEnvelope, downloadApi } from "@/lib/api";

type AuditRow = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  requestId: string | null;
  actor: { fullName: string; email: string } | null;
};

export function AuditPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["audit", search],
    queryFn: () =>
      apiEnvelope<AuditRow[]>(
        `/audit-logs?page=1&pageSize=50&search=${encodeURIComponent(search)}`,
      ),
  });
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="label">Governance</div>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-.035em]">
            Audit trail
          </h2>
          <p className="mt-1 text-sm text-[#71807c]">
            Immutable security, inventory, user, and support-access events.
          </p>
        </div>
        <button
          onClick={() =>
            void downloadApi("/audit-logs/export")
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `medistock-audit-${new Date().toISOString().slice(0, 10)}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              })
              .catch(() => toast.error("Audit export failed"))
          }
          className="btn-secondary"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>
      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line p-4">
          <label className="flex h-10 max-w-sm items-center gap-2 rounded-xl border border-line px-3">
            <span className="sr-only">Search audit logs</span>
            <Search size={15} className="text-[#84908c]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              placeholder="Search action or entity…"
            />
          </label>
        </div>
        <div className="divide-y divide-line">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-[#82908b]">
              Loading audit history…
            </div>
          ) : data?.data.length ? (
            data.data.map((row) => (
              <div key={row.id} className="flex items-start gap-3 px-5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f2ed] text-pine">
                  <ShieldCheck size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">{row.action}</div>
                  <div className="mt-1 text-[10px] text-[#71807c]">
                    {row.entityType}
                    {row.entityId ? ` · ${row.entityId}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold">
                    {row.actor?.fullName ?? "System"}
                  </div>
                  <time className="mt-1 block text-[10px] text-[#82908b]">
                    {new Date(row.createdAt).toLocaleString("en-PH")}
                  </time>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-[#82908b]">
              No audit events match this view.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
