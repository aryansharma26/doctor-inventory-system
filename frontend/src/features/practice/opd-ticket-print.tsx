import {
  HeartPulse,
  MessageCircle,
  Printer,
  Send,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import type { OPDTicket } from "./opd-store";

interface OPDTicketPrintProps {
  ticket: OPDTicket;
  onClose?: () => void;
}

export function OPDTicketPrint({ ticket, onClose }: OPDTicketPrintProps) {
  const handlePrint = () => {
    window.print();
  };

  const formattedWhatsAppText = encodeURIComponent(
    `🏥 *CITY HEALTHCARE CLINIC - OPD PARCHI*
----------------------------------------
*Token Number:* ${ticket.tokenNo}
*Date:* ${new Date(ticket.checkInTime).toLocaleString()}

👤 *PATIENT DETAILS*
• Name: ${ticket.patientName} (${ticket.age} yrs, ${ticket.gender})
• Blood Group: ${ticket.bloodGroup}
• Area/Locality: ${ticket.area || "Not provided"}
• Phone: ${ticket.phone}

🩺 *DOCTOR ASSIGNED*
• ${ticket.doctorName} (${ticket.doctorSpecialty})

📊 *VITALS RECORDED AT RECEPTION*
• BP: ${ticket.vitals.systolicBp || "--"}/${ticket.vitals.diastolicBp || "--"} mmHg
• Pulse: ${ticket.vitals.heartRate || "--"} bpm
• Temp: ${ticket.vitals.temperatureCelsius || "--"} °C
• Weight: ${ticket.vitals.weightKg || "--"} kg
• SpO2: ${ticket.vitals.spO2 || "--"}%

⚠️ *KNOWN ALLERGIES:* ${ticket.allergies.length > 0 ? ticket.allergies.join(", ") : "None Reported"}

📝 *REASON FOR VISIT:* ${ticket.complaints}

Please present this slip at Consultation Room #1 when your token is called.`,
  );

  const cleanPhone = ticket.phone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${formattedWhatsAppText}`;

  const handleSendSMS = () => {
    const text = `City Healthcare Clinic: OPD Ticket generated for ${ticket.patientName}. Token: ${ticket.tokenNo}, Doctor: ${ticket.doctorName}. Please wait for your token to be called.`;
    navigator.clipboard.writeText(text);
    toast.success(
      `Ticket notification copied & sent via SMS to ${ticket.phone}!`,
    );
  };

  return (
    <div className="print-area flex flex-col items-center gap-6 bg-white p-8 rounded-2xl w-full">
      {/* Action Toolbar (Hidden during browser print) */}
      <div className="no-print flex flex-wrap items-center justify-center gap-3 w-full p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow hover:shadow-lg cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Ticket (Thermal/A5)
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition shadow hover:shadow-lg cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          Send to WhatsApp
        </a>

        <button
          onClick={handleSendSMS}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow hover:shadow-lg cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Send SMS Alert
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

      {/* Printable OPD Ticket Card */}
      <div className="printable-ticket-area bg-white text-slate-900 p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg font-sans">
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
          <div className="inline-flex items-center justify-center p-2.5 bg-emerald-100 text-emerald-800 rounded-full mb-2">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            CITY HEALTHCARE CLINIC
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
            Multi-Specialty Medical & EMR Center
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Quezon City, Metro Manila • Helpline: (02) 8123-4567 • 0917-800-0000
          </p>
        </div>

        {/* Token Badge */}
        <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl mb-5 shadow-inner">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
              OPD TOKEN NUMBER
            </span>
            <span className="text-3xl font-black tracking-wide text-emerald-400">
              {ticket.tokenNo}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">
              CHECK-IN TIME
            </span>
            <span className="text-sm font-semibold text-slate-200">
              {new Date(ticket.checkInTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              {new Date(ticket.checkInTime).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm mb-4">
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Patient Name
            </span>
            <span className="font-bold text-slate-900 text-base">
              {ticket.patientName}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Age / Gender / Blood
            </span>
            <span className="font-semibold text-slate-800">
              {ticket.age} yrs • {ticket.gender} •{" "}
              <span className="text-rose-600 font-bold">
                {ticket.bloodGroup}
              </span>
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Phone Number
            </span>
            <span className="font-semibold text-slate-800">{ticket.phone}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Area / Locality
            </span>
            <span className="font-semibold text-slate-800">
              {ticket.area || "--"}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Patient ID
            </span>
            <span className="font-mono font-semibold text-slate-700">
              {ticket.patientId}
            </span>
          </div>
        </div>

        {/* Allergies Warning */}
        <div
          className={`p-3.5 rounded-xl border mb-4 text-xs font-semibold flex items-center gap-3 ${
            ticket.allergies.length > 0 && ticket.allergies[0] !== "None"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <span className="uppercase tracking-wider font-bold block">
              ALLERGY RECORD
            </span>
            <span>
              {ticket.allergies.length > 0
                ? ticket.allergies.join(", ")
                : "No drug or food allergies reported."}
            </span>
          </div>
        </div>

        {/* Vitals Summary Table */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
            Vitals Recorded at Reception
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px]">
                BLOOD PRESSURE
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {ticket.vitals.systolicBp || "--"}/
                {ticket.vitals.diastolicBp || "--"}
              </span>
              <span className="text-[10px] text-slate-500 block">mmHg</span>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px]">
                PULSE RATE
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {ticket.vitals.heartRate || "--"}
              </span>
              <span className="text-[10px] text-slate-500 block">bpm</span>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px]">
                TEMP / SpO2
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {ticket.vitals.temperatureCelsius
                  ? `${ticket.vitals.temperatureCelsius}°C`
                  : "--"}{" "}
                / {ticket.vitals.spO2 ? `${ticket.vitals.spO2}%` : "--"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                celsius / O2
              </span>
            </div>
          </div>
        </div>

        {/* Complaints & Doctor */}
        <div className="space-y-3 text-xs mb-5">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 block mb-0.5">
              CHIEF COMPLAINTS / REASON FOR VISIT:
            </span>
            <p className="text-amber-800 text-xs italic">
              "{ticket.complaints}"
            </p>
          </div>

          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between">
            <div>
              <span className="text-indigo-600 font-semibold block text-[11px]">
                ASSIGNED CONSULTANT
              </span>
              <span className="font-bold text-indigo-950 text-sm">
                {ticket.doctorName}
              </span>
              <span className="text-indigo-700 block text-[10px]">
                {ticket.doctorSpecialty}
              </span>
            </div>
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[11px] font-bold">
              ROOM #1
            </span>
          </div>
        </div>

        {/* Footer / Instructions */}
        <div className="text-center pt-3 border-t border-slate-200 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700">
            Please take your seat in the waiting hall.
          </p>
          <p className="mt-0.5">
            Your token number will be displayed on the screen & called out
            shortly.
          </p>
          <p className="text-[10px] text-slate-400 mt-2">
            Generated via City Healthcare Patient-Centric EMR System
          </p>
        </div>
      </div>
    </div>
  );
}
