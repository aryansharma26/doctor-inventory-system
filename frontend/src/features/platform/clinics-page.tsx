import { useQuery } from "@tanstack/react-query";
import { Building2, MoreHorizontal, Plus, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { extendTrialDays } from "../subscription/saas-subscription-store";

type Clinic = {
  id: string;
  code: string;
  name: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  _count: { users: number; medicines: number; suppliers: number };
  subscription?: { plan: string; status: string };
};
export function ClinicsPage() {
  const { data = [] } = useQuery({
    queryKey: ["clinics"],
    queryFn: () => api<Clinic[]>("/clinics?page=1&pageSize=50"),
  });
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="label">Tenant administration</div>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-.035em]">
            Clinics
          </h2>
          <p className="mt-1 text-sm text-[#71807c]">
            Provision, suspend, support, and monitor every tenant.
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={15} />
          Create clinic
        </button>
      </div>
      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line p-4">
          <label className="flex h-10 max-w-sm items-center gap-2 rounded-xl border border-line px-3">
            <span className="sr-only">Search clinics</span>
            <Search size={15} className="text-[#84908c]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              placeholder="Search clinics…"
            />
          </label>
        </div>
        <div className="divide-y divide-line">
          {data.length ? (
            data.map((clinic) => (
              <div
                key={clinic.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 md:grid-cols-[1.5fr_.8fr_.8fr_.8fr_auto]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-paper text-pine">
                    <Building2 size={17} />
                  </span>
                  <div>
                    <div className="text-xs font-bold">{clinic.name}</div>
                    <div className="mt-1 text-[10px] text-[#82908b]">
                      {clinic.code} · {clinic.email}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="flex flex-col gap-1">
                    <StatusBadge
                      tone={
                        clinic.status === "ACTIVE"
                          ? "healthy"
                          : clinic.status === "SUSPENDED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {clinic.status}
                    </StatusBadge>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 w-fit">
                      {clinic.subscription?.plan?.toUpperCase() || "PRO TRIAL"}
                    </span>
                  </div>
                </div>
                <div className="hidden text-xs md:block">
                  <b>{clinic._count.users}</b> users
                </div>
                <div className="hidden text-xs md:block">
                  <b>{clinic._count.medicines}</b> medicines
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      extendTrialDays(14);
                      toast.success(`Extended 14-day trial for ${clinic.name}!`);
                    }}
                    className="hidden sm:inline-flex px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
                    title="Add 14 days to clinic trial"
                  >
                    +14d Trial
                  </button>
                  <button className="grid size-8 place-items-center rounded-lg hover:bg-paper cursor-pointer">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-[#82908b]">
              No clinics have been provisioned.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
