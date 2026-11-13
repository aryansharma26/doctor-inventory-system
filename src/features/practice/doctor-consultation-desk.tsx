"use client";

import { useEffect, useState } from "react";
import {
  type OPDTicket,
  getStoredTickets,
  updateTicketStatus,
} from "./opd-store";
import { interpretVitals, type VitalAlert } from "./vitals-helper";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FilePlus,
  Pill,
  Plus,
  Printer,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { DoctorLock } from "./doctor-lock";

interface PrescribedMed {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
}

const COMMON_PRESETS = [
  {
    name: "Upper Respiratory Infection (URTI)",
    diagnosis: "Acute Upper Respiratory Tract Infection with Pharyngitis",
    advice: "Warm saline gargle 3x daily. Increase fluid intake to 3L. Avoid cold beverages.",
    meds: [
      { id: "1", name: "Biogesic Paracetamol 500mg", dosage: "1 Tablet", frequency: "1-0-1", timing: "After Meals", duration: "5 Days" },
      { id: "2", name: "Amoxil Amoxicillin 500mg", dosage: "1 Capsule", frequency: "1-1-1", timing: "After Meals", duration: "7 Days" },
      { id: "3", name: "Solmux Carbocisteine 500mg", dosage: "1 Capsule", frequency: "1-1-1", timing: "After Meals", duration: "5 Days" },
    ],
  },
  {
    name: "Hypertension Stage 1",
    diagnosis: "Essential Hypertension (Stage 1) - Follow-up",
    advice: "Strict low sodium/low fat diet. Brisk walking 30 mins 5x/week. Daily morning BP monitoring log.",
    meds: [
      { id: "1", name: "Norvasc Amlodipine 5mg", dosage: "1 Tablet", frequency: "0-0-1", timing: "At Bedtime", duration: "30 Days" },
    ],
  },
  {
    name: "Acute Gastritis / Acid Peptic",
    diagnosis: "Acute Gastritis with Reflux Symptoms",
    advice: "Avoid spicy, acidic, and fried food. Do not skip meals. Elevate headrest during sleep.",
    meds: [
      { id: "1", name: "Nexium Esomeprazole 40mg", dosage: "1 Tablet", frequency: "1-0-0", timing: "30 Mins Before Breakfast", duration: "14 Days" },
      { id: "2", name: "Kremil-S Chewable Tablet", dosage: "1-2 Tablets", frequency: "As Needed", timing: "Post-prandial / On symptoms", duration: "7 Days" },
    ],
  },
];

export function DoctorConsultationDesk() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Clinical form states
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorAdvice, setDoctorAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [prescriptions, setPrescriptions] = useState<PrescribedMed[]>([]);

  // Medicine adder temporary state
  const [newMedName, setNewMedName] = useState("");
  const [newDosage, setNewDosage] = useState("1 Tablet");
  const [newFrequency, setNewFrequency] = useState("1-0-1");
  const [newTiming, setNewTiming] = useState("After Meals");
  const [newDuration, setNewDuration] = useState("5 Days");

  const reloadTickets = () => {
    const list = getStoredTickets();
    setTickets(list);
    // If no ticket selected, pick first in consultation or waiting
    if (!selectedTicketId && list.length > 0) {
      const active = list.find((t) => t.status === "IN_CONSULTATION") || list.find((t) => t.status === "WAITING");
      if (active) setSelectedTicketId(active.id);
    }
  };

  useEffect(() => {
    reloadTickets();
    const handleUpdate = () => reloadTickets();
    window.addEventListener("opd-store-update", handleUpdate);
    return () => window.removeEventListener("opd-store-update", handleUpdate);
  }, []);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  // Sync state when active ticket changes
  useEffect(() => {
    if (activeTicket) {
      setDiagnosis(activeTicket.diagnosis || "");
      setDoctorAdvice(activeTicket.doctorAdvice || "");
      setFollowUpDate(activeTicket.followUpDate || "");
      setPrescriptions((activeTicket.prescribedMedicines as any) || []);
    }
  }, [selectedTicketId, activeTicket]);

  const handleAddMedicine = () => {
    if (!newMedName.trim()) {
      toast.error("Please enter medicine name");
      return;
    }
    const newMed: PrescribedMed = {
      id: `rx-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newDosage,
      frequency: newFrequency,
      timing: newTiming,
      duration: newDuration,
    };
    setPrescriptions([...prescriptions, newMed]);
    setNewMedName("");
  };

  const handleRemoveMed = (id: string) => {
    setPrescriptions(prescriptions.filter((m) => m.id !== id));
  };

  const handleApplyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setDiagnosis(preset.diagnosis);
    setDoctorAdvice(preset.advice);
    setPrescriptions(preset.meds);
    toast.info(`Preset applied: ${preset.name}`);
  };

  const handleSaveConsultation = (complete: boolean) => {
    if (!activeTicket) return;
    if (complete && !diagnosis.trim()) {
      toast.error("Please enter a clinical diagnosis before marking complete.");
      return;
    }

    const nextStatus = complete ? "COMPLETED" : "IN_CONSULTATION";
    updateTicketStatus(activeTicket.id, nextStatus, {
      diagnosis: diagnosis.trim(),
      doctorAdvice: doctorAdvice.trim(),
      followUpDate: followUpDate || undefined,
      prescribedMedicines: prescriptions,
      consultationCompletedAt: complete ? new Date().toISOString() : undefined,
    });

    toast.success(complete ? "Consultation marked as Completed!" : "Consultation draft saved.");
    reloadTickets();
  };

  const alerts: VitalAlert[] = activeTicket?.vitals
    ? interpretVitals(activeTicket.vitals)
    : [];

  return (
    <DoctorLock>
      <div className="space-y-4">
        {/* Top Queue Bar: Quick Patient Switcher */}
        <div className="panel p-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2">
            Queue:
          </span>
          {tickets
            .filter((t) => t.status !== "CANCELLED")
            .slice(0, 8)
            .map((t) => {
              const isCurrent = t.id === activeTicket?.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`px-3 py-1.5 rounded text-xs flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                    isCurrent
                      ? "bg-zinc-900 text-white font-semibold shadow-2xs"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span className="font-mono text-[11px] opacity-80">{t.tokenNo}</span>
                  <span className="truncate max-w-[120px]">{t.patientName}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      t.status === "COMPLETED"
                        ? "bg-emerald-500"
                        : t.status === "IN_CONSULTATION"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                  />
                </button>
              );
            })}
        </div>

        {activeTicket ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Patient Clinical Profile & Vitals */}
            <div className="lg:col-span-4 space-y-4">
              {/* Patient Demographics Card */}
              <div className="panel p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge badge-zinc font-mono text-[10px] mb-1">
                      {activeTicket.tokenNo}
                    </span>
                    <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                      {activeTicket.patientName}
                    </h2>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {activeTicket.age} yrs · {activeTicket.gender} · {activeTicket.bloodGroup}
                    </div>
                    <div className="text-xs font-mono text-zinc-400 mt-1">
                      {activeTicket.phone}
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      activeTicket.status === "COMPLETED"
                        ? "badge-green"
                        : activeTicket.status === "IN_CONSULTATION"
                        ? "badge-blue"
                        : "badge-amber"
                    }`}
                  >
                    {activeTicket.status.replace("_", " ")}
                  </span>
                </div>

                {/* Chief Complaint */}
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Chief Complaint
                  </div>
                  <p className="text-xs text-zinc-800 bg-zinc-50 p-2 rounded border border-zinc-200">
                    "{activeTicket.complaints}"
                  </p>
                </div>

                {/* Vitals Summary Card */}
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Vitals & Clinical Alerts
                    </span>
                    <Activity className="w-3.5 h-3.5 text-zinc-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 block">Blood Pressure</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {activeTicket.vitals?.systolicBp}/{activeTicket.vitals?.diastolicBp} mmHg
                      </span>
                    </div>

                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 block">SpO2 Level</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {activeTicket.vitals?.spO2}%
                      </span>
                    </div>

                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 block">Temperature</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {activeTicket.vitals?.temperatureCelsius}°C
                      </span>
                    </div>

                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 block">Pulse Rate</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {activeTicket.vitals?.heartRate} bpm
                      </span>
                    </div>
                  </div>

                  {alerts.length > 0 && (
                    <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 space-y-1">
                      {alerts.map((al, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-rose-800 font-medium">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>
                            <strong className="font-semibold">{al.label}:</strong> {al.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Clinical Rx Presets */}
              <div className="panel p-3">
                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  1-Click Protocol Presets
                </div>
                <div className="space-y-1.5">
                  {COMMON_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleApplyPreset(p)}
                      className="w-full text-left p-2 rounded text-xs border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium text-zinc-800">{p.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {p.meds.length} meds
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Diagnosis & Prescription Editor */}
            <div className="lg:col-span-8 space-y-4">
              <div className="panel p-4 space-y-4">
                {/* Clinical Diagnosis Input */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Clinical Diagnosis & Impression *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acute Bronchitis, Essential Hypertension"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="input-field font-medium text-sm"
                  />
                </div>

                {/* Prescription List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-zinc-500" /> Prescribed Medications (Rx)
                    </span>
                    <span className="text-xs text-zinc-400">
                      {prescriptions.length} medicine{prescriptions.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Add New Medicine Bar */}
                  <div className="p-3 bg-zinc-50 rounded border border-zinc-200 space-y-2 mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Medicine name & strength..."
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          className="input-field text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Dosage (1 Tab)"
                          value={newDosage}
                          onChange={(e) => setNewDosage(e.target.value)}
                          className="input-field text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Freq (1-0-1)"
                          value={newFrequency}
                          onChange={(e) => setNewFrequency(e.target.value)}
                          className="input-field text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Duration (5d)"
                          value={newDuration}
                          onChange={(e) => setNewDuration(e.target.value)}
                          className="input-field text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddMedicine}
                          className="btn-primary w-full justify-center text-xs h-[33px]"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Medications Table */}
                  <div className="border border-zinc-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold text-[11px] uppercase">
                          <th className="p-2.5">Medicine</th>
                          <th className="p-2.5">Dosage</th>
                          <th className="p-2.5">Frequency</th>
                          <th className="p-2.5">Timing</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-zinc-400 text-xs">
                              No medicines added yet. Use form above or click a 1-click preset.
                            </td>
                          </tr>
                        ) : (
                          prescriptions.map((m) => (
                            <tr key={m.id} className="border-b border-zinc-100 hover:bg-zinc-50/60">
                              <td className="p-2.5 font-medium text-zinc-900">{m.name}</td>
                              <td className="p-2.5 text-zinc-600">{m.dosage}</td>
                              <td className="p-2.5 font-mono text-zinc-800">{m.frequency}</td>
                              <td className="p-2.5 text-zinc-600">{m.timing}</td>
                              <td className="p-2.5 text-zinc-600">{m.duration}</td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMed(m.id)}
                                  className="text-zinc-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Doctor's Advice & Instructions */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Doctor Advice, Diet & Lifestyle Precautions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Complete antibiotic course, drink 3 liters water daily, rest well."
                    value={doctorAdvice}
                    onChange={(e) => setDoctorAdvice(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                {/* Follow-up Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Recommended Follow-Up Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="input-field text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        toast.info(`Printing Rx for ${activeTicket.patientName}`);
                        window.print();
                      }}
                      className="btn-secondary"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Rx
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveConsultation(false)}
                      className="btn-secondary"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveConsultation(true)}
                      className="btn-primary"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Complete & Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel p-12 text-center text-zinc-400">
            No active patients in queue.
          </div>
        )}
      </div>
    </DoctorLock>
  );
}
