"use client";

import { useEffect, useState } from "react";
import { type OPDTicket, getStoredTickets } from "@/features/practice/opd-store";
import {
  Calendar,
  FileText,
  Mail,
  Phone,
  Plus,
  Search,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function PatientsPage() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setTickets(getStoredTickets());
  }, []);

  const filtered = tickets.filter(
    (t) =>
      t.patientName.toLowerCase().includes(search.toLowerCase()) ||
      t.patientId.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Patients Clinical Directory
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registered clinic patients, chronic condition profiles, and encounter history.
          </p>
        </div>

        <button
          onClick={() => {
            toast.info("Register New Patient modal");
          }}
          className="btn-primary text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Register Patient
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-900">
              Patient Registry
            </span>
            <span className="badge badge-zinc font-mono text-[11px]">
              {filtered.length} Patients
            </span>
          </div>

          <span className="text-xs text-zinc-400 font-mono">
            Philippine Health Privacy Compliant
          </span>
        </div>

        <div className="p-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search patient name, ID, or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-zinc-900 outline-none w-full"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th className="table-header">Patient ID</th>
                <th className="table-header">Full Name</th>
                <th className="table-header">Demographics</th>
                <th className="table-header">Contact (+63)</th>
                <th className="table-header">Last Diagnosis</th>
                <th className="table-header">Blood Group</th>
                <th className="table-header text-right">Records</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="table-cell font-mono font-bold text-zinc-600">
                    {p.patientId}
                  </td>
                  <td className="table-cell font-semibold text-zinc-900">
                    {p.patientName}
                  </td>
                  <td className="table-cell text-zinc-600">
                    {p.age} yrs · {p.gender}
                  </td>
                  <td className="table-cell font-mono text-zinc-700">
                    {p.phone}
                  </td>
                  <td className="table-cell text-zinc-600">
                    {p.diagnosis || p.complaints}
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-zinc font-mono">{p.bloodGroup}</span>
                  </td>
                  <td className="table-cell text-right">
                    <button
                      onClick={() => toast.info(`Viewing records for ${p.patientName}`)}
                      className="btn-secondary text-[11px] py-1 px-2"
                    >
                      <FileText className="w-3 h-3" /> Chart
                    </button>
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
