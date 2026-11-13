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
  Sparkles,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { DoctorLock } from "./doctor-lock";
import {
  DoctorDeskSketch,
  ECGHeartbeatSketch,
  EmptyChairSketch,
  PrescriptionSketch,
} from "@/components/ui/medical-illustrations";

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
      <div className="space-y-5">
        {/* Doctor Header Banner with Light Subtle Tint */}
        <div className="panel p-4 sm:p-5 bg-gradient-to-r from-teal-50/70 via-sky-50/30 to-white border-teal-200/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    Dr. Jose Rizal, MD
                  </h1>
                  <span className="badge badge-teal text-[10px]">Attending Physician</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Internal Medicine · PRC Lic: 0089241 · S2: S2-98412B
                </p>
              </div>
            </div>

            {/* Live Cardiac Waveform Indicator */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Clinic Monitor
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  CDS Engine Active
                </span>
              </div>
              <ECGHeartbeatSketch className="w-28 h-9" />
            </div>
          </div>

          {/* Quick Patient Queue Selector Ribbon */}
          <div className="mt-4 pt-3 border-t border-teal-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider shrink-0">
              Active Queue:
            </span>
            {tickets
              .filter((t) => t.status !== "CANCELLED")
              .slice(0, 10)
              .map((t) => {
                const isCurrent = t.id === activeTicket?.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                      isCurrent
                        ? "bg-teal-600 text-white font-semibold shadow-xs"
                        : t.status === "COMPLETED"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100/70"
                        : t.status === "IN_CONSULTATION"
                        ? "bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100/70"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-mono text-[11px] font-bold opacity-90">{t.tokenNo}</span>
                    <span className="truncate max-w-[110px]">{t.patientName}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        t.status === "COMPLETED"
                          ? "bg-emerald-500"
                          : t.status === "IN_CONSULTATION"
                          ? "bg-teal-500"
                          : "bg-amber-500"
                      }`}
                    />
                  </button>
                );
              })}
          </div>
        </div>

        {activeTicket ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Patient Clinical Profile & Vitals */}
            <div className="lg:col-span-4 space-y-4">
              {/* Demographics Card */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge badge-teal font-mono text-[11px] mb-1">
                      Token {activeTicket.tokenNo}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {activeTicket.patientName}
                    </h2>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {activeTicket.age} yrs · {activeTicket.gender} · Blood Group: <strong>{activeTicket.bloodGroup}</strong>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      Phone: {activeTicket.phone}
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      activeTicket.status === "COMPLETED"
                        ? "badge-green"
                        : activeTicket.status === "IN_CONSULTATION"
                        ? "badge-teal"
                        : "badge-amber"
                    }`}
                  >
                    {activeTicket.status.replace("_", " ")}
                  </span>
                </div>

                {/* Chief Complaint */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Chief Complaint / Reason for Consult
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 font-medium">
                    "{activeTicket.complaints || "General medical check-up"}"
                  </div>
                </div>

                {/* Vitals Summary Card */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Intake Vitals
                    </span>
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100">
                      <span className="text-[10px] text-teal-800 font-medium block">Blood Pressure</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {activeTicket.vitals?.systolicBp}/{activeTicket.vitals?.diastolicBp} <span className="text-[10px] font-normal text-slate-500">mmHg</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sky-50/50 border border-sky-100">
                      <span className="text-[10px] text-sky-800 font-medium block">SpO2 Oxygen</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {activeTicket.vitals?.spO2}%
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-600 font-medium block">Body Temp</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {activeTicket.vitals?.temperatureCelsius}°C
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <span className="text-[10px] text-emerald-800 font-medium block">Pulse Rate</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {activeTicket.vitals?.heartRate} <span className="text-[10px] font-normal text-slate-500">bpm</span>
                      </span>
                    </div>
                  </div>

                  {alerts.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200/80 space-y-1.5">
                      {alerts.map((al, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-rose-900 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>
                            <strong className="font-semibold">{al.label}:</strong> {al.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Clinical Protocol Presets */}
              <div className="panel p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    1-Click Protocol Presets
                  </div>
                  <span className="text-[10px] text-slate-400">Fast-fill</span>
                </div>
                <div className="space-y-1.5">
                  {COMMON_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleApplyPreset(p)}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-teal-50/50 hover:border-teal-300 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <span className="font-medium text-xs text-slate-800 group-hover:text-teal-900">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-100 group-hover:bg-teal-100/70 group-hover:text-teal-800">
                        {p.meds.length} meds
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Clinical Impression & Prescription Writer */}
            <div className="lg:col-span-8 space-y-4">
              <div className="panel p-5 space-y-4">
                {/* Clinical Diagnosis Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Clinical Diagnosis & Impression *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acute Bronchitis, Essential Hypertension (Stage 1), Dengue Fever"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="input-field font-medium text-sm text-slate-900"
                  />
                </div>

                {/* Prescription List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-teal-600" /> Electronic Prescription (Rx)
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {prescriptions.length} item{prescriptions.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {prescriptions.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-2.5">Medication & Form</th>
                            <th className="p-2.5">Dosage</th>
                            <th className="p-2.5">Frequency</th>
                            <th className="p-2.5">Timing</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {prescriptions.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-semibold text-slate-900">{m.name}</td>
                              <td className="p-2.5 font-mono text-slate-600">{m.dosage}</td>
                              <td className="p-2.5 font-mono text-teal-700 font-medium">{m.frequency}</td>
                              <td className="p-2.5 text-slate-600">{m.timing}</td>
                              <td className="p-2.5 font-mono text-slate-600">{m.duration}</td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMed(m.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center mb-3">
                      <p className="text-xs text-slate-500">
                        No medications prescribed yet. Select a 1-click protocol above or add medications below.
                      </p>
                    </div>
                  )}

                  {/* Add Medication Row */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Add Drug to Rx
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Medicine (e.g. Paracetamol 500mg)"
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          className="input-field text-xs py-1.5"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={newDosage}
                          onChange={(e) => setNewDosage(e.target.value)}
                          className="input-field text-xs py-1.5"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Freq (1-0-1)"
                          value={newFrequency}
                          onChange={(e) => setNewFrequency(e.target.value)}
                          className="input-field text-xs py-1.5 font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Timing"
                          value={newTiming}
                          onChange={(e) => setNewTiming(e.target.value)}
                          className="input-field text-xs py-1.5"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddMedicine}
                          className="btn-primary w-full justify-center py-1.5 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doctor Clinical Advice */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Patient Instructions & Clinical Lifestyle Advice
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Dietary instructions, daily hydration, activities to avoid, warning symptoms..."
                    value={doctorAdvice}
                    onChange={(e) => setDoctorAdvice(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                {/* Follow-up & Final Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Follow-up:</span>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="input-field text-xs font-mono py-1 px-2 w-auto"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        toast.info(`Printing Rx slip for ${activeTicket.patientName}`);
                        window.print();
                      }}
                      className="btn-secondary"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Rx
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
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete Consult
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Queue State with Doctor Illustration */
          <div className="panel p-10 text-center bg-white border border-slate-200/80 rounded-2xl">
            <div className="flex justify-center mb-2">
              <DoctorDeskSketch className="w-48 h-48" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Doctor Consultation Desk is Ready
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              There are currently no patients waiting in your consultation queue.
              New check-ins from the front desk will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </DoctorLock>
  );
}
