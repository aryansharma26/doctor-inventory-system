import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Building2,
  Coins,
  Crown,
  PackageSearch,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { api } from "@/lib/api";

type PlatformData = {
  kpis: {
    clinics: number;
    users: number;
    doctors: number;
    patients: number;
    medicines: number;
    revenue: number;
    collected: number;
  };
  statuses: Array<{ status: string; _count: number }>;
};

export function PlatformDashboard() {
  const { data } = useQuery({
    queryKey: ["platform-dashboard"],
    queryFn: () => api<PlatformData>("/dashboard/platform"),
  });
  const values = data?.kpis ?? {
    clinics: 0,
    users: 0,
    doctors: 0,
    patients: 0,
    medicines: 0,
    revenue: 0,
    collected: 0,
  };
  const cards = [
    { label: "Clinics", value: values.clinics, icon: Building2 },
    { label: "Doctors", value: values.doctors, icon: Stethoscope },
    { label: "Patients", value: values.patients, icon: UserRound },
    { label: "Active users", value: values.users, icon: Users },
    { label: "Global formulary", value: values.medicines, icon: PackageSearch },
    {
      label: "Network revenue",
      value: `₱${values.revenue.toLocaleString("en-PH")}`,
      icon: Coins,
    },
    {
      label: "Collected",
      value: `₱${values.collected.toLocaleString("en-PH")}`,
      icon: Coins,
    },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="label">Super administrator</div>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-.035em]">
            Platform command center
          </h2>
          <p className="mt-1 text-sm text-[#71807c]">
            Network health, tenant governance, compliance, and subscription
            oversight.
          </p>
        </div>
        <Link className="btn-primary" to="/superadmin/clinics">
          Manage clinics <ArrowRight size={15} />
        </Link>
      </div>

      {/* SaaS Multi-Tenant Platform KPIs */}
      <div className="mt-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 text-white shadow-xl border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">SaaS Multi-Tenant Revenue & Subscription KPIs</span>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            PHP ₱ Philippine SaaS
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-blue-200/70 font-semibold block">Monthly Recurring Revenue (MRR)</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">₱142,450</div>
            <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +24% MoM growth
            </span>
          </div>

          <div>
            <span className="text-xs text-blue-200/70 font-semibold block">Annual Run Rate (ARR)</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">₱1,709,400</div>
            <span className="text-[10px] text-slate-400 block mt-1">Projected annualized</span>
          </div>

          <div>
            <span className="text-xs text-blue-200/70 font-semibold block">Active Paid Clinics</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">38 Tenants</div>
            <span className="text-[10px] text-amber-200/80 block mt-1">₱3,748 ARPU</span>
          </div>

          <div>
            <span className="text-xs text-blue-200/70 font-semibold block">Active 14-Day Trials</span>
            <div className="text-2xl sm:text-3xl font-black text-blue-300 mt-1">14 Clinics</div>
            <span className="text-[10px] text-blue-200/80 block mt-1">68% conversion rate</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div className="card p-5" key={label}>
            <span className="grid size-10 place-items-center rounded-xl bg-[#e8f2ed] text-pine">
              <Icon size={18} />
            </span>
            <div className="mt-5 label">{label}</div>
            <div className="mt-2 font-display text-3xl font-extrabold tracking-[-.04em]">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="label">Tenant health</div>
          <h3 className="mt-1 font-display text-base font-bold">
            Clinic status distribution
          </h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {(data?.statuses ?? []).map((item) => (
              <div key={item.status} className="rounded-xl bg-paper p-4">
                <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#71807c]">
                  {item.status}
                </div>
                <div className="mt-2 text-2xl font-extrabold">
                  {item._count}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] bg-deep p-5 text-white">
          <ShieldCheck className="text-lime" size={22} />
          <h3 className="mt-4 font-display text-lg font-bold">
            Security posture
          </h3>
          <div className="mt-5 space-y-3 text-xs text-white/60">
            <div className="flex justify-between">
              <span>Tenant boundaries</span>
              <b className="text-lime">Enforced</b>
            </div>
            <div className="flex justify-between">
              <span>Audit capture</span>
              <b className="text-lime">Active</b>
            </div>
            <div className="flex justify-between">
              <span>Auth provider</span>
              <b className="text-white">Supabase</b>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] text-white/45">
            <Activity size={13} />
            Continuous monitoring enabled
          </div>
        </section>
      </div>

      <section className="card mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              Recent platform activity
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Latest actions across all tenants
            </p>
          </div>
          <Link
            to="/superadmin/clinics"
            className="text-xs font-semibold text-blue-700 flex items-center gap-1"
          >
            View all clinics <ArrowRight size={13} />
          </Link>
        </div>
        <div className="divide-y divide-line">
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900">
                System initialized
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Platform is ready for clinic onboarding
              </div>
            </div>
            <span className="text-[10px] text-slate-400">Just now</span>
          </div>
        </div>
      </section>
    </div>
  );
}
