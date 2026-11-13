"use client";

import { useEffect, useState } from "react";
import { formatPhp } from "@/lib/utils";
import {
  type ClinicSubscription,
  extendTrialDays,
  SAAS_PLANS,
} from "@/features/subscription/saas-subscription-store";
import {
  Activity,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface TenantSummary {
  id: string;
  name: string;
  code: string;
  doctorName: string;
  planId: string;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE";
  trialDaysLeft: number;
  patientsCount: number;
  monthlyRevenuePhp: number;
}

const DEMO_TENANTS: TenantSummary[] = [
  {
    id: "clinic-st-jude",
    name: "St. Jude Family Health Clinic",
    code: "ST-JUDE",
    doctorName: "Dr. Jose Rizal, MD",
    planId: "growth",
    status: "TRIAL",
    trialDaysLeft: 14,
    patientsCount: 142,
    monthlyRevenuePhp: 3499,
  },
  {
    id: "clinic-metro-manila",
    name: "Metro Manila Polyclinic & Diagnostic",
    code: "METRO-POLY",
    doctorName: "Dr. Maria Santos, MD",
    planId: "enterprise",
    status: "ACTIVE",
    trialDaysLeft: 0,
    patientsCount: 680,
    monthlyRevenuePhp: 7999,
  },
  {
    id: "clinic-cebu-care",
    name: "Cebu Prime Health Center",
    code: "CEBU-PRIME",
    doctorName: "Dr. Emilio Aguinaldo, MD",
    planId: "starter",
    status: "ACTIVE",
    trialDaysLeft: 0,
    patientsCount: 88,
    monthlyRevenuePhp: 1499,
  },
  {
    id: "clinic-davao-maternal",
    name: "Davao Maternal & Pediatric Center",
    code: "DAVAO-MED",
    doctorName: "Dr. Gabriela Silang, MD",
    planId: "growth",
    status: "ACTIVE",
    trialDaysLeft: 0,
    patientsCount: 290,
    monthlyRevenuePhp: 3499,
  },
];

export function PlatformDashboard() {
  const [tenants, setTenants] = useState<TenantSummary[]>(DEMO_TENANTS);
  const [search, setSearch] = useState("");

  const totalMRR = tenants.reduce((acc, t) => acc + t.monthlyRevenuePhp, 0);
  const totalARR = totalMRR * 12;
  const activeTenantsCount = tenants.length;
  const activeTrialsCount = tenants.filter((t) => t.status === "TRIAL").length;

  const handleExtendTrial = (id: string, name: string) => {
    extendTrialDays(14);
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, trialDaysLeft: t.trialDaysLeft + 14 } : t))
    );
    toast.success(`Extended 14 days trial for ${name}!`);
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-zinc text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" /> Super Admin
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-xs text-zinc-500 font-mono">Platform v2.0 Next.js</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 mt-1">
            Platform Command Center & Multi-Tenancy
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time SaaS billing metrics, tenant clinics management, and trial provisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              toast.info("Syncing platform subscription webhooks");
            }}
            className="btn-secondary text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Sync Subscriptions
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Monthly Recurring (MRR)
          </div>
          <div className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {formatPhp(totalMRR)}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% vs last mo
          </div>
        </div>

        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Annual Recurring (ARR)
          </div>
          <div className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {formatPhp(totalARR)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Projected run-rate</div>
        </div>

        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Active Tenant Clinics
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {activeTenantsCount}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">All Philippine branches</div>
        </div>

        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Active 14-Day Trials
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-700 mt-0.5 font-mono">
            {activeTrialsCount}
          </div>
          <div className="text-[10px] text-amber-600 mt-1 font-medium">Free Pro Trials</div>
        </div>
      </div>

      {/* Tenant Clinics Management Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-900">
              Registered Tenant Clinics
            </span>
            <span className="badge badge-zinc font-mono text-[11px]">
              {filtered.length} Clinics
            </span>
          </div>

          <span className="text-xs text-zinc-500 font-mono">
            Multi-Tenant Database Isolation
          </span>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search tenant by clinic name, code, or lead doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-zinc-900 outline-none w-full"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th className="table-header">Clinic Name & Branch</th>
                <th className="table-header">Code</th>
                <th className="table-header">Lead Physician</th>
                <th className="table-header">SaaS Plan</th>
                <th className="table-header">Status</th>
                <th className="table-header">Monthly Rev</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="table-cell">
                    <div className="font-semibold text-zinc-900">{tenant.name}</div>
                    <div className="text-[11px] text-zinc-400">
                      {tenant.patientsCount} active patients
                    </div>
                  </td>
                  <td className="table-cell font-mono text-zinc-600 font-bold">
                    {tenant.code}
                  </td>
                  <td className="table-cell text-zinc-800">
                    {tenant.doctorName}
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-zinc uppercase font-semibold">
                      {tenant.planId}
                    </span>
                  </td>
                  <td className="table-cell">
                    {tenant.status === "TRIAL" ? (
                      <span className="badge badge-amber font-mono text-[11px]">
                        Trial ({tenant.trialDaysLeft}d left)
                      </span>
                    ) : (
                      <span className="badge badge-green text-[11px]">Active</span>
                    )}
                  </td>
                  <td className="table-cell font-mono font-bold text-zinc-900">
                    {formatPhp(tenant.monthlyRevenuePhp)}/mo
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleExtendTrial(tenant.id, tenant.name)}
                        className="btn-secondary text-[11px] py-1 px-2 text-blue-700"
                        title="Extend Free Trial by +14 Days"
                      >
                        +14d Trial
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
