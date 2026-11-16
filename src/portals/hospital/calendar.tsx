"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, IndianRupee, LogIn, XCircle } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  DescriptionList,
  Drawer,
  IconButton,
  PageHeader,
  Segmented,
  Select,
  addDays,
  dayName,
  formatDate,
  formatDateShort,
  formatINR,
  formatMinutes,
  formatPhone,
  weekdayOf,
} from "@/design-system";
import { cn } from "@/lib/utils";
import { DEMO_NOW, DEMO_TODAY } from "@/mocks/catalog";
import { slotsFor } from "@/mocks/scheduling";
import type { Appointment, AppointmentStatus } from "@/mocks/types";
import { useWorkspace } from "./store";
import { AppointmentStatusBadge, BookAppointmentModal, ChannelTag, TokenChip } from "./shared";
import { RescheduleModal } from "./appointments";

const PX_PER_MIN = 1.7;

const BLOCK: Record<AppointmentStatus, string> = {
  scheduled: "border-l-ink-subtle bg-surface",
  waiting: "border-l-warning-600 bg-warning-50",
  "in-consultation": "border-l-brand-600 bg-brand-50",
  completed: "border-l-success-600 bg-success-50/70",
  cancelled: "border-l-line-strong bg-subtle text-ink-subtle line-through",
  "no-show": "border-l-danger-600 bg-danger-50/60",
};

function mondayOf(iso: string) {
  const wd = weekdayOf(iso);
  return addDays(iso, wd === 0 ? -6 : 1 - wd);
}

export function CalendarPage() {
  const { state } = useWorkspace();
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState(DEMO_TODAY);
  const [dept, setDept] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [booking, setBooking] = useState<{ doctorId: string; start: number } | null>(null);

  const doctors = state.doctors.filter((d) => !dept || d.departmentId === dept);
  const step = view === "day" ? 1 : 7;

  return (
    <>
      <PageHeader
        title="Appointment calendar"
        description={view === "day" ? formatDate(date) : `Week of ${formatDateShort(mondayOf(date))}`}
        actions={
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
            ]}
          />
        }
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1">
            <IconButton label="Previous" onClick={() => setDate(addDays(date, -step))}>
              <ChevronLeft className="size-4" />
            </IconButton>
            <IconButton label="Next" onClick={() => setDate(addDays(date, step))}>
              <ChevronRight className="size-4" />
            </IconButton>
            <Button size="sm" variant="secondary" onClick={() => setDate(DEMO_TODAY)} className="ml-1">
              Today
            </Button>
            <span className="ml-3 text-sm font-medium">{view === "day" ? formatDateShort(date) : `${formatDateShort(mondayOf(date))} to ${formatDateShort(addDays(mondayOf(date), 6))}`}</span>
          </div>
          <div className="flex items-center gap-3">
            <Legend />
            <Select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} className="w-48">
              <option value="">All departments</option>
              {state.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {view === "day" ? (
          <DayGrid date={date} doctorIds={doctors.map((d) => d.id)} onSelect={setSelected} onEmpty={(doctorId, start) => setBooking({ doctorId, start })} />
        ) : (
          <WeekGrid
            weekStart={mondayOf(date)}
            doctorIds={doctors.map((d) => d.id)}
            onPick={(d) => {
              setDate(d);
              setView("day");
            }}
          />
        )}
      </Card>

      {selected && <AppointmentDrawer appointment={state.appointments.find((a) => a.id === selected.id)!} onClose={() => setSelected(null)} />}
      {booking && (
        <BookAppointmentModal
          open
          onClose={() => setBooking(null)}
          initialDoctorId={booking.doctorId}
          initialDate={date}
          initialStart={booking.start}
          defaultCheckIn={false}
        />
      )}
    </>
  );
}

function Legend() {
  const items: Array<[string, string]> = [
    ["Scheduled", "bg-ink-subtle"],
    ["Waiting", "bg-warning-600"],
    ["With doctor", "bg-brand-600"],
    ["Done", "bg-success-600"],
  ];
  return (
    <div className="hidden items-center gap-3 text-xs text-ink-muted xl:flex">
      {items.map(([l, c]) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-1 rounded-full", c)} />
          {l}
        </span>
      ))}
    </div>
  );
}

function DayGrid({
  date,
  doctorIds,
  onSelect,
  onEmpty,
}: {
  date: string;
  doctorIds: string[];
  onSelect: (a: Appointment) => void;
  onEmpty: (doctorId: string, start: number) => void;
}) {
  const { state } = useWorkspace();
  const wd = weekdayOf(date);
  const doctors = state.doctors.filter((d) => doctorIds.includes(d.id));
  const working = doctors.filter((d) => (d.weekly[wd] ?? []).length);
  const allSessions = working.flatMap((d) => d.weekly[wd]!);
  if (!working.length) {
    return <div className="px-5 py-16 text-center text-sm text-ink-muted">No OPD sessions on {dayName(wd, true)} for the selected doctors.</div>;
  }
  const dayStart = Math.floor(Math.min(...allSessions.map((s) => s.start)) / 60) * 60;
  const dayEnd = Math.ceil(Math.max(...allSessions.map((s) => s.end)) / 60) * 60;
  const height = (dayEnd - dayStart) * PX_PER_MIN;
  const hours = Array.from({ length: (dayEnd - dayStart) / 60 + 1 }, (_, i) => dayStart + i * 60);

  return (
    <div className="ds-scroll max-h-[calc(100vh-260px)] overflow-auto">
      <div className="flex min-w-max">
        {/* time axis */}
        <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-line bg-surface">
          <div className="sticky top-0 z-10 h-14 border-b border-line bg-surface" />
          <div className="relative mt-2" style={{ height }}>
            {hours.map((h) => (
              <span key={h} className="tnum absolute right-2 -translate-y-1/2 text-[11px] text-ink-subtle" style={{ top: (h - dayStart) * PX_PER_MIN }}>
                {formatMinutes(h).replace(":00", "")}
              </span>
            ))}
          </div>
        </div>
        {working.map((d) => {
          const appts = state.appointments.filter((a) => a.doctorId === d.id && a.date === date);
          const free = slotsFor(d, date, state.appointments).filter((s) => !s.taken && !s.past);
          return (
            <div key={d.id} className="w-48 shrink-0 border-r border-line last:border-r-0">
              <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-line bg-surface px-3">
                <Avatar name={d.name} size="xs" />
                <div className="min-w-0">
                  <Link href={`/hospital/doctors/${d.id}`} className="block truncate text-[13px] font-medium hover:text-brand-700">
                    {d.name.replace("Dr. ", "Dr ")}
                  </Link>
                  <p className="tnum truncate text-[11px] text-ink-muted">
                    {appts.filter((a) => a.status !== "cancelled").length} booked · {free.length} open
                  </p>
                </div>
              </div>
              <div className="relative mt-2 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(27_34_48/0.025)_6px_7px)]" style={{ height }}>
                {hours.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: (h - dayStart) * PX_PER_MIN }} />
                ))}
                {d.weekly[wd]!.map((s) => (
                  <div key={s.start} className="absolute inset-x-0 bg-surface" style={{ top: (s.start - dayStart) * PX_PER_MIN, height: (s.end - s.start) * PX_PER_MIN }} />
                ))}
                {free.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    aria-label={`Book ${d.name} at ${formatMinutes(s.start)}`}
                    onClick={() => onEmpty(d.id, s.start)}
                    className="group absolute inset-x-1 rounded-[6px] text-[11px] text-brand-700 opacity-0 transition-opacity hover:bg-brand-50 hover:opacity-100 focus-visible:opacity-100"
                    style={{ top: (s.start - dayStart) * PX_PER_MIN + 1, height: d.slotMinutes * PX_PER_MIN - 2 }}
                  >
                    + {formatMinutes(s.start)}
                  </button>
                ))}
                {appts.map((a) => {
                  const p = state.patients.find((x) => x.id === a.patientId)!;
                  const h = a.duration * PX_PER_MIN - 2;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onSelect(a)}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-[6px] border border-l-[3px] border-line px-1.5 text-left shadow-card transition-shadow hover:z-10 hover:shadow-pop",
                        BLOCK[a.status],
                      )}
                      style={{ top: (a.start - dayStart) * PX_PER_MIN + 1, height: h }}
                      title={`${formatMinutes(a.start)} · ${p.name} · token ${a.token}`}
                    >
                      <p className="flex items-center gap-1 truncate text-[11px] leading-[16px] font-medium">
                        <span className="tnum text-ink-muted">#{a.token}</span> {p.name}
                      </p>
                      {h > 30 && <p className="truncate text-[10px] text-ink-muted">{a.reason}</p>}
                    </button>
                  );
                })}
                {date === DEMO_TODAY && DEMO_NOW > dayStart && DEMO_NOW < dayEnd && (
                  <div className="pointer-events-none absolute inset-x-0 z-[5] border-t-2 border-danger-600" style={{ top: (DEMO_NOW - dayStart) * PX_PER_MIN }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ weekStart, doctorIds, onPick }: { weekStart: string; doctorIds: string[]; onPick: (d: string) => void }) {
  const { state } = useWorkspace();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const doctors = state.doctors.filter((d) => doctorIds.includes(d.id));
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of state.appointments) {
      if (a.status === "cancelled") continue;
      const k = `${a.doctorId}|${a.date}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [state.appointments]);

  return (
    <div className="ds-scroll overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-line bg-subtle text-xs text-ink-muted">
            <th className="h-11 pl-5 text-left font-medium">Doctor</th>
            {days.map((d) => (
              <th key={d} className={cn("font-medium", d === DEMO_TODAY && "text-brand-700")}>
                {formatDateShort(d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {doctors.map((doc) => (
            <tr key={doc.id}>
              <td className="py-2 pl-5">
                <div className="flex items-center gap-2">
                  <Avatar name={doc.name} size="xs" />
                  <span className="truncate font-medium">{doc.name}</span>
                </div>
              </td>
              {days.map((d) => {
                const capacity = slotsFor(doc, d, []).length;
                const booked = counts.get(`${doc.id}|${d}`) ?? 0;
                const util = capacity ? booked / capacity : 0;
                return (
                  <td key={d} className="px-1.5 py-1.5">
                    {capacity === 0 ? (
                      <div className="flex h-11 items-center justify-center rounded-[8px] text-xs text-ink-subtle">Off</div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPick(d)}
                        className="flex h-11 w-full flex-col justify-center rounded-[8px] border border-line px-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                        title={`${booked} of ${capacity} slots booked`}
                      >
                        <span className="tnum text-xs">
                          <span className="font-medium text-ink">{booked}</span>
                          <span className="text-ink-subtle">/{capacity}</span>
                        </span>
                        <span className="mt-1 h-1 w-full rounded-full bg-ink/[0.07]">
                          <span
                            className={cn("block h-full rounded-full", util > 0.9 ? "bg-warning-600" : "bg-[#2a78d6]")}
                            style={{ width: `${Math.min(100, util * 100)}%` }}
                          />
                        </span>
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AppointmentDrawer({ appointment: a, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { state, setStatus, markPaid } = useWorkspace();
  const [rescheduling, setRescheduling] = useState(false);
  const p = state.patients.find((x) => x.id === a.patientId)!;
  const d = state.doctors.find((x) => x.id === a.doctorId)!;
  const actionable = a.status === "scheduled" || a.status === "waiting";
  return (
    <>
      <Drawer
        open={!rescheduling}
        onClose={onClose}
        title={`${formatMinutes(a.start)} · ${p.name}`}
        description={`${formatDateShort(a.date)} with ${d.name}`}
        footer={
          actionable ? (
            <>
              <Button
                variant="ghost"
                icon={<XCircle className="size-4" />}
                onClick={() => {
                  setStatus(a.id, "cancelled");
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button variant="secondary" icon={<CalendarClock className="size-4" />} onClick={() => setRescheduling(true)}>
                Reschedule
              </Button>
              {a.status === "scheduled" && a.date === DEMO_TODAY && (
                <Button icon={<LogIn className="size-4" />} onClick={() => setStatus(a.id, "waiting")}>
                  Check in
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        <div className="flex items-center gap-3">
          <TokenChip doctor={d} token={a.token} size="lg" />
          <AppointmentStatusBadge status={a.status} />
          <ChannelTag channel={a.channel} />
        </div>
        <DescriptionList
          className="mt-6"
          items={[
            { label: "Patient", value: <Link className="text-brand-700 hover:underline" href={`/hospital/patients/${p.id}`}>{p.name}</Link> },
            { label: "UHID", value: p.uhid },
            { label: "Mobile", value: formatPhone(p.phone) },
            { label: "Visit type", value: a.visitType === "follow-up" ? "Follow-up" : "New consultation" },
            { label: "Room", value: d.room },
            { label: "Duration", value: `${a.duration} min` },
            { label: "Reason", value: a.reason },
            { label: "Fee", value: `${formatINR(a.fee)} · ${a.paid ? "Paid" : "Unpaid"}` },
          ]}
        />
        {a.vitals && (
          <div className="mt-6 rounded-[10px] border border-line p-4">
            <p className="mb-3 text-[13px] font-medium">Vitals recorded at triage</p>
            <DescriptionList
              columns={3}
              items={[
                { label: "BP", value: `${a.vitals.bp} mmHg` },
                { label: "Pulse", value: `${a.vitals.pulse} bpm` },
                { label: "Temp", value: `${a.vitals.tempF} °F` },
                { label: "SpO₂", value: `${a.vitals.spo2}%` },
                { label: "Weight", value: `${a.vitals.weightKg} kg` },
              ]}
            />
          </div>
        )}
        {!a.paid && a.status !== "cancelled" && (
          <Button variant="secondary" size="sm" className="mt-6" icon={<IndianRupee className="size-3.5" />} onClick={() => markPaid(a.id)}>
            Record {formatINR(a.fee)} payment
          </Button>
        )}
      </Drawer>
      {rescheduling && (
        <RescheduleModal
          appointment={a}
          onClose={() => {
            setRescheduling(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
