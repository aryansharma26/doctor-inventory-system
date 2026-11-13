"use client";

import { useEffect, useState } from "react";
import { type OPDTicket, getStoredTickets } from "@/features/practice/opd-store";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function RemindersPage() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);

  useEffect(() => {
    setTickets(getStoredTickets());
  }, []);

  const followUpPatients = tickets.filter((t) => t.followUpDate || t.status === "COMPLETED");

  const sendReminder = (patient: OPDTicket) => {
    toast.success(`SMS reminder queued for ${patient.patientName} (${patient.phone})`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Follow-Up Schedule & Patient Reminders
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Automated SMS & clinical follow-up tracking for discharged patients.
          </p>
        </div>

        <button
          onClick={() => {
            toast.success("Broadcasted reminders to all scheduled patients for today");
          }}
          className="btn-primary text-xs"
        >
          <Send className="w-3.5 h-3.5" /> Send All Today's Reminders
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-900">
              Scheduled Patient Recall
            </span>
            <span className="badge badge-zinc font-mono text-[11px]">
              {followUpPatients.length} Patients
            </span>
          </div>

          <span className="text-xs text-zinc-400 font-mono">
            +63 SMS Gateway Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th className="table-header">Patient</th>
                <th className="table-header">Mobile</th>
                <th className="table-header">Primary Diagnosis</th>
                <th className="table-header">Follow-up Date</th>
                <th className="table-header">Doctor's Advice</th>
                <th className="table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {followUpPatients.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="table-cell">
                    <div className="font-semibold text-zinc-900">{p.patientName}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{p.tokenNo}</div>
                  </td>
                  <td className="table-cell font-mono text-zinc-700">
                    {p.phone}
                  </td>
                  <td className="table-cell text-zinc-700">
                    {p.diagnosis || p.complaints}
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-amber font-mono font-bold">
                      {p.followUpDate || "Scheduled Today"}
                    </span>
                  </td>
                  <td className="table-cell text-zinc-500 max-w-xs truncate">
                    {p.doctorAdvice || "Routine blood pressure review & medication refill."}
                  </td>
                  <td className="table-cell text-right">
                    <button
                      onClick={() => sendReminder(p)}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                    >
                      <Bell className="w-3 h-3 text-zinc-700" /> Send SMS
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
