"use client";

import { useEffect, useState } from "react";
import {
  type OPDTicket,
  getStoredTickets,
  updateTicketStatus,
} from "./opd-store";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  Stethoscope,
  Volume2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export function QueuePage() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);

  const reloadTickets = () => {
    setTickets(getStoredTickets());
  };

  useEffect(() => {
    reloadTickets();
    const handleUpdate = () => reloadTickets();
    window.addEventListener("opd-store-update", handleUpdate);
    return () => window.removeEventListener("opd-store-update", handleUpdate);
  }, []);

  const announcePatient = (ticket: OPDTicket) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = `Calling Token ${ticket.tokenNo}, ${ticket.patientName}. Please proceed to the Doctor's Cabin.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
      toast.info(`Announcing ${ticket.tokenNo} on speaker`);
    } else {
      toast.info(`Calling ${ticket.tokenNo} (${ticket.patientName})`);
    }
  };

  const waitingTickets = tickets.filter((t) => t.status === "WAITING");
  const inConsultTickets = tickets.filter((t) => t.status === "IN_CONSULTATION");
  const completedTickets = tickets.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            OPD Queue & Token Announcer
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time waiting room dispatch board with smart audio voice caller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={reloadTickets} className="btn-secondary text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Main 3-Column Queue Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Waiting Room (FIFO) */}
        <div className="panel flex flex-col">
          <div className="panel-header bg-amber-50/50">
            <span className="font-semibold text-xs text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Waiting in Lobby
            </span>
            <span className="badge badge-amber font-mono text-[11px]">
              {waitingTickets.length}
            </span>
          </div>

          <div className="p-3 space-y-2 flex-1">
            {waitingTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-400">
                Lobby queue is clear.
              </div>
            ) : (
              waitingTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded border border-zinc-200 bg-white hover:border-zinc-300 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-zinc-900 block">
                        {t.tokenNo}
                      </span>
                      <span className="text-xs font-semibold text-zinc-800">
                        {t.patientName}
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        {t.age}y · {t.gender}
                      </span>
                    </div>

                    <button
                      onClick={() => announcePatient(t)}
                      title="Audio Chime"
                      className="p-1.5 rounded text-zinc-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                    <span className="text-[11px] text-zinc-500 truncate max-w-[140px]">
                      {t.complaints}
                    </span>
                    <button
                      onClick={() => updateTicketStatus(t.id, "IN_CONSULTATION")}
                      className="btn-primary text-[11px] py-1 px-2.5"
                    >
                      Call In <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Doctor Cabin */}
        <div className="panel flex flex-col">
          <div className="panel-header bg-blue-50/50">
            <span className="font-semibold text-xs text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> In Consultation
            </span>
            <span className="badge badge-blue font-mono text-[11px]">
              {inConsultTickets.length}
            </span>
          </div>

          <div className="p-3 space-y-2 flex-1">
            {inConsultTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-400">
                Doctor's cabin is currently unoccupied.
              </div>
            ) : (
              inConsultTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded border border-blue-200 bg-blue-50/30 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-blue-950 block">
                        {t.tokenNo}
                      </span>
                      <span className="text-xs font-semibold text-zinc-900">
                        {t.patientName}
                      </span>
                      <span className="text-[11px] text-zinc-500 block">
                        BP: {t.vitals.systolicBp}/{t.vitals.diastolicBp} · SpO2: {t.vitals.spO2}%
                      </span>
                    </div>

                    <button
                      onClick={() => announcePatient(t)}
                      className="p-1.5 rounded text-blue-600 hover:bg-blue-100 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-blue-100">
                    <button
                      onClick={() => updateTicketStatus(t.id, "COMPLETED")}
                      className="btn-secondary text-emerald-700 text-[11px] py-1 px-2.5"
                    >
                      Mark Finished <CheckCircle2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Recently Completed */}
        <div className="panel flex flex-col">
          <div className="panel-header bg-emerald-50/50">
            <span className="font-semibold text-xs text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Discharged / Completed
            </span>
            <span className="badge badge-green font-mono text-[11px]">
              {completedTickets.length}
            </span>
          </div>

          <div className="p-3 space-y-2 flex-1 max-h-[600px] overflow-y-auto">
            {completedTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-400">
                No completed encounters yet.
              </div>
            ) : (
              completedTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded border border-zinc-100 bg-zinc-50/60 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-zinc-800">
                      {t.tokenNo}
                    </span>
                    <span className="text-zinc-700 ml-2 font-medium">
                      {t.patientName}
                    </span>
                    <span className="block text-[11px] text-zinc-400 truncate max-w-[180px]">
                      {t.diagnosis || "Consultation Completed"}
                    </span>
                  </div>
                  <span className="badge badge-green text-[10px]">Done</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
