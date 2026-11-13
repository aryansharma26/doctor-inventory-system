import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  addWeeks,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Stethoscope,
} from "lucide-react";
import {
  cloneElement,
  type ReactElement,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  practiceKeys,
  useAppointments,
  usePracticeOptions,
} from "./practice-queries";
import type { Appointment } from "./types";

const statusStyles: Record<string, string> = {
  BOOKED: "border-blue-200 bg-blue-50 text-blue-800",
  CONFIRMED: "border-indigo-200 bg-indigo-50 text-indigo-800",
  CHECKED_IN: "border-amber-200 bg-amber-50 text-amber-800",
  IN_CONSULTATION: "border-violet-200 bg-violet-50 text-violet-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  NO_SHOW: "border-slate-200 bg-slate-100 text-slate-600",
};

const initialForm = () => ({
  patientId: "",
  doctorMembershipId: "",
  type: "CONSULTATION",
  date: format(new Date(), "yyyy-MM-dd"),
  startTime: "09:00",
  endTime: "09:30",
  reason: "",
  symptoms: "",
  notes: "",
  reminder: true,
});

export function SchedulePage() {
  const [searchParams] = useSearchParams();
  const [cursor, setCursor] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [view, setView] = useState<"week" | "day">("week");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const options = usePracticeOptions();
  const client = useQueryClient();
  const range = useMemo(() => {
    if (view === "day")
      return { from: startOfDay(cursor), to: endOfDay(cursor) };
    return {
      from: startOfWeek(cursor, { weekStartsOn: 1 }),
      to: endOfWeek(cursor, { weekStartsOn: 1 }),
    };
  }, [cursor, view]);
  const appointments = useAppointments(range.from, range.to);
  const days =
    view === "week"
      ? Array.from({ length: 7 }, (_, index) => addDays(range.from, index))
      : [cursor];
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (!patientId) return;
    setForm((current) => ({ ...current, patientId }));
    setOpen(true);
  }, [searchParams]);

  const create = useMutation({
    mutationFn: () => {
      const startsAt = new Date(`${form.date}T${form.startTime}`);
      const endsAt = new Date(`${form.date}T${form.endTime}`);
      return api<Appointment>("/practice/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: form.patientId,
          doctorMembershipId: form.doctorMembershipId,
          type: form.type,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          reason: form.reason || undefined,
          symptoms: form.symptoms || undefined,
          notes: form.notes || undefined,
          reminderAt: form.reminder
            ? new Date(startsAt.getTime() - 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Appointment booked");
      setOpen(false);
      setForm(initialForm());
      void client.invalidateQueries({ queryKey: practiceKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });

  const move = (direction: -1 | 1) => {
    setCursor((value) =>
      view === "week"
        ? direction === 1
          ? addWeeks(value, 1)
          : subWeeks(value, 1)
        : addDays(value, direction),
    );
  };

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Book visits, organise doctor calendars and keep the front desk in sync."
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} />
            New appointment
          </button>
        }
      />

      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <button
              className="icon-button"
              onClick={() => move(-1)}
              aria-label="Previous period"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="btn-secondary px-3! py-2!"
              onClick={() => setCursor(new Date())}
            >
              Today
            </button>
            <button
              className="icon-button"
              onClick={() => move(1)}
              aria-label="Next period"
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="lg:ml-3">
            <h3 className="font-semibold text-slate-900">
              {view === "week"
                ? `${format(range.from, "d MMM")} – ${format(range.to, "d MMM yyyy")}`
                : format(cursor, "EEEE, d MMMM yyyy")}
            </h3>
            <p className="text-xs text-slate-500">
              {appointments.data?.length ?? 0} scheduled visits
            </p>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-1 lg:ml-auto">
            {(["week", "day"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={cn(
                  "rounded-md px-4 py-2 text-xs font-semibold capitalize transition",
                  view === item
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "grid min-w-[760px]",
            view === "week" ? "grid-cols-7" : "grid-cols-1",
          )}
        >
          {days.map((day) => {
            const rows =
              appointments.data?.filter((appointment) =>
                isSameDay(new Date(appointment.startsAt), day),
              ) ?? [];
            return (
              <div
                key={day.toISOString()}
                className="min-h-[560px] border-r border-line last:border-r-0"
              >
                <div
                  className={cn(
                    "sticky top-[68px] z-10 border-b border-line bg-white px-3 py-3 text-center",
                    isSameDay(day, new Date()) && "bg-blue-50",
                  )}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "mx-auto mt-1 grid size-8 place-items-center rounded-full text-sm font-bold",
                      isSameDay(day, new Date()) && "bg-blue-600 text-white",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>
                <div className="space-y-2 p-2">
                  {rows.map((appointment) => (
                    <Link
                      key={appointment.id}
                      to={`/appointments/${appointment.id}`}
                      className={cn(
                        "rounded-lg border p-3",
                        statusStyles[appointment.status],
                      )}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        <Clock3 size={12} />
                        {format(new Date(appointment.startsAt), "h:mm a")}
                      </div>
                      <div className="mt-2 truncate text-sm font-bold">
                        {appointment.patient.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] opacity-75">
                        <Stethoscope size={11} />
                        Dr. {appointment.doctor.user.fullName}
                      </div>
                      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide">
                        {appointment.status.replaceAll("_", " ")}
                      </div>
                    </Link>
                  ))}
                  {!rows.length && (
                    <div className="py-10 text-center text-xs text-slate-300">
                      No appointments
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Book appointment"
        description="Add a patient to a doctor's calendar."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select
              className="field"
              value={form.patientId}
              onChange={(event) =>
                setForm({ ...form, patientId: event.target.value })
              }
            >
              <option value="">Select patient</option>
              {options.patients.data?.data.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} · {patient.patientCode}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Doctor">
            <select
              className="field"
              value={form.doctorMembershipId}
              onChange={(event) =>
                setForm({ ...form, doctorMembershipId: event.target.value })
              }
            >
              <option value="">Select doctor</option>
              {options.doctors.data?.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.user.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Visit type">
            <select
              className="field"
              value={form.type}
              onChange={(event) =>
                setForm({ ...form, type: event.target.value })
              }
            >
              <option value="CONSULTATION">Consultation</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="PROCEDURE">Procedure</option>
              <option value="VACCINATION">Vaccination</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="field"
              value={form.date}
              onChange={(event) =>
                setForm({ ...form, date: event.target.value })
              }
            />
          </Field>
          <Field label="Start time">
            <input
              type="time"
              className="field"
              value={form.startTime}
              onChange={(event) =>
                setForm({ ...form, startTime: event.target.value })
              }
            />
          </Field>
          <Field label="End time">
            <input
              type="time"
              className="field"
              value={form.endTime}
              onChange={(event) =>
                setForm({ ...form, endTime: event.target.value })
              }
            />
          </Field>
          <Field label="Reason">
            <input
              className="field"
              value={form.reason}
              onChange={(event) =>
                setForm({ ...form, reason: event.target.value })
              }
              placeholder="General consultation"
            />
          </Field>
          <label className="flex items-center gap-3 self-end rounded-lg border border-line px-3 py-2.5">
            <input
              type="checkbox"
              checked={form.reminder}
              onChange={(event) =>
                setForm({ ...form, reminder: event.target.checked })
              }
              className="size-4 accent-blue-600"
            />
            <span className="text-sm text-slate-700">
              Reminder 24 hours before
            </span>
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Symptoms / chief complaint</span>
            <textarea
              className="field min-h-24 py-3"
              value={form.symptoms}
              onChange={(event) =>
                setForm({ ...form, symptoms: event.target.value })
              }
            />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Internal notes</span>
            <textarea
              className="field min-h-20 py-3"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
            />
          </label>
          <div className="sm:col-span-2 flex justify-end gap-2 border-t border-line pt-4">
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={
                !form.patientId || !form.doctorMembershipId || create.isPending
              }
              onClick={() => create.mutate()}
            >
              <CalendarDays size={16} />
              {create.isPending ? "Booking..." : "Book appointment"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
}) {
  const id = useId();
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}
