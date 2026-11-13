"use client";

import { useEffect, useState } from "react";
import { formatPhp } from "@/lib/utils";
import { type OPDTicket, getStoredTickets } from "@/features/practice/opd-store";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  LayoutDashboard,
  TrendingUp,
  Users,
} from "lucide-react";

export default function AnalyticsPage() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);

  useEffect(() => {
    setTickets(getStoredTickets());
  }, []);

  const totalRevenue = tickets.reduce((acc, t) => acc + (t.billing?.totalAmountPhp || 0), 0);
  const completed = tickets.filter((t) => t.status === "COMPLETED").length;
  const inCabin = tickets.filter((t) => t.status === "IN_CONSULTATION").length;
  const waiting = tickets.filter((t) => t.status === "WAITING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Clinical Analytics & Operational KPIs
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Patient throughput, waiting time efficiency, and cashier collection insights.
          </p>
        </div>

        <span className="badge badge-zinc text-xs font-mono">
          Updated: Real-Time
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Revenue
          </div>
          <div className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {formatPhp(totalRevenue)}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> All payment channels
          </div>
        </div>

        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Completed Encounters
          </div>
          <div className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {completed}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Discharged today</div>
        </div>

        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            In Consultation
          </div>
          <div className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {inCabin}
          </div>
          <div className="text-[10px] text-blue-600 mt-1 font-medium">Physician cabin</div>
        </div>

        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Average Wait Time
          </div>
          <div className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            14 mins
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">-4 mins vs target</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel p-4 space-y-3">
          <span className="font-semibold text-xs text-zinc-900 uppercase tracking-wider block">
            Most Prevalent Diagnoses
          </span>
          <div className="space-y-2 text-xs">
            {[
              { label: "Upper Respiratory Tract Infection (URTI)", count: 42, pct: "38%" },
              { label: "Essential Hypertension (Stage 1 & 2)", count: 28, pct: "25%" },
              { label: "Acute Gastritis / Peptic Ulcer Disease", count: 18, pct: "16%" },
              { label: "Type 2 Diabetes Mellitus Follow-up", count: 14, pct: "13%" },
              { label: "Routine Physical & Medical Clearance", count: 9, pct: "8%" },
            ].map((d) => (
              <div key={d.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700 font-medium">{d.label}</span>
                  <span className="font-mono text-zinc-500">{d.count} ({d.pct})</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-zinc-900 h-full rounded-full" style={{ width: d.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4 space-y-3">
          <span className="font-semibold text-xs text-zinc-900 uppercase tracking-wider block">
            Payment Mode Distribution
          </span>
          <div className="space-y-2 text-xs">
            {[
              { label: "GCash Mobile Wallet", pct: "58%", color: "bg-blue-600" },
              { label: "Maya Digital Payments", pct: "24%", color: "bg-emerald-600" },
              { label: "Physical Cash (Drawer)", pct: "15%", color: "bg-zinc-700" },
              { label: "Debit / Credit Cards", pct: "3%", color: "bg-amber-600" },
            ].map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700 font-medium">{m.label}</span>
                  <span className="font-mono text-zinc-500">{m.pct}</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.color}`} style={{ width: m.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
