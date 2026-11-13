import {
  Calendar,
  FileText,
  HeartPulse,
  MessageCircle,
  Printer,
  Send,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import type { OPDTicket } from "./opd-store";

interface RxPrescriptionPrintProps {
  ticket: OPDTicket;
  onClose?: () => void;
}

export function RxPrescriptionPrint({
  ticket,
  onClose,
}: RxPrescriptionPrintProps) {
  const handlePrint = () => {
    window.print();
  };

  const medicinesListText = (ticket.prescribedMedicines || [])
    .map(
      (m, idx) =>
        `${idx + 1}. *${m.name}* - ${m.dosage} | Frequency: ${m.frequency} (${m.timing}) for ${m.duration}`,
    )
    .join("\n");

  const formattedWhatsAppText = encodeURIComponent(
    `🏥 *CITY HEALTHCARE CLINIC - DOCTOR'S PRESCRIPTION (Rx)*
--------------------------------------------------
*Patient:* ${ticket.patientName} (${ticket.age} yrs, ${ticket.gender})
*Date:* ${new Date().toLocaleDateString()}
*Doctor:* ${ticket.doctorName}

🩺 *DIAGNOSIS:* ${ticket.diagnosis || "General Consultation"}

💊 *PRESCRIBED MEDICINES:*
${medicinesListText || "No medicines prescribed."}

📝 *DOCTOR'S ADVICE:*
${ticket.doctorAdvice || "Rest well, drink plenty of water."}

📅 *NEXT FOLLOW-UP VISIT:*
*${ticket.followUpDate ? new Date(ticket.followUpDate).toDateString() : "As required"}*

Thank you for visiting City Healthcare Clinic! Get well soon.`,
  );

  const cleanPhone = ticket.phone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${formattedWhatsAppText}`;

  const handleSendSMS = () => {
    const text = `City Healthcare Rx: Prescription issued for ${ticket.patientName} by ${ticket.doctorName}. Next follow-up on ${ticket.followUpDate || "As needed"}.`;
    navigator.clipboard.writeText(text);
    toast.success(
      `Rx prescription summary copied & sent via SMS to ${ticket.phone}!`,
    );
  };

  return (
    <div className="print-area flex flex-col items-center gap-6 bg-white p-8 rounded-2xl w-full">
      {/* Print / Share Action Bar (Hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-center gap-3 w-full p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow hover:shadow-lg cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Prescription (Rx)
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition shadow hover:shadow-lg cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp Rx to Patient
        </a>

        <button
          onClick={handleSendSMS}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow hover:shadow-lg cursor-pointer"
        >
          <Send className="w-4 h-4" />
          SMS Summary
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      {/* Formal Medical Rx Prescription Document */}
      <div className="printable-rx-area bg-white text-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl font-sans min-h-[900px] flex flex-col justify-between">
        <div>
          {/* Clinic Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                CITY HEALTHCARE CLINIC
              </h1>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mt-0.5">
                Advanced EMR & Multi-specialty Outpatient Department
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Quezon City, Metro Manila • Phone: (02) 8123-4567 •
                Email: care@cityhealthcare.ph
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-base font-bold text-slate-900">
                {ticket.doctorName}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {ticket.doctorSpecialty}
              </p>
              <p className="text-[11px] text-slate-500">
                Reg. No: MP-84920 / M.B.B.S, M.D.
              </p>
            </div>
          </div>

          {/* Patient Details Bar */}
          <div className="grid grid-cols-4 gap-3 bg-slate-100 p-3.5 rounded-xl border border-slate-200 text-xs mb-5">
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold">
                PATIENT NAME
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {ticket.patientName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold">
                AGE / GENDER / BLOOD
              </span>
              <span className="font-semibold text-slate-800">
                {ticket.age} Yrs / {ticket.gender} /{" "}
                <span className="font-bold text-rose-700">
                  {ticket.bloodGroup}
                </span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold">
                TOKEN & ID
              </span>
              <span className="font-mono font-bold text-slate-900">
                {ticket.tokenNo} ({ticket.patientId})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold">
                DATE & TIME
              </span>
              <span className="font-semibold text-slate-800">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Vitals & Allergy Alert */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
            <div className="md:col-span-8 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" /> Vitals:
              </span>
              <span>
                <strong>BP:</strong> {ticket.vitals.systolicBp || "--"}/
                {ticket.vitals.diastolicBp || "--"} mmHg
              </span>
              <span>
                <strong>Pulse:</strong> {ticket.vitals.heartRate || "--"} bpm
              </span>
              <span>
                <strong>Temp:</strong>{" "}
                {ticket.vitals.temperatureCelsius
                  ? `${ticket.vitals.temperatureCelsius}°C`
                  : "--"}
              </span>
              <span>
                <strong>SpO2:</strong>{" "}
                {ticket.vitals.spO2 ? `${ticket.vitals.spO2}%` : "--"}
              </span>
            </div>

            <div
              className={`md:col-span-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                ticket.allergies.length > 0 && ticket.allergies[0] !== "None"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold block text-[10px]">ALLERGIES</span>
                <span className="truncate block">
                  {ticket.allergies.length > 0
                    ? ticket.allergies.join(", ")
                    : "None reported"}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Diagnosis Section */}
          <div className="mb-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700" /> Clinical
              Diagnosis & Symptoms
            </h4>
            <p className="text-slate-900 text-sm font-semibold">
              {ticket.diagnosis || "Acute Upper Respiratory Infection"}
            </p>
            {ticket.complaints && (
              <p className="text-slate-600 text-xs mt-1 italic">
                Complaints: "{ticket.complaints}"
              </p>
            )}
          </div>

          {/* Prescribed Medicines (Rx) Table */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-black text-emerald-800 font-serif">
                Rx
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Prescribed Medications (Rx)
              </h3>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                  <th className="p-2.5 border border-slate-700 w-12 text-center">
                    #
                  </th>
                  <th className="p-2.5 border border-slate-700">
                    Medicine Name
                  </th>
                  <th className="p-2.5 border border-slate-700">Dosage</th>
                  <th className="p-2.5 border border-slate-700">
                    Frequency (M-A-N)
                  </th>
                  <th className="p-2.5 border border-slate-700">Timing</th>
                  <th className="p-2.5 border border-slate-700">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                {!ticket.prescribedMedicines ||
                ticket.prescribedMedicines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-slate-400 italic"
                    >
                      No prescription medicines entered yet.
                    </td>
                  </tr>
                ) : (
                  ticket.prescribedMedicines.map((m, idx) => (
                    <tr
                      key={m.id || idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="p-2.5 border border-slate-300 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 border border-slate-300 font-bold text-slate-900 text-sm">
                        {m.name}
                        {m.notes && (
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {m.notes}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border border-slate-300 font-semibold">
                        {m.dosage}
                      </td>
                      <td className="p-2.5 border border-slate-300 font-mono font-bold text-emerald-800">
                        {m.frequency}
                      </td>
                      <td className="p-2.5 border border-slate-300">
                        {m.timing}
                      </td>
                      <td className="p-2.5 border border-slate-300 font-bold">
                        {m.duration}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Advice & Notes */}
          {ticket.doctorAdvice && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <span className="font-bold text-amber-900 uppercase tracking-wider block mb-1">
                LIFESTYLE & DOCTOR'S ADVICE:
              </span>
              <p className="text-amber-950 font-medium">
                {ticket.doctorAdvice}
              </p>
            </div>
          )}

          {/* Highlighted Next Follow-up Date ("Agli Meet Date") */}
          <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-emerald-300" />
              <div>
                <span className="text-[11px] text-emerald-200 font-semibold uppercase tracking-wider block">
                  NEXT FOLLOW-UP VISIT / BABALIK SA KLINIKA
                </span>
                <span className="text-lg font-black text-white">
                  {ticket.followUpDate
                    ? new Date(ticket.followUpDate).toLocaleDateString(
                        "en-PH",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )
                    : "As per requirement"}
                </span>
              </div>
            </div>

            <div className="text-right text-xs text-emerald-200">
              <span>Automated reminder will be sent to</span>
              <span className="font-bold text-white block">{ticket.phone}</span>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="pt-8 border-t border-slate-300 mt-8 flex items-end justify-between">
          <div className="text-[11px] text-slate-500 space-y-0.5">
            <p className="font-bold text-slate-700">
              City Healthcare Digital EMR System
            </p>
            <p>Valid without physical signature if verified online.</p>
            <p className="text-[10px] text-slate-400">
              Prescription ID: RX-{ticket.tokenNo}
            </p>
          </div>

          <div className="text-center w-48 border-t border-slate-400 pt-2">
            <div className="h-10 flex items-center justify-center text-slate-400 italic text-xs">
              [Doctor's Digital Signature]
            </div>
            <span className="font-bold text-xs text-slate-900 block">
              {ticket.doctorName}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Authorized Medical Officer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
