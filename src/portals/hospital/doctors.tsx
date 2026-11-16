"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, ChevronDown, Clock, GraduationCap, IndianRupee, Languages, MapPin, Star } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  DescriptionList,
  EmptyState,
  FilterBar,
  Menu,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  StatCard,
  addDays,
  dayName,
  formatINR,
  formatMinutes,
  weekdayOf,
} from "@/design-system";
import { ColumnChart } from "@/design-system/charts";
import { cn } from "@/lib/utils";
import { DEMO_NOW, DEMO_TODAY } from "@/mocks/catalog";
import { openSlots, slotsFor } from "@/mocks/scheduling";
import type { Doctor, DoctorStatus } from "@/mocks/types";
import { useWorkspace } from "./store";
import { AppointmentStatusBadge, BookAppointmentModal, DOCTOR_STATUS, DoctorStatusBadge, TokenChip } from "./shared";

export function DoctorStatusMenu({ doctor }: { doctor: Doctor }) {
  const { state, setDoctorStatus } = useWorkspace();
  const status = state.doctorStatus[doctor.id]!;
  return (
    <Menu
      items={(Object.keys(DOCTOR_STATUS) as DoctorStatus[]).map((s) => ({
        label: DOCTOR_STATUS[s].label,
        disabled: s === status,
        onSelect: () => setDoctorStatus(doctor.id, s),
      }))}
      trigger={(p) => (
        <button type="button" {...p} className="inline-flex items-center gap-1 rounded-full" aria-label={`Change status for ${doctor.name}`}>
          <DoctorStatusBadge status={status} />
          <ChevronDown className="size-3.5 text-ink-subtle" />
        </button>
      )}
    />
  );
}

export function DoctorsPage() {
  const { state } = useWorkspace();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [bookFor, setBookFor] = useState<string | null>(null);
  const today = state.appointments.filter((a) => a.date === DEMO_TODAY);

  const rows = state.doctors
    .filter((d) => !dept || d.departmentId === dept)
    .filter((d) => !status || state.doctorStatus[d.id] === status)
    .filter((d) => {
      const t = q.trim().toLowerCase();
      return !t || d.name.toLowerCase().includes(t) || d.specialty.toLowerCase().includes(t);
    });

  return (
    <>
      <PageHeader
        title="Doctors"
        description={`${state.doctors.length} consultants across ${state.departments.length} departments`}
        actions={
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: "Cards" },
              { value: "list", label: "Schedule" },
            ]}
          />
        }
      />
      <Card className="mb-4">
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Search name or specialty" className="sm:w-72" />
          <Select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} className="sm:w-56">
            <option value="">All departments</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
            <option value="">Any status</option>
            {(Object.keys(DOCTOR_STATUS) as DoctorStatus[]).map((s) => (
              <option key={s} value={s}>
                {DOCTOR_STATUS[s].label}
              </option>
            ))}
          </Select>
        </FilterBar>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <EmptyState title="No doctors match these filters" />
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => {
            const list = today.filter((a) => a.doctorId === d.id && a.status !== "cancelled");
            const next = openSlots(d, DEMO_TODAY, state.appointments)[0];
            const dept = state.departments.find((x) => x.id === d.departmentId)!;
            return (
              <Card key={d.id} className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={d.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/hospital/doctors/${d.id}`} className="block truncate font-semibold hover:text-brand-700">
                      {d.name}
                    </Link>
                    <p className="truncate text-[13px] text-ink-muted">{d.specialty}</p>
                    <p className="truncate text-xs text-ink-subtle">{d.qualifications.join(", ")}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <DoctorStatusMenu doctor={d} />
                  <span className="text-xs text-ink-muted">{dept.short} · {d.room}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-[10px] bg-subtle p-3 text-center">
                  <div>
                    <p className="tnum text-sm font-semibold">{list.filter((a) => a.status === "completed").length}/{list.length}</p>
                    <p className="text-[11px] text-ink-muted">Seen today</p>
                  </div>
                  <div>
                    <p className="tnum text-sm font-semibold">{list.filter((a) => a.status === "waiting").length}</p>
                    <p className="text-[11px] text-ink-muted">Waiting</p>
                  </div>
                  <div>
                    <p className="tnum text-sm font-semibold">{state.doctorStatus[d.id] === "on-leave" ? "-" : next ? formatMinutes(next.start) : "Full"}</p>
                    <p className="text-[11px] text-ink-muted">Next slot</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/hospital/doctors/${d.id}`} className="inline-flex h-8 flex-1 items-center justify-center rounded-control border border-line-strong text-[13px] font-medium shadow-card hover:bg-subtle">
                    View profile
                  </Link>
                  <Button size="sm" className="flex-1" disabled={state.doctorStatus[d.id] === "on-leave"} onClick={() => setBookFor(d.id)} icon={<CalendarPlus className="size-3.5" />}>
                    Book
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader title="Weekly OPD schedule" description="Monday to Saturday OPD sessions" />
          <WeeklySchedule doctors={rows} />
        </Card>
      )}
      {bookFor && <BookAppointmentModal open initialDoctorId={bookFor} onClose={() => setBookFor(null)} />}
    </>
  );
}

/** Horizontal timeline of each doctor's sessions for Mon-Sat. */
function WeeklySchedule({ doctors }: { doctors: Doctor[] }) {
  const START = 8 * 60;
  const END = 21 * 60;
  const pct = (m: number) => ((m - START) / (END - START)) * 100;
  const days = [1, 2, 3, 4, 5, 6];
  return (
    <div className="ds-scroll overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="ml-56 flex justify-between border-b border-line pr-5 pb-2 text-[11px] text-ink-subtle">
          {[8, 10, 12, 14, 16, 18, 20].map((h) => (
            <span key={h} className="tnum">{formatMinutes(h * 60).replace(":00", "")}</span>
          ))}
        </div>
        {doctors.map((d) => (
          <div key={d.id} className="flex border-b border-line last:border-b-0">
            <div className="flex w-56 shrink-0 items-center gap-2 px-5 py-3">
              <Avatar name={d.name} size="xs" />
              <Link href={`/hospital/doctors/${d.id}`} className="truncate text-[13px] font-medium hover:text-brand-700">
                {d.name}
              </Link>
            </div>
            <div className="flex-1 space-y-1 py-2 pr-5">
              {days.map((wd) => (
                <div key={wd} className="flex items-center gap-2">
                  <span className="w-7 text-[10px] text-ink-subtle">{dayName(wd)}</span>
                  <div className="relative h-2 flex-1 rounded-full bg-ink/[0.04]">
                    {(d.weekly[wd] ?? []).map((s) => (
                      <span
                        key={s.start}
                        title={`${dayName(wd, true)} ${formatMinutes(s.start)} to ${formatMinutes(s.end)}`}
                        className="absolute inset-y-0 rounded-full bg-[#2a78d6]"
                        style={{ left: `${pct(s.start)}%`, width: `${pct(s.end) - pct(s.start)}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoctorProfile({ id }: { id: string }) {
  const { state } = useWorkspace();
  const [bookOpen, setBookOpen] = useState(false);
  const d = state.doctors.find((x) => x.id === id);
  if (!d) {
    return (
      <Card>
        <EmptyState title="Doctor not found" action={<Link href="/hospital/doctors" className="text-sm font-medium text-brand-700">Back to doctors</Link>} />
      </Card>
    );
  }
  const dept = state.departments.find((x) => x.id === d.departmentId)!;
  const today = state.appointments.filter((a) => a.doctorId === d.id && a.date === DEMO_TODAY).sort((a, b) => a.start - b.start);
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(DEMO_TODAY, i - 13)).filter((x) => weekdayOf(x) !== 0);
  const history = last14.map((date) => {
    const list = state.appointments.filter((a) => a.doctorId === d.id && a.date === date);
    return { day: date.slice(8), seen: list.filter((a) => a.status === "completed").length };
  });
  const month = state.appointments.filter((a) => a.doctorId === d.id && a.date < DEMO_TODAY && a.date >= addDays(DEMO_TODAY, -28));
  const completed = month.filter((a) => a.status === "completed");
  const noShow = month.filter((a) => a.status === "no-show").length;
  const revenue = completed.reduce((s, a) => s + a.fee, 0);
  const capacityToday = slotsFor(d, DEMO_TODAY, []).length;

  return (
    <>
      <Link href="/hospital/doctors" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Doctors
      </Link>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={d.name} size="xl" />
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">{d.name}</h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                {d.specialty} · {dept.name}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-4 text-ink-subtle" />{d.qualifications.join(", ")}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-ink-subtle" />{d.experienceYears} yrs experience</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-ink-subtle" />{d.room}</span>
                <span className="inline-flex items-center gap-1.5"><Star className="size-4 text-ink-subtle" />{d.rating} ({d.reviews} reviews)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DoctorStatusMenu doctor={d} />
            <Button icon={<CalendarPlus className="size-4" />} disabled={state.doctorStatus[d.id] === "on-leave"} onClick={() => setBookOpen(true)}>
              Book with {d.name.split(" ")[1]}
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Booked today" value={`${today.filter((a) => a.status !== "cancelled").length}/${capacityToday}`} footnote="slots filled" />
        <StatCard label="Consultations (28d)" value={completed.length} />
        <StatCard label="No-show rate" value={`${month.length ? Math.round((noShow / month.length) * 100) : 0}%`} footnote="last 28 days" />
        <StatCard label="Fees collected (28d)" value={formatINR(revenue)} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Today's appointments" description={`${today.length} booked · ${d.slotMinutes}-minute slots`} />
          {today.length === 0 ? (
            <EmptyState title="No appointments today" />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {today.map((a) => {
                const p = state.patients.find((x) => x.id === a.patientId)!;
                return (
                  <li key={a.id} className={cn("flex items-center gap-3 px-5 py-2.5", a.start + a.duration < DEMO_NOW && a.status === "completed" && "opacity-70")}>
                    <span className="tnum w-16 text-[13px] font-medium">{formatMinutes(a.start)}</span>
                    <TokenChip doctor={d} token={a.token} />
                    <Link href={`/hospital/patients/${p.id}`} className="min-w-0 flex-1 truncate text-[13px] font-medium hover:text-brand-700">
                      {p.name}
                      <span className="ml-2 font-normal text-ink-muted">{a.reason}</span>
                    </Link>
                    <AppointmentStatusBadge status={a.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Consultations per day" description="Last two weeks, Sundays excluded" />
            <div className="px-3 pb-4">
              <ColumnChart data={history} xKey="day" series={[{ key: "seen", label: "Patients seen" }]} height={170} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Profile" />
            <div className="px-5 pb-5">
              <p className="mb-4 text-[13px] text-ink-muted">{d.about}</p>
              <DescriptionList
                columns={1}
                items={[
                  { label: "Consultation fee", value: <span className="inline-flex items-center gap-1"><IndianRupee className="size-3.5" />{d.fee} new · {d.followUpFee} follow-up</span> },
                  { label: "Languages", value: <span className="inline-flex items-center gap-1"><Languages className="size-3.5" />{d.languages.join(", ")}</span> },
                  { label: "Registration", value: d.registrationNo },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Weekly availability" description="Edit hours in Hospital settings → OPD hours" />
        <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
            const sessions = d.weekly[wd] ?? [];
            return (
              <div key={wd} className={cn("rounded-[10px] border p-3", sessions.length ? "border-line" : "border-dashed border-line bg-subtle")}>
                <p className="text-xs font-medium text-ink-muted">{dayName(wd, true)}</p>
                {sessions.length ? (
                  sessions.map((s) => (
                    <p key={s.start} className="tnum mt-1 text-[13px]">
                      {formatMinutes(s.start)} to {formatMinutes(s.end)}
                    </p>
                  ))
                ) : (
                  <p className="mt-1 text-[13px] text-ink-subtle">No OPD</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      {bookOpen && <BookAppointmentModal open initialDoctorId={d.id} onClose={() => setBookOpen(false)} />}
    </>
  );
}

export function DepartmentsPage() {
  const { state } = useWorkspace();
  const today = state.appointments.filter((a) => a.date === DEMO_TODAY && a.status !== "cancelled");
  return (
    <>
      <PageHeader title="Departments" description={`${state.departments.length} departments · ${today.length} appointments today`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {state.departments.map((dep) => {
          const docs = state.doctors.filter((d) => d.departmentId === dep.id);
          const list = today.filter((a) => a.departmentId === dep.id);
          const waiting = list.filter((a) => a.status === "waiting").length;
          const capacity = docs.reduce((s, d) => s + slotsFor(d, DEMO_TODAY, []).length, 0);
          const util = capacity ? Math.round((list.length / capacity) * 100) : 0;
          const head = state.doctors.find((d) => d.id === dep.headDoctorId);
          return (
            <Card key={dep.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{dep.name}</h2>
                  <p className="text-xs text-ink-subtle">{dep.floor}</p>
                </div>
                {waiting > 4 ? <Badge tone="warning" dot>Busy</Badge> : <Badge tone="success" dot>Normal</Badge>}
              </div>
              <p className="mt-2 text-[13px] text-ink-muted">{dep.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Doctors", docs.length],
                  ["Today", list.length],
                  ["Waiting", waiting],
                ].map(([l, v]) => (
                  <div key={l as string} className="rounded-[8px] bg-subtle py-2">
                    <p className="tnum text-sm font-semibold">{v}</p>
                    <p className="text-[11px] text-ink-muted">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-ink-muted">
                  <span>Slot utilisation today</span>
                  <span className="tnum font-medium text-ink">{util}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink/[0.07]">
                  <div className={cn("h-full rounded-full", util > 90 ? "bg-warning-600" : "bg-[#2a78d6]")} style={{ width: `${Math.min(100, util)}%` }} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <div className="flex -space-x-2">
                  {docs.map((d) => (
                    <Link key={d.id} href={`/hospital/doctors/${d.id}`} title={d.name}>
                      <Avatar name={d.name} size="sm" className="ring-2 ring-surface" />
                    </Link>
                  ))}
                </div>
                {head && <span className="text-xs text-ink-muted">Head: {head.name}</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
