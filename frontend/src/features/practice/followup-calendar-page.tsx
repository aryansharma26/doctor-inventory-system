import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getStoredTickets,
  type OPDTicket,
  updateTicketStatus,
} from "./opd-store";
import { SMSReminderModal } from "./sms-reminder-modal";

export function FollowUpCalendarPage() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedReminderPatient, setSelectedReminderPatient] = useState<{
    patientName: string;
    phone: string;
    followUpDate?: string;
    doctorName: string;
    diagnosis?: string;
  } | null>(null);

  useEffect(() => {
    setTickets(getStoredTickets());
    const handleUpdate = () => setTickets(getStoredTickets());
    window.addEventListener("opd-store-update", handleUpdate);
    return () => window.removeEventListener("opd-store-update", handleUpdate);
  }, []);

  // Calendar generation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();

  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] =
    [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    days.push({
      dateStr: d.toISOString().split("T")[0],
      dayNum: prevMonthDays - i,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    // Format YYYY-MM-DD manually to prevent timezone offset shifts
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(i).padStart(2, "0");
    const dateStr = `${year}-${monthStr}-${dayStr}`;

    days.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSendWhatsAppReminder = (ticket: OPDTicket) => {
    setSelectedReminderPatient({
      patientName: ticket.patientName,
      phone: ticket.phone || "09170000000",
      followUpDate: ticket.followUpDate,
      doctorName: ticket.doctorName || "Doctor",
      diagnosis: ticket.diagnosis,
    });
    setIsReminderModalOpen(true);
  };

  const handleSendSMSReminder = (ticket: OPDTicket) => {
    setSelectedReminderPatient({
      patientName: ticket.patientName,
      phone: ticket.phone || "09170000000",
      followUpDate: ticket.followUpDate,
      doctorName: ticket.doctorName || "Doctor",
      diagnosis: ticket.diagnosis,
    });
    setIsReminderModalOpen(true);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  // Tickets mapped by follow-up date
  const ticketsForSelectedDate = tickets.filter(
    (p) => p.followUpDate === selectedDateStr,
  );

  const todaysFollowUps = tickets.filter(
    (p) =>
      p.followUpDate === todayStr ||
      (p.followUpDate &&
        p.followUpDate <= todayStr &&
        p.status === "COMPLETED"),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" /> Patient Follow-Up Calendar &
            Notification Hub
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Smart Return Visit Reminders
          </h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Track scheduled patient return dates, view daily return
            visits, and dispatch instant WhatsApp & SMS reminders.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              todaysFollowUps.forEach((p) => {
                updateTicketStatus(p.id, p.status, {
                  reminderSent: true,
                  reminderSentAt: new Date().toISOString(),
                });
              });
              toast.success(
                `Bulk WhatsApp/SMS reminders dispatched to all ${todaysFollowUps.length} return patients!`,
              );
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Bulk Send Morning Reminders (
            {todaysFollowUps.length})
          </button>

          <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-emerald-300 font-bold uppercase block">
              TODAY'S RETURN VISITS
            </span>
            <span className="text-2xl font-black text-amber-400">
              {todaysFollowUps.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Month Calendar (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {currentDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDateStr(new Date().toISOString().split("T")[0]);
                }}
                className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((d, idx) => {
              const matched = tickets.filter(
                (p) => p.followUpDate === d.dateStr,
              );
              const isSelected = selectedDateStr === d.dateStr;
              const isToday = todayStr === d.dateStr;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateStr(d.dateStr)}
                  className={`min-h-[85px] p-2 rounded-2xl border text-left transition flex flex-col justify-between relative cursor-pointer ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 shadow-md ring-2 ring-emerald-500/20"
                      : isToday
                        ? "border-amber-400 bg-amber-50/60"
                        : d.isCurrentMonth
                          ? "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                          : "border-slate-100 bg-slate-50/20 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black rounded-full w-6 h-6 flex items-center justify-center ${
                        isToday
                          ? "bg-amber-500 text-white shadow"
                          : d.isCurrentMonth
                            ? "text-slate-800"
                            : "text-slate-300"
                      }`}
                    >
                      {d.dayNum}
                    </span>

                    {matched.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-full">
                        {matched.length}
                      </span>
                    )}
                  </div>

                  {matched.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {matched.slice(0, 2).map((mp) => (
                        <div
                          key={mp.id}
                          className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] truncate rounded"
                        >
                          {mp.patientName}
                        </div>
                      ))}
                      {matched.length > 2 && (
                        <span className="text-[9px] text-slate-500 font-bold block text-right">
                          +{matched.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Date Follow-Up List & WhatsApp Action (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  SCHEDULED FOLLOW-UPS
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {new Date(selectedDateStr).toLocaleDateString("en-PH", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h2>
              </div>

              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-full">
                {ticketsForSelectedDate.length} Patients
              </span>
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {ticketsForSelectedDate.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50 text-emerald-500" />
                <p className="text-sm font-semibold">
                  No return follow-up visits scheduled for this date.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Select another date on the calendar to view return visits.
                </p>
              </div>
            ) : (
              ticketsForSelectedDate.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-emerald-300 transition space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold rounded">
                        {p.tokenNo}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1">
                        {p.patientName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {p.age} yrs • {p.gender} • Phone: {p.phone}
                      </p>
                    </div>

                    {p.reminderSent && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Reminder Sent
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <div>
                      <span className="font-semibold text-slate-500">
                        Diagnosis:{" "}
                      </span>
                      <span className="font-bold text-slate-800">
                        {p.diagnosis || "Consultation"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">
                        Doctor:{" "}
                      </span>
                      <span className="font-bold text-slate-800">
                        {p.doctorName}
                      </span>
                    </div>
                  </div>

                  {/* Direct WhatsApp & SMS Dispatch Toolbar */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSendWhatsAppReminder(p)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp Reminder
                    </button>

                    <button
                      onClick={() => handleSendSMSReminder(p)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      SMS Alert
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <SMSReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        patient={selectedReminderPatient}
      />
    </div>
  );
}
