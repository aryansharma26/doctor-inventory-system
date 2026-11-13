import {
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  History,
  Pill,
  Plus,
  Printer,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Trash2,
  UserCheck,
  Volume2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OPDBillingModal } from "./opd-billing-modal";
import {
  getStoredTickets,
  type OPDTicket,
  saveTicket,
  updateTicketStatus,
} from "./opd-store";
import { PatientHistoryPanel } from "./patient-history-panel";
import { PrescriptionTemplatesModal } from "./prescription-templates";
import { RxPrescriptionPrint } from "./rx-prescription-print";
import { announcePatientCall } from "./clinic-announcer";
import { interpretVitals } from "./vitals-helper";

interface PrescribedMed {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  stockAvailable?: number;
  notes?: string;
}

const COMMON_MEDICINES_PH = [
  {
    name: "Biogesic Paracetamol 500mg",
    defaultDosage: "1 Tablet",
    defaultFreq: "1-0-1",
    defaultTiming: "After Meals",
    stock: 180,
  },
  {
    name: "Amoxil Amoxicillin 500mg",
    defaultDosage: "1 Capsule",
    defaultFreq: "1-1-1",
    defaultTiming: "After Meals",
    stock: 65,
  },
  {
    name: "Solmux Carbocisteine 500mg",
    defaultDosage: "1 Capsule",
    defaultFreq: "1-1-1",
    defaultTiming: "After Meals",
    stock: 90,
  },
  {
    name: "Neozep Forte Paracetamol/Phenylephrine",
    defaultDosage: "1 Tablet",
    defaultFreq: "1-0-1",
    defaultTiming: "After Meals",
    stock: 120,
  },
  {
    name: "Bioflu Paracetamol/Chlorphenamine",
    defaultDosage: "1 Tablet",
    defaultFreq: "1-0-1",
    defaultTiming: "At Bedtime",
    stock: 75,
  },
  {
    name: "Alaxan FR Paracetamol/Ibuprofen",
    defaultDosage: "1 Capsule",
    defaultFreq: "1-0-1",
    defaultTiming: "After Meals",
    stock: 8,
  }, // Low stock demo!
  {
    name: "Kremil-S Aluminum Hydroxide",
    defaultDosage: "1 Chewable",
    defaultFreq: "1-0-1",
    defaultTiming: "After Meals",
    stock: 110,
  },
  {
    name: "Iterax Hydroxyzine 25mg",
    defaultDosage: "1 Tablet",
    defaultFreq: "0-0-1",
    defaultTiming: "At Bedtime",
    stock: 40,
  },
];

export function DoctorConsultationDesk() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<OPDTicket | null>(null);
  const [rxModalTicket, setRxModalTicket] = useState<OPDTicket | null>(null);
  const [billingModalTicket, setBillingModalTicket] =
    useState<OPDTicket | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  // Form states for consultation
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorAdvice, setDoctorAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [medsList, setMedsList] = useState<PrescribedMed[]>([]);

  // Temp medicine selection
  const [clinicMedicines, setClinicMedicines] = useState(COMMON_MEDICINES_PH);
  const [selectedMedName, setSelectedMedName] = useState(
    COMMON_MEDICINES_PH[0].name,
  );
  const [customMedName, setCustomMedName] = useState("");
  const [dosage, setDosage] = useState("1 Tablet");
  const [frequency, setFrequency] = useState("1-0-1");
  const [timing, setTiming] = useState("After Meals");
  const [duration, setDuration] = useState("5 Days");

  useEffect(() => {
    const list = getStoredTickets();
    setTickets(list);

    // Auto-select first waiting or in-consultation patient if available
    const active =
      list.find((p) => p.status === "IN_CONSULTATION") ||
      list.find((p) => p.status === "WAITING");
    if (active) {
      handleSelectPatient(active);
    }

    const handleUpdate = () => {
      const updated = getStoredTickets();
      setTickets(updated);
    };
    window.addEventListener("opd-store-update", handleUpdate);
    return () => window.removeEventListener("opd-store-update", handleUpdate);
  }, []);

  const handleSelectPatient = (p: OPDTicket) => {
    setSelectedTicket(p);
    setDiagnosis(p.diagnosis || "");
    setDoctorAdvice(
      p.doctorAdvice ||
        "Rest well, consume warm fluids, follow prescribed medication timings.",
    );
    setMedsList(p.prescribedMedicines || []);

    // Set default follow-up date to +7 days if none set
    if (p.followUpDate) {
      setFollowUpDate(p.followUpDate);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setFollowUpDate(d.toISOString().split("T")[0]);
    }

    if (p.status === "WAITING") {
      updateTicketStatus(p.id, "IN_CONSULTATION");
    }
  };

  const handleAddMedicine = () => {
    const nameToUse = customMedName.trim() || selectedMedName;
    if (!nameToUse) {
      toast.error("Please select or type a medicine name");
      return;
    }

    const newMed: PrescribedMed = {
      id: `med-${Date.now()}`,
      name: nameToUse,
      dosage,
      frequency,
      timing,
      duration,
    };

    setMedsList([...medsList, newMed]);
    setCustomMedName("");
    toast.success(`Added ${nameToUse} to prescription`);
  };

  const handleRemoveMedicine = (id: string) => {
    setMedsList(medsList.filter((m) => m.id !== id));
  };

  const handleQuickFollowUpDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split("T")[0]);
    toast.info(
      `Follow-up date set for +${days} days (${d.toLocaleDateString()})`,
    );
  };

  const handleSaveConsultation = () => {
    if (!selectedTicket) return;

    const updatedTicket: OPDTicket = {
      ...selectedTicket,
      status: "COMPLETED",
      diagnosis: diagnosis.trim() || "Clinical Examination & Symptomatic Care",
      doctorAdvice: doctorAdvice.trim(),
      prescribedMedicines: medsList,
      followUpDate,
      consultationCompletedAt: new Date().toISOString(),
    };

    saveTicket(updatedTicket);
    setSelectedTicket(updatedTicket);
    setRxModalTicket(updatedTicket);
    toast.success(
      `Consultation completed for ${updatedTicket.patientName}! Rx ready to print.`,
    );
  };

  const waitingQueue = tickets.filter(
    (p) => p.status === "WAITING" || p.status === "IN_CONSULTATION",
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" /> Doctor OPD Desk & EMR Room
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Patient Consultation & Prescription Builder
          </h1>
          <p className="text-indigo-200/70 text-sm mt-1">
            Review patient vitals, diagnosis, prescribe medicines linked with
            stock, and schedule next follow-up return dates.
          </p>
        </div>

        {selectedTicket && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveConsultation}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl transition shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              Finalize Consultation & Print Rx
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Waiting Patient Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" /> Waiting Patients
              Queue
            </h2>
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-bold text-xs rounded-full">
              {waitingQueue.length} Waiting
            </span>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {waitingQueue.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="text-xs font-semibold">
                  No patients waiting in queue!
                </p>
              </div>
            ) : (
              waitingQueue.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    selectedTicket?.id === p.id
                      ? "border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2.5 py-0.5 bg-slate-900 text-emerald-400 font-mono font-bold text-xs rounded-md">
                      {p.tokenNo}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(p.checkInTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-base">
                    {p.patientName}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {p.age} yrs • {p.gender} •{" "}
                    <span className="text-rose-700 font-bold">
                      {p.bloodGroup}
                    </span>
                  </div>

                  {p.allergies.length > 0 && p.allergies[0] !== "None" && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                      <ShieldAlert className="w-3 h-3" /> Allergy:{" "}
                      {p.allergies.join(", ")}
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 line-clamp-1 italic">
                    "{p.complaints}"
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Active Patient Consultation Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedTicket ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-200/80 text-slate-400">
              <Stethoscope className="w-16 h-16 mx-auto mb-3 text-indigo-400 opacity-75" />
              <h3 className="text-lg font-bold text-slate-700">
                Ready for Next Consultation
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {waitingQueue.length > 0
                  ? `${waitingQueue.length} patient${waitingQueue.length > 1 ? "s" : ""} waiting in the live queue.`
                  : "Queue is currently clear. New check-ins from Reception will sync here live in real-time."}
              </p>
              {waitingQueue.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = waitingQueue[0];
                    setSelectedTicket(next);
                    announcePatientCall(
                      next.tokenNo,
                      next.patientName,
                      "Doctor's Consultation Room",
                    );
                    toast.info(
                      `Calling next patient: ${next.patientName} (${next.tokenNo})`,
                    );
                  }}
                  className="mt-5 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl shadow-lg transition flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  Call Next: {waitingQueue[0].tokenNo} ({waitingQueue[0].patientName})
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Patient Vitals & Allergy Header Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase block">
                      Active Patient Token: {selectedTicket.tokenNo}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">
                      {selectedTicket.patientName}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedTicket.age} years • {selectedTicket.gender} •
                      Blood:{" "}
                      <span className="font-bold text-rose-600">
                        {selectedTicket.bloodGroup}
                      </span>{" "}
                      • Phone: {selectedTicket.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        announcePatientCall(
                          selectedTicket.tokenNo,
                          selectedTicket.patientName,
                          "Doctor's Consultation Room",
                        );
                        toast.info(
                          `Calling Token ${selectedTicket.tokenNo} (${selectedTicket.patientName})...`,
                        );
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                      title="Call patient with audio chime and voice announcement"
                    >
                      <Volume2 className="w-4 h-4" /> Call Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHistoryPanelOpen(true)}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="View Patient Medical History, Past Visits & Allergies"
                    >
                      <History className="w-4 h-4 text-indigo-600" /> Patient History
                    </button>
                    <button
                      onClick={() => setBillingModalTicket(selectedTicket)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" /> OPD Billing (₱)
                    </button>
                    <button
                      onClick={() => setRxModalTicket(selectedTicket)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> View/Print Rx
                    </button>
                  </div>
                </div>

                {/* Vitals & Allergies Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">
                      BLOOD PRESSURE
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedTicket.vitals.systolicBp || "--"}/
                      {selectedTicket.vitals.diastolicBp || "--"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      mmHg
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">
                      PULSE RATE
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedTicket.vitals.heartRate || "--"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      bpm
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">
                      TEMPERATURE
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedTicket.vitals.temperatureCelsius
                        ? `${selectedTicket.vitals.temperatureCelsius}°C`
                        : "--"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      celsius
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">
                      WEIGHT & SpO2
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedTicket.vitals.weightKg
                        ? `${selectedTicket.vitals.weightKg}kg`
                        : "--"}{" "}
                      /{" "}
                      {selectedTicket.vitals.spO2
                        ? `${selectedTicket.vitals.spO2}%`
                        : "--"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      weight / O2
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border text-left col-span-2 sm:col-span-1 ${
                      selectedTicket.allergies.length > 0 &&
                      selectedTicket.allergies[0] !== "None"
                        ? "bg-rose-50 border-rose-200 text-rose-800"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                    }`}
                  >
                    <span className="text-[10px] font-bold block uppercase">
                      ALLERGY ALERT
                    </span>
                    <span className="font-bold text-xs truncate block">
                      {selectedTicket.allergies.length > 0
                        ? selectedTicket.allergies.join(", ")
                        : "None"}
                    </span>
                  </div>
                </div>

                {/* Clinical Decision Support Vitals Alert Banner */}
                {interpretVitals(selectedTicket.vitals).length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1">
                      ⚠️ Clinical Vitals Warning:
                    </span>
                    {interpretVitals(selectedTicket.vitals).map((alert, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          alert.severity === "danger"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-amber-600 text-white shadow-xs"
                        }`}
                      >
                        {alert.label}: {alert.message}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Diagnosis & Symptoms */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Clinical
                  Diagnosis & Findings
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Diagnosis / Clinical Impression *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acute Viral Rhinitis, Essential Hypertension..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 text-sm"
                  />
                  {/* Quick Diagnosis Chips */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {[
                      "Viral URI / Flu",
                      "Acute Bronchitis",
                      "Essential Hypertension",
                      "Type 2 Diabetes Mellitus",
                      "Acute Gastroenteritis (AGE)",
                      "Urinary Tract Infection (UTI)",
                      "Allergic Rhinitis",
                      "Musculoskeletal Pain / Myalgia",
                      "Contact Dermatitis",
                      "Routine Physical Checkup",
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setDiagnosis((prev) =>
                            prev ? `${prev}, ${item}` : item,
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                    {diagnosis && (
                      <button
                        type="button"
                        onClick={() => setDiagnosis("")}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Prescription (Dawaai) Builder */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-indigo-600" /> Prescribe
                    Medicines (Rx Prescription List)
                  </h3>
                  <button
                    onClick={() => setIsTemplatesModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Sparkles className="w-4 h-4" /> Use Template
                  </button>
                </div>

                {/* Add Medicine Toolbar */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase mb-1">
                        <span>Select Common Medicine</span>
                        <button
                          onClick={() => {
                            const found = clinicMedicines.find(
                              (m) => m.name === selectedMedName,
                            );
                            if (!found)
                              return toast.error(
                                "Select a common medicine first",
                              );
                            const newStockStr = prompt(
                              `Update stock for ${found.name}`,
                              found.stock.toString(),
                            );
                            if (newStockStr !== null) {
                              const newStock = parseInt(newStockStr, 10);
                              if (!isNaN(newStock) && newStock >= 0) {
                                setClinicMedicines((prev) =>
                                  prev.map((m) =>
                                    m.name === found.name
                                      ? { ...m, stock: newStock }
                                      : m,
                                  ),
                                );
                                toast.success(
                                  `${found.name} stock updated to ${newStock}!`,
                                );
                              } else {
                                toast.error("Invalid stock number entered");
                              }
                            }
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                        >
                          Update Stock
                        </button>
                      </label>
                      <select
                        value={selectedMedName}
                        onChange={(e) => {
                          setSelectedMedName(e.target.value);
                          const found = clinicMedicines.find(
                            (m) => m.name === e.target.value,
                          );
                          if (found) {
                            setDosage(found.defaultDosage);
                            setFrequency(found.defaultFreq);
                            setTiming(found.defaultTiming);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      >
                        {clinicMedicines.map((m) => (
                          <option key={m.name} value={m.name}>
                            {m.name} (
                            {m.stock <= 10 ? "⚠️ LOW STOCK: " : "In Stock: "}
                            {m.stock} Units)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Or Type Custom Medicine Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Biogesic 500mg, Neozep Forte, Amoxil..."
                        value={customMedName}
                        onChange={(e) => setCustomMedName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Dosage
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1 Tablet"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Frequency
                      </label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold font-mono"
                      >
                        <option value="1-0-1">1-0-1 (Morning & Evening)</option>
                        <option value="1-0-0">1-0-0 (Morning only)</option>
                        <option value="0-0-1">0-0-1 (Night only)</option>
                        <option value="1-1-1">1-1-1 (Thrice Daily)</option>
                        <option value="SOS">SOS (As needed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Timing
                      </label>
                      <select
                        value={timing}
                        onChange={(e) => setTiming(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                      >
                        <option value="After Meals">After Meals</option>
                        <option value="Before Meals">Before Meals</option>
                        <option value="Empty Stomach">Empty Stomach</option>
                        <option value="At Bedtime">At Bedtime</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 Days"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* Quick Frequency & Duration Presets */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] border-t border-slate-200/60">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-400 uppercase mr-1">
                        Freq:
                      </span>
                      {["1-0-1", "1-1-1", "1-0-0", "0-0-1", "SOS"].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFrequency(f)}
                          className={`px-1.5 py-0.5 rounded font-mono font-bold transition-colors cursor-pointer ${
                            frequency === f
                              ? "bg-indigo-600 text-white"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-400 uppercase mr-1">
                        Days:
                      </span>
                      {["3 Days", "5 Days", "7 Days", "14 Days", "1 Month"].map(
                        (d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDuration(d)}
                            className={`px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                              duration === d
                                ? "bg-indigo-600 text-white font-bold"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {d}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAddMedicine}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <Plus className="w-4 h-4" /> Add Medicine Manually
                    </button>
                    
                    <button
                      onClick={() => setIsTemplatesModalOpen(true)}
                      className="w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <Zap className="w-4 h-4" /> Load from Templates
                    </button>
                  </div>
                </div>

                <PrescriptionTemplatesModal 
                  isOpen={isTemplatesModalOpen} 
                  onClose={() => setIsTemplatesModalOpen(false)} 
                  onApplyTemplate={(meds) => {
                    const mappedMeds = meds.map(m => ({
                      id: `med-${Date.now()}-${Math.random()}`,
                      ...m
                    }));
                    setMedsList([...medsList, ...mappedMeds]);
                    setIsTemplatesModalOpen(false);
                    toast.success("Template medicines loaded successfully!");
                  }} 
                />

                {/* Added Medicines Table */}
                <div className="space-y-2">
                  {medsList.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {idx + 1}. {m.name}
                        </span>
                        <div className="text-slate-600">
                          {m.dosage} •{" "}
                          <span className="font-mono font-bold text-emerald-700">
                            {m.frequency}
                          </span>{" "}
                          ({m.timing}) for{" "}
                          <span className="font-bold">{m.duration}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveMedicine(m.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up Date ("Agli Meet Date") & Advice */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" /> Next
                  Follow-Up Return Visit & Reminders
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Select Follow-Up Return Date
                    </label>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <button
                        onClick={() => handleQuickFollowUpDays(3)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        +3 Days
                      </button>
                      <button
                        onClick={() => handleQuickFollowUpDays(7)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        +7 Days
                      </button>
                      <button
                        onClick={() => handleQuickFollowUpDays(15)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        +15 Days
                      </button>
                      <button
                        onClick={() => handleQuickFollowUpDays(30)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        +1 Month
                      </button>
                    </div>

                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Lifestyle Advice & Doctor's Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Adequate hydration, avoid fatty food, complete antibiotics..."
                      value={doctorAdvice}
                      onChange={(e) => setDoctorAdvice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900"
                    />
                    {/* Quick Doctor Advice Chips */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {[
                        "Adequate rest & fluids (8-10 glasses)",
                        "Take medicines after meals",
                        "Avoid salty & fatty foods",
                        "Low sugar diet / Avoid sugary drinks",
                        "Monitor BP twice daily",
                        "Return if fever persists > 3 days",
                        "Complete full course of antibiotics",
                      ].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            setDoctorAdvice((prev) =>
                              prev ? `${prev}. ${item}` : item,
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                          + {item}
                        </button>
                      ))}
                      {doctorAdvice && (
                        <button
                          type="button"
                          onClick={() => setDoctorAdvice("")}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient History Sliding Panel */}
      {selectedTicket && (
        <PatientHistoryPanel
          isOpen={isHistoryPanelOpen}
          onClose={() => setIsHistoryPanelOpen(false)}
          patientName={selectedTicket.patientName}
          patientId={selectedTicket.id}
          phone={selectedTicket.phone}
        />
      )}

      {/* Rx Templates Modal */}
      <PrescriptionTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyTemplate={(templateMeds) => {
          const newMeds = templateMeds.map((m) => ({
            id: Math.random().toString(),
            ...m,
          }));
          setMedsList((prev) => [...prev, ...newMeds]);
        }}
      />

      {/* Modal Dialog for Rx Prescription Print & WhatsApp */}
      {rxModalTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setRxModalTicket(null)}
        >
          <div
            className="w-full max-w-3xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <RxPrescriptionPrint
              ticket={rxModalTicket}
              onClose={() => setRxModalTicket(null)}
            />
          </div>
        </div>
      )}

      {/* Modal Dialog for OPD Billing & Official Receipt (PHP ₱) */}
      {billingModalTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setBillingModalTicket(null)}
        >
          <div
            className="w-full max-w-4xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <OPDBillingModal
              ticket={billingModalTicket}
              onClose={() => setBillingModalTicket(null)}
            />
          </div>
        </div>
      )}

      {/* Patient Medical History Drawer */}
      {selectedTicket && (
        <PatientHistoryPanel
          patientName={selectedTicket.patientName}
          patientId={selectedTicket.patientId}
          phone={selectedTicket.phone}
          isOpen={isHistoryPanelOpen}
          onClose={() => setIsHistoryPanelOpen(false)}
        />
      )}
    </div>
  );
}
