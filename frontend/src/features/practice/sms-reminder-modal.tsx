import {
  CheckCircle,
  Copy,
  MessageCircle,
  Phone,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export interface PatientReminderDetails {
  patientName: string;
  phone: string;
  followUpDate?: string;
  doctorName: string;
  diagnosis?: string;
}

interface SMSReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientReminderDetails | null;
}

export function SMSReminderModal({
  isOpen,
  onClose,
  patient,
}: SMSReminderModalProps) {
  const [message, setMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendMethod, setSendMethod] = useState<"whatsapp" | "sms" | null>(null);

  useEffect(() => {
    if (patient) {
      const followUpDateStr = patient.followUpDate || "TBD";
      const diagnosisStr = patient.diagnosis || "Checkup";

      const defaultMessage = `Good day, ${patient.patientName}! 🏥\n\nThis is a friendly reminder from MediStock Clinic about your scheduled follow-up visit.\n\n📅 Follow-up Date: ${followUpDateStr}\n👨‍⚕️ Doctor: ${patient.doctorName}\n📋 Regarding: ${diagnosisStr}\n\nPlease arrive 15 minutes early for vital checks.\n\nFor questions, reply to this message or call +63-XXX-XXX-XXXX.\n\nThank you! Stay healthy! 💚\n- MediStock Clinic Management`;

      setMessage(defaultMessage);
    }
  }, [patient]);

  useEffect(() => {
    if (!isOpen) {
      setIsSent(false);
      setSendMethod(null);
      setIsCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !patient) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleWhatsApp = () => {
    let phone = patient.phone.replace(/\D/g, "");
    if (!phone.startsWith("63")) {
      if (phone.startsWith("09")) {
        phone = "63" + phone.substring(1);
      }
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");

    setSendMethod("whatsapp");
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 3000);
  };

  const handleSMS = () => {
    setSendMethod("sms");
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 3000);
  };

  const displayPhone =
    patient.phone.startsWith("+63") || patient.phone.startsWith("63")
      ? patient.phone
      : `+63 ${patient.phone.replace(/^0/, "")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Send Reminder
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSent ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Reminder Sent!
            </h3>
            <p className="text-gray-500">
              Successfully sent via{" "}
              {sendMethod === "whatsapp" ? "WhatsApp" : "SMS"} to
              <br />
              <span className="font-semibold text-gray-800">
                {patient.patientName}
              </span>
            </p>
          </div>
        ) : (
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Recipient
                </span>
                <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {displayPhone}
                </span>
              </div>
              <div className="font-medium text-gray-900 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                {patient.patientName}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-gray-700"
                >
                  Message Preview
                </label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
                >
                  {isCopied ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {isCopied ? "Copied!" : "Copy text"}
                </button>
              </div>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-64 p-3 text-sm text-gray-700 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-blue-50/30 font-sans"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        {!isSent && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSMS}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              Send via SMS
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#20bd5a] transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              Send via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
