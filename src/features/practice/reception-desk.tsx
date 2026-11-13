"use client";

import { useEffect, useState } from "react";
import {
  type OPDTicket,
  getNextTokenNumber,
  getStoredTickets,
  saveTicket,
  updateTicketStatus,
} from "./opd-store";
import { interpretVitals, type VitalAlert } from "./vitals-helper";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  Search,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { formatPhp } from "@/lib/utils";

export function ReceptionDesk() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Form states
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("+63 9");
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState("Female");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [complaints, setComplaints] = useState("");

  // Vitals
  const [systolicBp, setSystolicBp] = useState<number>(120);
  const [diastolicBp, setDiastolicBp] = useState<number>(80);
  const [heartRate, setHeartRate] = useState<number>(75);
  const [temperatureCelsius, setTemperatureCelsius] = useState<number>(36.8);
  const [spO2, setSpO2] = useState<number>(98);
  const [weightKg, setWeightKg] = useState<number>(60);

  // Fee & Payment
  const [consultationFee, setConsultationFee] = useState<number>(500);
  const [vitalsFee, setVitalsFee] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<"GCASH" | "MAYA" | "CASH" | "CARD">("GCASH");
  const [gcashRef, setGcashRef] = useState("");

  const [alerts, setAlerts] = useState<VitalAlert[]>([]);

  const reloadTickets = () => {
    setTickets(getStoredTickets());
  };

  useEffect(() => {
    reloadTickets();
    const handleUpdate = () => reloadTickets();
    window.addEventListener("opd-store-update", handleUpdate);
    return () => window.removeEventListener("opd-store-update", handleUpdate);
  }, []);

  // Update vitals alerts dynamically
  useEffect(() => {
    const calculated = interpretVitals({
      systolicBp,
      diastolicBp,
      heartRate,
      temperatureCelsius,
      spO2,
      weightKg,
    });
    setAlerts(calculated);
  }, [systolicBp, diastolicBp, heartRate, temperatureCelsius, spO2, weightKg]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }

    const tokenNo = getNextTokenNumber();
    const totalPhp = consultationFee + vitalsFee;

    const newTicket: OPDTicket = {
      id: `ticket-${Date.now()}`,
      tokenNo,
      patientId: `PAT-${Date.now().toString().slice(-4)}`,
      patientName: patientName.trim(),
      phone: phone.trim(),
      age: Number(age) || 25,
      gender,
      bloodGroup,
      allergies: [],
      vitals: {
        systolicBp: Number(systolicBp),
        diastolicBp: Number(diastolicBp),
        heartRate: Number(heartRate),
        temperatureCelsius: Number(temperatureCelsius),
        spO2: Number(spO2),
        weightKg: Number(weightKg),
      },
      complaints: complaints.trim() || "General Consultation",
      doctorName: "Dr. Jose Rizal, MD",
      doctorSpecialty: "Internal Medicine & General Practice",
      checkInTime: new Date().toISOString(),
      status: "WAITING",
      billing: {
        invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        consultationFeePhp: consultationFee,
        vitalsCheckFeePhp: vitalsFee,
        labFeePhp: 0,
        medicinesFeePhp: 0,
        totalAmountPhp: totalPhp,
        paymentMethod,
        paymentStatus: "PAID",
        paidAt: new Date().toISOString(),
        gcashRefNo: gcashRef.trim() || undefined,
      },
    };

    saveTicket(newTicket);
    toast.success(`Token ${tokenNo} issued for ${patientName}!`);

    // Reset fields
    setPatientName("");
    setComplaints("");
    setGcashRef("");
  };

  const handleStatusChange = (id: string, status: OPDTicket["status"]) => {
    updateTicketStatus(id, status);
    toast.info(`Ticket updated to ${status}`);
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.patientName.toLowerCase().includes(search.toLowerCase()) ||
      t.tokenNo.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search);
    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const waitingCount = tickets.filter((t) => t.status === "WAITING").length;
  const inConsultCount = tickets.filter((t) => t.status === "IN_CONSULTATION").length;
  const completedToday = tickets.filter((t) => t.status === "COMPLETED").length;
  const totalRevenueToday = tickets.reduce((acc, t) => acc + (t.billing?.totalAmountPhp || 0), 0);

  return (
    <div className="space-y-6">
      {/* Crisp, Uncluttered Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Patient Intake & Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register arriving patients, record vitals, and issue OPD queue tokens.
          </p>
        </div>

        {/* Clean, Compact Stat Badges (No Heavy Cards) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs font-medium text-amber-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Waiting: <strong>{waitingCount}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200/80 text-xs font-medium text-teal-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>In Cabin: <strong>{inConsultCount}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-xs font-medium text-emerald-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Done: <strong>{completedToday}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
            {formatPhp(totalRevenueToday)}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Clean Check-in Form */}
        <div className="lg:col-span-5">
          <div className="panel bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-teal-600" /> New Patient Check-In
              </span>
              <span className="text-[11px] font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Next: {getNextTokenNumber()}
              </span>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              {/* Patient Basic Info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Clara De Los Santos"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="input-field text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+63 917 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="input-field text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Blood
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="input-field text-xs"
                      >
                        {["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Reason for Visit / Complaint
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fever, cough, follow-up consult"
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* Triage Vitals */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-teal-600" /> Vitals
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.2 rounded">
                    CDS Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase mb-0.5">BP (Sys/Dia)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={systolicBp}
                        onChange={(e) => setSystolicBp(Number(e.target.value))}
                        className="input-field text-xs px-1 text-center font-mono"
                        placeholder="120"
                      />
                      <span className="text-slate-300">/</span>
                      <input
                        type="number"
                        value={diastolicBp}
                        onChange={(e) => setDiastolicBp(Number(e.target.value))}
                        className="input-field text-xs px-1 text-center font-mono"
                        placeholder="80"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase mb-0.5">Pulse (BPM)</label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                      className="input-field text-xs text-center font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase mb-0.5">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperatureCelsius}
                      onChange={(e) => setTemperatureCelsius(Number(e.target.value))}
                      className="input-field text-xs text-center font-mono"
                    />
                  </div>
                </div>

                {alerts.length > 0 && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200/80 space-y-1">
                    {alerts.map((al, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-rose-900 font-medium">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span><strong>{al.label}:</strong> {al.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consultation Fee Collection */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Consultation Fee
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    Total: {formatPhp(consultationFee + vitalsFee)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="input-field text-xs font-mono"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="input-field text-xs font-semibold"
                  >
                    <option value="GCASH">GCash QR</option>
                    <option value="MAYA">Maya</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>

                {(paymentMethod === "GCASH" || paymentMethod === "MAYA") && (
                  <input
                    type="text"
                    placeholder="Reference Number"
                    value={gcashRef}
                    onChange={(e) => setGcashRef(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center py-2.5 text-xs font-semibold"
              >
                <UserPlus className="w-4 h-4" /> Issue Token & Dispatch
              </button>
            </form>
          </div>
        </div>

        {/* Right: Today's Queue List Table */}
        <div className="lg:col-span-7">
          <div className="panel bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">
                  Today's Queue
                </span>
                <span className="text-xs text-slate-400 font-mono">({filteredTickets.length})</span>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                {["ALL", "WAITING", "IN_CONSULTATION", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                      filterStatus === st
                        ? "bg-teal-600 text-white font-semibold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {st === "ALL" ? "All" : st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search token #, patient name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field text-xs pl-8 py-1.5"
                />
              </div>
            </div>

            {/* Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                    <th className="p-3">Token</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Vitals</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-teal-800">
                          {t.tokenNo}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 block">{t.patientName}</span>
                          <span className="text-[11px] text-slate-400">{t.age}y · {t.gender}</span>
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {t.vitals?.systolicBp}/{t.vitals?.diastolicBp}
                          <span className="block text-[10px] text-slate-400 font-sans">
                            {t.vitals?.temperatureCelsius}°C
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          <span className="font-semibold text-slate-900">
                            {formatPhp(t.billing?.totalAmountPhp || 0)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`badge ${
                              t.status === "COMPLETED"
                                ? "badge-green"
                                : t.status === "IN_CONSULTATION"
                                ? "badge-teal"
                                : "badge-amber"
                            }`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {t.status === "WAITING" && (
                            <button
                              onClick={() => handleStatusChange(t.id, "IN_CONSULTATION")}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 cursor-pointer"
                            >
                              Call In
                            </button>
                          )}
                          {t.status === "IN_CONSULTATION" && (
                            <button
                              onClick={() => handleStatusChange(t.id, "COMPLETED")}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                            >
                              Done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                        No matching patients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
