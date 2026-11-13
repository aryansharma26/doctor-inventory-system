import {
  Clock,
  Download,
  HeartPulse,
  Phone,
  Printer,
  Search,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Volume2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getNextTokenNumber,
  getStoredTickets,
  type OPDTicket,
  saveTicket,
} from "./opd-store";
import { OPDTicketPrint } from "./opd-ticket-print";
import { announcePatientCall } from "./clinic-announcer";
import { exportTicketsToCsv, interpretVitals } from "./vitals-helper";

export function ReceptionDesk() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "WAITING" | "IN_CONSULTATION" | "COMPLETED"
  >("ALL");
  const [activeModalTicket, setActiveModalTicket] = useState<OPDTicket | null>(
    null,
  );

  // Form State
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<number | "">(30);
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [area, setArea] = useState("");
  const [allergiesText, setAllergiesText] = useState("");
  const [complaints, setComplaints] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Jose Rizal, MD");
  const [doctorSpecialty, setDoctorSpecialty] = useState(
    "General & Family Medicine",
  );

  // Vitals State
  const [systolicBp, setSystolicBp] = useState<number | "">(120);
  const [diastolicBp, setDiastolicBp] = useState<number | "">(80);
  const [heartRate, setHeartRate] = useState<number | "">(72);
  const [tempCelsius, setTempCelsius] = useState<number | "">(37.0);
  const [weightKg, setWeightKg] = useState<number | "">(65);
  const [spO2, setSpO2] = useState<number | "">(98);

  useEffect(() => {
    setTickets(getStoredTickets());
    const handleUpdate = () => setTickets(getStoredTickets());
    window.addEventListener("opd-store-update", handleUpdate);
    return () => window.removeEventListener("opd-store-update", handleUpdate);
  }, []);

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter patient contact phone number");
      return;
    }

    const allergiesArray = allergiesText
      ? allergiesText
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean)
      : ["None"];

    const tokenNo = getNextTokenNumber();
    const newTicket: OPDTicket = {
      id: `ticket-${Date.now()}`,
      tokenNo,
      patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientName.trim(),
      phone: phone.trim(),
      age: Number(age) || 30,
      gender,
      bloodGroup,
      area: area.trim(),
      allergies: allergiesArray,
      vitals: {
        systolicBp: Number(systolicBp) || undefined,
        diastolicBp: Number(diastolicBp) || undefined,
        heartRate: Number(heartRate) || undefined,
        temperatureCelsius: Number(tempCelsius) || undefined,
        weightKg: Number(weightKg) || undefined,
        spO2: Number(spO2) || undefined,
      },
      complaints: complaints.trim() || "General Checkup",
      doctorName,
      doctorSpecialty,
      checkInTime: new Date().toISOString(),
      status: "WAITING",
    };

    saveTicket(newTicket);
    setActiveModalTicket(newTicket);
    toast.success(
      `Check-in complete! Token ${tokenNo} generated for ${newTicket.patientName}`,
    );

    // Reset Form
    setPatientName("");
    setPhone("");
    setArea("");
    setComplaints("");
    setAllergiesText("");
  };

  const filteredTickets = tickets.filter((p) => {
    const matchesQuery =
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.tokenNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || p.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const waitingCount = tickets.filter((p) => p.status === "WAITING").length;
  const inConsultCount = tickets.filter(
    (p) => p.status === "IN_CONSULTATION",
  ).length;
  const completedCount = tickets.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" /> Receptionist OPD Desk
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Patient Onboarding & Ticket Terminal
          </h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Register arriving patients, record initial vitals & allergies, print
            OPD slips, and notify via WhatsApp/SMS.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-emerald-300 font-semibold block uppercase">
              LIVE CLOCK
            </span>
            <LiveClock />
          </div>
          <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-emerald-300 font-semibold block uppercase">
              WAITING
            </span>
            <span className="text-2xl font-black text-amber-400">
              {waitingCount}
            </span>
          </div>
          <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-emerald-300 font-semibold block uppercase">
              IN CONSULT
            </span>
            <span className="text-2xl font-black text-sky-400">
              {inConsultCount}
            </span>
          </div>
          <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-emerald-300 font-semibold block uppercase">
              DONE TODAY
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {completedCount}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Fast Patient Check-In Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Patient OPD Registration
                </h2>
                <p className="text-xs text-slate-500">
                  Create new OPD token & record reception vitals
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCheckInSubmit} className="space-y-4">
            {/* Patient Personal Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / Mobile *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+63 917 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Age & Gender
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={(e) =>
                        setAge(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-16 px-2 py-2.5 rounded-xl border border-slate-300 text-sm text-center font-bold"
                    />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-2 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-rose-700"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Known Allergies
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa"
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 text-xs font-semibold text-rose-900 placeholder:text-rose-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Area / Locality
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tondo, Manila"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Reception Vitals Recorder */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <HeartPulse className="w-4 h-4 text-emerald-600" /> Vitals Check
                (Taken at Desk)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    BP Systolic
                  </span>
                  <input
                    type="number"
                    placeholder="120"
                    value={systolicBp}
                    onChange={(e) =>
                      setSystolicBp(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    BP Diastolic
                  </span>
                  <input
                    type="number"
                    placeholder="80"
                    value={diastolicBp}
                    onChange={(e) =>
                      setDiastolicBp(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    Pulse (bpm)
                  </span>
                  <input
                    type="number"
                    placeholder="72"
                    value={heartRate}
                    onChange={(e) =>
                      setHeartRate(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    Temp (°C)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="37.0"
                    value={tempCelsius}
                    onChange={(e) =>
                      setTempCelsius(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    Weight (kg)
                  </span>
                  <input
                    type="number"
                    placeholder="65"
                    value={weightKg}
                    onChange={(e) =>
                      setWeightKg(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    SpO2 (%)
                  </span>
                  <input
                    type="number"
                    placeholder="98"
                    value={spO2}
                    onChange={(e) =>
                      setSpO2(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center"
                  />
                </div>
              </div>
            </div>

            {/* Complaints & Doctor Assignment */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Chief Complaint / Reason for Visit
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fever, cough, joint pain..."
                  value={complaints}
                  onChange={(e) => setComplaints(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-medium text-slate-900"
                />
                {/* Chief Complaint Quick Chips */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {[
                    "Fever (Lagnat)",
                    "Cough & Cold",
                    "Headache",
                    "Stomach Pain",
                    "Hypertension / BP Check",
                    "Diabetes Check",
                    "Body Pain / Fatigue",
                    "Allergy Rash",
                    "Wound Dressing",
                    "Medicine Refill",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setComplaints((prev) =>
                          prev ? `${prev}, ${chip}` : chip,
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                  {complaints && (
                    <button
                      type="button"
                      onClick={() => setComplaints("")}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Doctor
                </label>
                <select
                  value={doctorName}
                  onChange={(e) => {
                    setDoctorName(e.target.value);
                    if (e.target.value.includes("Santos")) {
                      setDoctorSpecialty("Obstetrics & Gynecology");
                    } else if (e.target.value.includes("Luna")) {
                      setDoctorSpecialty("Internal Medicine & Cardiology");
                    } else {
                      setDoctorSpecialty("General & Family Medicine");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                >
                  <option value="Dr. Jose Rizal, MD">
                    Dr. Jose Rizal, MD (General & Family Medicine)
                  </option>
                  <option value="Dr. Maria Santos, MD">
                    Dr. Maria Santos, MD (Obstetrics & Gynecology)
                  </option>
                  <option value="Dr. Antonio Luna, MD">
                    Dr. Antonio Luna, MD (Internal Medicine & Cardiology)
                  </option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <UserPlus className="w-5 h-5" />
              Generate Token & OPD Ticket
            </button>
          </form>
        </div>

        {/* Right Column: Live OPD Queue & Quick Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Today's OPD Queue & Tickets
                </h2>
                <p className="text-xs text-slate-500">
                  Live check-in tokens awaiting consultation
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search token, name, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium w-full sm:w-52 focus:bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (tickets.length === 0) {
                      toast.info("No OPD records to export today");
                      return;
                    }
                    exportTicketsToCsv(tickets, "Clinic_OPD_Register");
                    toast.success("Today's OPD Register exported to CSV!");
                  }}
                  title="Export Today's OPD Register to CSV"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-200 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Queue Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-slate-100">
              {[
                { key: "ALL", label: "All", count: tickets.length },
                { key: "WAITING", label: "Waiting", count: waitingCount },
                {
                  key: "IN_CONSULTATION",
                  label: "In Consultation",
                  count: inConsultCount,
                },
                {
                  key: "COMPLETED",
                  label: "Completed",
                  count: completedCount,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      tab.key as
                        | "ALL"
                        | "WAITING"
                        | "IN_CONSULTATION"
                        | "COMPLETED",
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.key
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      statusFilter === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-700 shadow-2xs"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">
                    No check-ins match your search.
                  </p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-emerald-400 font-mono font-black text-xs rounded-lg">
                          {ticket.tokenNo}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            ticket.status === "WAITING"
                              ? "bg-amber-100 text-amber-800"
                              : ticket.status === "IN_CONSULTATION"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {ticket.status === "WAITING"
                            ? "Waiting"
                            : ticket.status === "IN_CONSULTATION"
                              ? "In Consultation"
                              : "Completed"}
                        </span>

                        <span className="text-xs text-slate-400">
                          {new Date(ticket.checkInTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-base">
                        {ticket.patientName}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          ({ticket.age}y, {ticket.gender}, {ticket.bloodGroup})
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3">
                        <span>📞 {ticket.phone}</span>
                        <span>🩺 {ticket.doctorName}</span>
                      </div>

                      {/* Vitals Clinical Alerts */}
                      {interpretVitals(ticket.vitals).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {interpretVitals(ticket.vitals).map((alert, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                alert.severity === "danger"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              ⚠️ {alert.label}: {alert.message}
                            </span>
                          ))}
                        </div>
                      )}

                      {ticket.allergies.length > 0 &&
                        ticket.allergies[0] !== "None" && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                            <ShieldAlert className="w-3 h-3" /> Allergy:{" "}
                            {ticket.allergies.join(", ")}
                          </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ticket.status !== "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() => {
                            announcePatientCall(
                              ticket.tokenNo,
                              ticket.patientName,
                              ticket.doctorName || "Doctor's Room",
                            );
                            toast.info(
                              `Calling Token ${ticket.tokenNo} (${ticket.patientName})...`,
                            );
                          }}
                          title="Call patient using Audio Chime & Speech"
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveModalTicket(ticket)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Ticket / Send
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog for OPD Ticket Preview & Print */}
      {activeModalTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setActiveModalTicket(null)}
        >
          <div
            className="w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <OPDTicketPrint
              ticket={activeModalTicket}
              onClose={() => setActiveModalTicket(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  return (
    <span className="text-2xl font-black text-white font-mono tabular-nums">
      {hours}
      <span
        className={time.getSeconds() % 2 === 0 ? "opacity-100" : "opacity-30"}
      >
        :
      </span>
      {minutes}
      <span className="text-lg text-white/50">:{seconds}</span>
    </span>
  );
}
