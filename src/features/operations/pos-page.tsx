"use client";

import { useEffect, useState } from "react";
import { formatPhp } from "@/lib/utils";
import {
  type OPDTicket,
  getStoredTickets,
} from "@/features/practice/opd-store";
import {
  Coins,
  CreditCard,
  Download,
  Filter,
  Printer,
  QrCode,
  Receipt,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export function PosPage() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  useEffect(() => {
    setTickets(getStoredTickets());
  }, []);

  const billedTickets = tickets.filter((t) => t.billing);

  const filtered = billedTickets.filter((t) => {
    const matchesSearch =
      t.patientName.toLowerCase().includes(search.toLowerCase()) ||
      t.billing?.invoiceNo.toLowerCase().includes(search.toLowerCase());
    const matchesMethod =
      methodFilter === "ALL" || t.billing?.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalCollected = billedTickets.reduce(
    (acc, t) => acc + (t.billing?.totalAmountPhp || 0),
    0
  );
  const gcashTotal = billedTickets
    .filter((t) => t.billing?.paymentMethod === "GCASH")
    .reduce((acc, t) => acc + (t.billing?.totalAmountPhp || 0), 0);
  const mayaTotal = billedTickets
    .filter((t) => t.billing?.paymentMethod === "MAYA")
    .reduce((acc, t) => acc + (t.billing?.totalAmountPhp || 0), 0);
  const cashTotal = billedTickets
    .filter((t) => t.billing?.paymentMethod === "CASH")
    .reduce((acc, t) => acc + (t.billing?.totalAmountPhp || 0), 0);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Billing, POS & Official Receipts
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            BIR-compliant clinical receipts, GCash/Maya reconciliation, and cashier audit trail.
          </p>
        </div>

        <button
          onClick={() => {
            toast.info("Exporting Daily Cashier Audit Summary (CSV)");
          }}
          className="btn-secondary text-xs"
        >
          <Download className="w-3.5 h-3.5" /> Export Audit Log
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Revenue Today
          </div>
          <div className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {formatPhp(totalCollected)}
          </div>
        </div>

        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> GCash
          </div>
          <div className="text-lg font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {formatPhp(gcashTotal)}
          </div>
        </div>

        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Maya
          </div>
          <div className="text-lg font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {formatPhp(mayaTotal)}
          </div>
        </div>

        <div className="panel p-3.5">
          <div className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span> Cash Drawer
          </div>
          <div className="text-lg font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
            {formatPhp(cashTotal)}
          </div>
        </div>
      </div>

      {/* Receipts Table Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-900">
              Invoices & Payment Records
            </span>
            <span className="badge badge-zinc font-mono text-[11px]">
              {filtered.length} Invoices
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            {["ALL", "GCASH", "MAYA", "CASH"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors text-[11px] ${
                  methodFilter === m
                    ? "bg-zinc-900 text-white font-semibold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search invoice number or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-zinc-900 outline-none w-full"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header">Invoice No.</th>
                <th className="table-header">Patient</th>
                <th className="table-header">Consultation</th>
                <th className="table-header">Vitals</th>
                <th className="table-header">Total (₱)</th>
                <th className="table-header">Payment Mode</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const b = t.billing!;
                return (
                  <tr key={t.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="table-cell font-mono font-bold text-zinc-900">
                      {b.invoiceNo}
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold text-zinc-900">{t.patientName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{t.phone}</div>
                    </td>
                    <td className="table-cell font-mono text-xs text-zinc-700">
                      {formatPhp(b.consultationFeePhp)}
                    </td>
                    <td className="table-cell font-mono text-xs text-zinc-700">
                      {formatPhp(b.vitalsCheckFeePhp)}
                    </td>
                    <td className="table-cell font-mono font-bold text-xs text-zinc-950">
                      {formatPhp(b.totalAmountPhp)}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${
                          b.paymentMethod === "GCASH"
                            ? "badge-blue"
                            : b.paymentMethod === "MAYA"
                            ? "badge-green"
                            : "badge-zinc"
                        }`}
                      >
                        {b.paymentMethod}
                      </span>
                      {b.gcashRefNo && (
                        <span className="block text-[10px] font-mono text-zinc-400 mt-0.5">
                          Ref: {b.gcashRefNo}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-green">PAID</span>
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => {
                          toast.info(`Printing Official BIR Receipt: ${b.invoiceNo}`);
                          window.print();
                        }}
                        className="btn-secondary text-[11px] py-1 px-2"
                      >
                        <Printer className="w-3 h-3" /> Print O.R.
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
