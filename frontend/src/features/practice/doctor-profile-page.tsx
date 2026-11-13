import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Coins,
  Plus,
  Save,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { DoctorAvailability, DoctorProfile } from "./types";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const tabs = [
  "Overview",
  "Schedule & availability",
  "Patient list",
  "Consultation history",
] as const;
type DoctorTab = (typeof tabs)[number];

export function DoctorProfilePage() {
  const { doctorMembershipId = "" } = useParams();
  const [tab, setTab] = useState<DoctorTab>("Overview");
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [timeOffOpen, setTimeOffOpen] = useState(false);
  const [slots, setSlots] = useState<
    Array<Omit<DoctorAvailability, "id"> & { key: string }>
  >([]);
  const [timeOff, setTimeOff] = useState({
    startsAt: "",
    endsAt: "",
    reason: "",
  });
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["doctor-profile", doctorMembershipId],
    queryFn: () =>
      api<DoctorProfile>(`/practice/doctors/${doctorMembershipId}/profile`),
    enabled: Boolean(doctorMembershipId),
  });
  useEffect(() => {
    if (query.data)
      setSlots(
        query.data.doctor.availability.map(({ id, ...slot }) => ({
          ...slot,
          key: id,
        })),
      );
  }, [query.data]);
  const refresh = () => {
    void client.invalidateQueries({
      queryKey: ["doctor-profile", doctorMembershipId],
    });
    void client.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const saveAvailability = useMutation({
    mutationFn: () =>
      api(`/practice/doctors/${doctorMembershipId}/availability`, {
        method: "PUT",
        body: JSON.stringify({
          slots: slots.map(({ key: _key, ...slot }) => slot),
        }),
      }),
    onSuccess: () => {
      toast.success("Doctor availability updated");
      setAvailabilityOpen(false);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const createTimeOff = useMutation({
    mutationFn: () =>
      api(`/practice/doctors/${doctorMembershipId}/time-off`, {
        method: "POST",
        body: JSON.stringify(timeOff),
      }),
    onSuccess: () => {
      toast.success("Time off added");
      setTimeOffOpen(false);
      setTimeOff({ startsAt: "", endsAt: "", reason: "" });
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const data = query.data;
  if (query.isLoading)
    return (
      <div className="card grid min-h-80 place-items-center text-sm text-slate-500">
        Loading doctor profile...
      </div>
    );
  if (!data)
    return (
      <div className="card p-10 text-center">
        <h2 className="font-semibold">Doctor profile unavailable</h2>
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-blue-700"
          to="/appointments"
        >
          Back to appointments
        </Link>
      </div>
    );

  return (
    <div>
      <Link
        to="/appointments"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Back to appointments
      </Link>
      <section className="mt-4 overflow-hidden rounded-2xl bg-[#071b4a] text-white">
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-white/10">
            <Stethoscope size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">
              Dr. {data.doctor.user.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/60">
              <span>{data.doctor.user.email}</span>
              <span>{data.doctor.user.phone || "No phone"}</span>
              <span>{data.doctor.role.replaceAll("_", " ")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary border-white/20! bg-white/10! text-white!"
              onClick={() => setTimeOffOpen(true)}
            >
              <Clock3 size={15} />
              Add time off
            </button>
            <button
              className="btn-primary"
              onClick={() => setAvailabilityOpen(true)}
            >
              <CalendarDays size={15} />
              Manage availability
            </button>
          </div>
        </div>
        <div className="flex overflow-x-auto border-t border-white/10 px-5">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={cn(
                "shrink-0 border-b-2 px-4 py-3 text-xs font-semibold",
                tab === item
                  ? "border-orange-400 text-white"
                  : "border-transparent text-white/50",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {tab === "Overview" && <Overview data={data} />}
      {tab === "Schedule & availability" && <Schedule data={data} />}
      {tab === "Patient list" && <PatientList data={data} />}
      {tab === "Consultation history" && <History data={data} />}

      <Modal
        open={availabilityOpen}
        onClose={() => setAvailabilityOpen(false)}
        title="Weekly availability"
        description="Configure one or more working windows for each day."
      >
        <div className="space-y-3">
          {slots.map((slot, index) => (
            <div
              key={slot.key}
              className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <select
                className="field"
                value={slot.dayOfWeek}
                onChange={(event) =>
                  changeSlot(index, { dayOfWeek: Number(event.target.value) })
                }
              >
                {days.map((day, dayIndex) => (
                  <option key={day} value={dayIndex}>
                    {day}
                  </option>
                ))}
              </select>
              <input
                type="time"
                className="field"
                value={minutesToTime(slot.startMinutes)}
                onChange={(event) =>
                  changeSlot(index, {
                    startMinutes: timeToMinutes(event.target.value),
                  })
                }
              />
              <input
                type="time"
                className="field"
                value={minutesToTime(slot.endMinutes)}
                onChange={(event) =>
                  changeSlot(index, {
                    endMinutes: timeToMinutes(event.target.value),
                  })
                }
              />
              <button
                className="btn-secondary"
                onClick={() =>
                  setSlots((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="btn-secondary"
            onClick={() =>
              setSlots((current) => [
                ...current,
                {
                  key: crypto.randomUUID(),
                  dayOfWeek: 1,
                  startMinutes: 540,
                  endMinutes: 1020,
                  slotDurationMinutes: 30,
                  isActive: true,
                },
              ])
            }
          >
            <Plus size={15} />
            Add working window
          </button>
          <div className="flex justify-end border-t border-line pt-4">
            <button
              className="btn-primary"
              onClick={() => saveAvailability.mutate()}
              disabled={saveAvailability.isPending}
            >
              <Save size={15} />
              {saveAvailability.isPending ? "Saving..." : "Save availability"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={timeOffOpen}
        onClose={() => setTimeOffOpen(false)}
        title="Add doctor time off"
        description="Appointments cannot be booked during this period."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">Starts</span>
            <input
              type="datetime-local"
              className="field"
              value={timeOff.startsAt}
              onChange={(event) =>
                setTimeOff((current) => ({
                  ...current,
                  startsAt: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span className="field-label">Ends</span>
            <input
              type="datetime-local"
              className="field"
              value={timeOff.endsAt}
              onChange={(event) =>
                setTimeOff((current) => ({
                  ...current,
                  endsAt: event.target.value,
                }))
              }
            />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Reason</span>
            <input
              className="field"
              value={timeOff.reason}
              onChange={(event) =>
                setTimeOff((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
            />
          </label>
          <div className="col-span-full flex justify-end border-t border-line pt-4">
            <button
              className="btn-primary"
              disabled={
                !timeOff.startsAt || !timeOff.endsAt || createTimeOff.isPending
              }
              onClick={() => createTimeOff.mutate()}
            >
              <Save size={15} />
              Save time off
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

  function changeSlot(
    index: number,
    change: Partial<Omit<DoctorAvailability, "id">>,
  ) {
    setSlots((current) =>
      current.map((slot, itemIndex) =>
        itemIndex === index ? { ...slot, ...change } : slot,
      ),
    );
  }
}

function Overview({ data }: { data: DoctorProfile }) {
  const cards = [
    {
      label: "Today's appointments",
      value: data.metrics.todayAppointments,
      icon: CalendarDays,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Upcoming",
      value: data.metrics.upcomingAppointments,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Patients",
      value: data.metrics.patients,
      icon: UsersRound,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Revenue generated",
      value: `₱${data.metrics.revenueGenerated.toLocaleString("en-PH")}`,
      icon: Coins,
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];
  return (
    <div className="mt-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500">{label}</div>
                <div className="mt-2 text-2xl font-bold">{value}</div>
              </div>
              <span
                className={`grid size-10 place-items-center rounded-xl ${tone}`}
              >
                <Icon size={18} />
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <AppointmentList
          title="Today's appointments"
          rows={data.todayAppointments}
        />
        <AppointmentList
          title="Upcoming appointments"
          rows={data.upcomingAppointments.slice(0, 8)}
        />
      </div>
    </div>
  );
}

function Schedule({ data }: { data: DoctorProfile }) {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.7fr]">
      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold">Weekly working hours</h2>
        </div>
        <div className="divide-y divide-line">
          {days.map((day, index) => {
            const slots = data.doctor.availability.filter(
              (item) => item.dayOfWeek === index && item.isActive,
            );
            return (
              <div key={day} className="flex items-center gap-4 px-5 py-4">
                <div className="w-24 text-sm font-semibold">{day}</div>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <span
                      key={slot.id}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                    >
                      {minutesToTime(slot.startMinutes)} –{" "}
                      {minutesToTime(slot.endMinutes)} ·{" "}
                      {slot.slotDurationMinutes} min
                    </span>
                  ))}
                  {!slots.length && (
                    <span className="text-xs text-slate-400">Unavailable</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold">Upcoming time off</h2>
        </div>
        <div className="divide-y divide-line">
          {data.doctor.timeOff.map((item) => (
            <div key={item.id} className="p-4">
              <div className="text-sm font-semibold">
                {format(new Date(item.startsAt), "d MMM yyyy, h:mm a")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Until {format(new Date(item.endsAt), "d MMM yyyy, h:mm a")}
                {item.reason ? ` · ${item.reason}` : ""}
              </div>
            </div>
          ))}
          {!data.doctor.timeOff.length && (
            <div className="p-8 text-center text-sm text-slate-400">
              No upcoming time off.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PatientList({ data }: { data: DoctorProfile }) {
  return (
    <section className="card mt-5 overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-semibold">Patients consulted</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>ID</th>
              <th>Contact</th>
              <th>Last consultation</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.patients.map((patient) => (
              <tr key={patient.id}>
                <td className="font-semibold!">{patient.name}</td>
                <td>{patient.patientCode}</td>
                <td>{patient.phone || patient.email || "—"}</td>
                <td>
                  {format(new Date(patient.lastConsultedAt), "d MMM yyyy")}
                </td>
                <td>
                  <Link
                    className="text-xs font-semibold text-blue-700"
                    to={`/patients/${patient.id}`}
                  >
                    Open record
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function History({ data }: { data: DoctorProfile }) {
  return (
    <AppointmentList
      title="Consultation history"
      rows={data.consultationHistory}
      className="mt-5"
    />
  );
}

function AppointmentList({
  title,
  rows,
  className,
}: {
  title: string;
  rows: DoctorProfile["todayAppointments"];
  className?: string;
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-line">
        {rows.map((row) => (
          <Link
            key={row.id}
            to={`/appointments/${row.id}`}
            className="flex items-center gap-3 p-4 hover:bg-slate-50"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <UserRound size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {row.patient.name}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {format(new Date(row.startsAt), "d MMM yyyy, h:mm a")} ·{" "}
                {row.type.replaceAll("_", " ")}
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold">
              {row.status.replaceAll("_", " ")}
            </span>
          </Link>
        ))}
        {!rows.length && (
          <div className="p-8 text-center text-sm text-slate-400">
            No appointments.
          </div>
        )}
      </div>
    </section>
  );
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}
