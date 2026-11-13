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
import { QueueWaitingSketch } from "@/components/ui/medical-illustrations";

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
      {/* Top Banner with Handcrafted Queue Lounge Sketch */}
      <div className="panel p-5 bg-gradient-to-r from-teal-50/60 via-sky-50/30 to-white border-teal-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 border border-teal-200 text-teal-800 text-[11px] font-semibold mb-2">
            <Volume2 className="w-3.5 h-3.5 text-teal-600" />
            Live Clinic Audio Dispatcher
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            OPD Live Calling Queue Board
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-lg">
            Real-time waiting room dispatch display with speech synthesizer token announcement for clinic speaker systems.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <QueueWaitingSketch className="w-32 h-24" />
          </div>
          <button onClick={reloadTickets} className="btn-secondary text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Refresh Board
          </button>
        </div>
      </div>

      {/* Main 3-Column Queue Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Waiting Room (FIFO) */}
        <div className="panel flex flex-col bg-white border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="panel-header bg-amber-50/70 border-b border-amber-100">
            <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Waiting in Lounge
            </span>
            <span className="badge badge-amber font-mono text-[11px]">
              {waitingTickets.length}
            </span>
          </div>

          <div className="p-3.5 space-y-2.5 flex-1">
            {waitingTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                Lobby queue is clear.
              </div>
            ) : (
              waitingTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-2xs transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-base text-amber-950 block">
                        {t.tokenNo}
                      </span>
                      <span className="font-semibold text-xs text-slate-900 block mt-0.5">
                        {t.patientName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {t.age}y · {t.gender}
                      </span>
                    </div>

                    <button
                      onClick={() => announcePatient(t)}
                      title="Announce on Speaker"
                      className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 cursor-pointer transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                    {t.complaints}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      BP {t.vitals?.systolicBp}/{t.vitals?.diastolicBp}
                    </span>
                    <button
                      onClick={() => {
                        updateTicketStatus(t.id, "IN_CONSULTATION");
                        announcePatient(t);
                        reloadTickets();
                      }}
                      className="btn-primary text-[11px] py-1 px-2.5"
                    >
                      Call to Doctor <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Doctor Cabin */}
        <div className="panel flex flex-col bg-white border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="panel-header bg-teal-50/70 border-b border-teal-100">
            <span className="font-bold text-xs text-teal-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> In Doctor Cabin
            </span>
            <span className="badge badge-teal font-mono text-[11px]">
              {inConsultTickets.length}
            </span>
          </div>

          <div className="p-3.5 space-y-2.5 flex-1">
            {inConsultTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                Doctor's desk is available.
              </div>
            ) : (
              inConsultTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/30 space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-base text-teal-950 block">
                        {t.tokenNo}
                      </span>
                      <span className="font-semibold text-xs text-slate-900 block mt-0.5">
                        {t.patientName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t.age}y · Dr. Jose Rizal, MD
                      </span>
                    </div>

                    <button
                      onClick={() => announcePatient(t)}
                      title="Re-announce on Speaker"
                      className="p-1.5 rounded-lg bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" /> In Consult
                    </span>
                    <button
                      onClick={() => {
                        updateTicketStatus(t.id, "COMPLETED");
                        toast.success(`Completed consultation for ${t.patientName}`);
                        reloadTickets();
                      }}
                      className="btn-secondary text-[11px] py-1 px-2.5 text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Mark Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Completed Today */}
        <div className="panel flex flex-col bg-white border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="panel-header bg-emerald-50/70 border-b border-emerald-100">
            <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed Consults
            </span>
            <span className="badge badge-green font-mono text-[11px]">
              {completedTickets.length}
            </span>
          </div>

          <div className="p-3.5 space-y-2 flex-1 max-h-[500px] overflow-y-auto">
            {completedTickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No completed consults yet today.
              </div>
            ) : (
              completedTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-700 mr-2">
                      {t.tokenNo}
                    </span>
                    <span className="font-medium text-slate-900">
                      {t.patientName}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Finished
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
