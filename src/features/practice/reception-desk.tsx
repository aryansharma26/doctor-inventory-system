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
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  Phone,
  Printer,
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
    toast.success(`Token ${tokenNo} created for ${patientName}`);

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
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Waiting in OPD
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
              {waitingCount}
            </div>
          </div>
          <span className="badge badge-amber text-xs font-semibold px-2 py-1">
            <Clock className="w-3 h-3" /> Queue
          </span>
        </div>

        <div className="panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              In Doctor Cabin
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
              {inConsultCount}
            </div>
          </div>
          <span className="badge badge-blue text-xs font-semibold px-2 py-1">
            <Stethoscope className="w-3 h-3" /> Active
          </span>
        </div>

        <div className="panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Completed Today
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
              {completedToday}
            </div>
          </div>
          <span className="badge badge-green text-xs font-semibold px-2 py-1">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        </div>

        <div className="panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Today's Collections
            </div>
            <div className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
              {formatPhp(totalRevenueToday)}
            </div>
          </div>
          <span className="badge badge-zinc text-xs font-semibold px-2 py-1">
            <Coins className="w-3 h-3" /> Cashier
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Check-in & New Token Form */}
        <div className="lg:col-span-5">
          <div className="panel">
            <div className="panel-header">
              <span className="font-semibold text-sm text-zinc-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-zinc-600" /> Patient Check-In & Token
              </span>
              <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                Next: {getNextTokenNumber()}
              </span>
            </div>

            <form onSubmit={handleCreateTicket} className="p-4 space-y-4">
              {/* Patient Basic Info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Clara Santos"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Phone Number (+63)
                    </label>
                    <input
                      type="text"
                      placeholder="+63 917 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option>O+</option>
                      <option>A+</option>
                      <option>B+</option>
                      <option>AB+</option>
                      <option>O-</option>
                      <option>A-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Chief Complaint / Symptoms
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fever 2 days, dry cough, sore throat"
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Vitals Recording Section */}
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Vitals Measurement
                  </span>
                  {alerts.length > 0 && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {alerts.length} Alert{alerts.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">BP (Systolic)</span>
                    <input
                      type="number"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(Number(e.target.value))}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">BP (Diastolic)</span>
                    <input
                      type="number"
                      value={diastolicBp}
                      onChange={(e) => setDiastolicBp(Number(e.target.value))}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">Heart Rate</span>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">Temp (°C)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={temperatureCelsius}
                      onChange={(e) => setTemperatureCelsius(Number(e.target.value))}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">SpO2 (%)</span>
                    <input
                      type="number"
                      value={spO2}
                      onChange={(e) => setSpO2(Number(e.target.value))}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">Weight (kg)</span>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Live CDS Alert Box if vitals abnormal */}
                {alerts.length > 0 && (
                  <div className="mt-2.5 p-2 rounded bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                    {alerts.map((a, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-amber-900 font-medium text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span className="font-semibold">{a.label}:</span> {a.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cashier Payment Details */}
              <div className="pt-2 border-t border-zinc-100 space-y-2">
                <span className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Payment Collection (₱ PHP)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">Consultation Fee</span>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(Number(e.target.value))}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">Vitals Check Fee</span>
                    <input
                      type="number"
                      value={vitalsFee}
                      onChange={(e) => setVitalsFee(Number(e.target.value))}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">Payment Method</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="input-field cursor-pointer text-xs"
                    >
                      <option value="GCASH">GCash</option>
                      <option value="MAYA">Maya</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Debit / Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-0.5">Reference No. (Optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. 98124971"
                      value={gcashRef}
                      onChange={(e) => setGcashRef(e.target.value)}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                  <span className="text-zinc-600 font-medium">Total Payable:</span>
                  <span className="text-zinc-950 font-bold font-mono text-sm">
                    {formatPhp(consultationFee + vitalsFee)}
                  </span>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center py-2.5">
                Issue Token & Queue Patient <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Live Queue List & Management */}
        <div className="lg:col-span-7">
          <div className="panel">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900">
                  Live Daily Queue
                </span>
                <span className="badge badge-zinc font-mono text-[11px]">
                  {filteredTickets.length} Patients
                </span>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1 text-xs">
                {["ALL", "WAITING", "IN_CONSULTATION", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors text-[11px] ${
                      filterStatus === st
                        ? "bg-zinc-900 text-white font-semibold"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {st === "IN_CONSULTATION" ? "Cabin" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="p-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search patient name, token, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-zinc-900 outline-none w-full placeholder:text-zinc-400"
              />
            </div>

            {/* Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="table-header">Token</th>
                    <th className="table-header">Patient</th>
                    <th className="table-header">Vitals</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Paid</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-xs text-zinc-400">
                        No patients found in queue
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => {
                      const v = t.vitals;
                      return (
                        <tr key={t.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="table-cell font-mono font-bold text-zinc-900">
                            {t.tokenNo}
                          </td>
                          <td className="table-cell">
                            <div className="font-semibold text-zinc-900">
                              {t.patientName}
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              <span>{t.age}y / {t.gender}</span>
                              <span>·</span>
                              <span className="font-mono">{t.phone}</span>
                            </div>
                          </td>
                          <td className="table-cell font-mono text-xs text-zinc-600">
                            {v.systolicBp && v.diastolicBp ? (
                              <span>{v.systolicBp}/{v.diastolicBp} mmHg</span>
                            ) : (
                              "—"
                            )}
                            {v.spO2 && (
                              <span className="block text-[11px] text-zinc-400">
                                SpO2: {v.spO2}%
                              </span>
                            )}
                          </td>
                          <td className="table-cell">
                            {t.status === "WAITING" && (
                              <span className="badge badge-amber">Waiting</span>
                            )}
                            {t.status === "IN_CONSULTATION" && (
                              <span className="badge badge-blue">In Cabin</span>
                            )}
                            {t.status === "COMPLETED" && (
                              <span className="badge badge-green">Completed</span>
                            )}
                            {t.status === "CANCELLED" && (
                              <span className="badge badge-zinc">Cancelled</span>
                            )}
                          </td>
                          <td className="table-cell font-mono text-xs">
                            <div className="font-medium text-zinc-900">
                              {formatPhp(t.billing?.totalAmountPhp || 0)}
                            </div>
                            <span className="text-[10px] text-zinc-400 uppercase">
                              {t.billing?.paymentMethod}
                            </span>
                          </td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {t.status === "WAITING" && (
                                <button
                                  onClick={() => handleStatusChange(t.id, "IN_CONSULTATION")}
                                  className="btn-primary text-[11px] py-1 px-2"
                                  title="Send patient into Doctor's Cabin"
                                >
                                  Call In
                                </button>
                              )}
                              {t.status === "IN_CONSULTATION" && (
                                <button
                                  onClick={() => handleStatusChange(t.id, "COMPLETED")}
                                  className="btn-secondary text-[11px] py-1 px-2 text-emerald-700"
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  toast.info(`Printing Official Ticket #${t.tokenNo}`);
                                  window.print();
                                }}
                                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-100"
                                title="Print Token / Receipt"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
