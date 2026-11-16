"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Hourglass,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Avatar,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  formatDateShort,
  formatMinutes,
  formatNumber,
} from "@/design-system";
import { DEMO_NOW, DEMO_TODAY } from "@/mocks/catalog";
import { openSlots } from "@/mocks/scheduling";
import { useWorkspace } from "./store";
import {
  AppointmentStatusBadge,
  BookAppointmentModal,
  ChannelTag,
  DoctorStatusBadge,
  RegisterPatientModal,
  TokenChip,
} from "./shared";

export function HospitalOverview() {
  const { state } = useWorkspace();
  const [bookOpen, setBookOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const today = state.appointments.filter((a) => a.date === DEMO_TODAY);
  const waiting = today.filter((a) => a.status === "waiting");
  const inConsult = today.filter((a) => a.status === "in-consultation");
  const completed = today.filter((a) => a.status === "completed");
  const activeDoctors = state.doctors.filter((d) => ["available", "in-consultation", "on-break"].includes(state.doctorStatus[d.id]!));
  const avgWait = waiting.length
    ? Math.round(waiting.reduce((s, a) => s + (DEMO_NOW - (a.checkedInAt ?? DEMO_NOW)), 0) / waiting.length)
    : 0;

  const upcoming = today
    .filter((a) => a.status === "scheduled" && a.start >= DEMO_NOW)
    .sort((a, b) => a.start - b.start)
    .slice(0, 6);

  return (
    <>
      <PageHeader
        title="Good morning, Pooja"
        description={
          <>
            {formatDateShort(DEMO_TODAY)} · {state.hospital.name} · <span className="tnum">{formatMinutes(DEMO_NOW)}</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" icon={<UserPlus className="size-4" />} onClick={() => setRegisterOpen(true)}>
              Register patient
            </Button>
            <Button icon={<CalendarPlus className="size-4" />} onClick={() => setBookOpen(true)}>
              Book appointment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard label="Today's appointments" value={formatNumber(today.filter((a) => a.status !== "cancelled").length)} icon={<CalendarCheck />} />
        <StatCard label="Waiting now" value={waiting.length} footnote={`avg wait ${avgWait} min`} icon={<Hourglass />} />
        <StatCard label="Completed" value={completed.length} footnote={`${inConsult.length} in consultation`} icon={<CheckCircle2 />} />
        <StatCard label="Active doctors" value={`${activeDoctors.length}/${state.doctors.length}`} footnote="on duty today" icon={<Stethoscope />} />
        <div className="col-span-2 xl:col-span-1">
          <StatCard label="Registered patients" value={formatNumber(state.patients.length)} icon={<Users />} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Today's appointments"
            description={`${today.length} booked`}
            action={
              <ButtonLink href="/hospital/appointments" variant="ghost" size="sm">
                View all <ArrowRight className="size-3.5" />
              </ButtonLink>
            }
          />
          <ul className="divide-y divide-line border-t border-line">
            {[...today]
              .sort((a, b) => a.start - b.start)
              .map((a) => {
                const p = state.patients.find((x) => x.id === a.patientId)!;
                const d = state.doctors.find((x) => x.id === a.doctorId)!;
                return (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="tnum w-16 shrink-0 text-[13px] font-medium">{formatMinutes(a.start)}</span>
                    <TokenChip doctor={d} token={a.token} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/hospital/patients/${p.id}`} className="block truncate text-[13px] font-medium hover:text-brand-700">
                        {p.name}
                      </Link>
                      <p className="truncate text-xs text-ink-muted">
                        {d.name} · {a.reason}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </li>
                );
              })}
            {today.length === 0 && <EmptyState title="No appointments today" />}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Live queue"
            description="Patients currently at the hospital"
            action={
              <ButtonLink href="/hospital/queue" variant="ghost" size="sm">
                Open <ArrowRight className="size-3.5" />
              </ButtonLink>
            }
          />
          <div className="grid grid-cols-3 gap-2 px-5">
            {[
              { label: "Waiting", value: waiting.length, cls: "text-warning-700" },
              { label: "With doctor", value: inConsult.length, cls: "text-brand-700" },
              { label: "Done", value: completed.length, cls: "text-success-700" },
            ].map((s) => (
              <div key={s.label} className="rounded-[10px] bg-subtle px-3 py-2.5">
                <p className={`tnum text-xl font-semibold ${s.cls}`}>{s.value}</p>
                <p className="text-xs text-ink-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {waiting
              .sort((a, b) => (a.checkedInAt ?? 0) - (b.checkedInAt ?? 0))
              .slice(0, 5)
              .map((a) => {
                const p = state.patients.find((x) => x.id === a.patientId)!;
                const d = state.doctors.find((x) => x.id === a.doctorId)!;
                const wait = DEMO_NOW - (a.checkedInAt ?? DEMO_NOW);
                return (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                    <TokenChip doctor={d} token={a.token} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{p.name}</p>
                      <p className="truncate text-xs text-ink-muted">{d.name}</p>
                    </div>
                    <span className={`tnum text-xs ${wait > 30 ? "font-medium text-danger-700" : "text-ink-muted"}`}>{wait} min</span>
                  </li>
                );
              })}
            {waiting.length === 0 && <EmptyState title="No one waiting" description="Checked-in patients will appear here." />}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Doctor availability"
            description="Live status and open slots for today"
            action={
              <ButtonLink href="/hospital/doctors" variant="ghost" size="sm">
                All doctors <ArrowRight className="size-3.5" />
              </ButtonLink>
            }
          />
          <div className="ds-scroll overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="border-y border-line bg-subtle text-left text-xs text-ink-muted">
                <tr>
                  <th className="h-9 pl-5 font-medium">Doctor</th>
                  <th className="font-medium">Status</th>
                  <th className="font-medium">Queue</th>
                  <th className="font-medium">Today</th>
                  <th className="pr-5 text-right font-medium">Next open slot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {state.doctors.map((d) => {
                  const list = today.filter((a) => a.doctorId === d.id && a.status !== "cancelled");
                  const done = list.filter((a) => a.status === "completed").length;
                  const q = list.filter((a) => a.status === "waiting").length;
                  const next = openSlots(d, DEMO_TODAY, state.appointments)[0];
                  const status = state.doctorStatus[d.id]!;
                  return (
                    <tr key={d.id} className="hover:bg-subtle">
                      <td className="py-2.5 pl-5">
                        <Link href={`/hospital/doctors/${d.id}`} className="flex items-center gap-3">
                          <Avatar name={d.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium hover:text-brand-700">{d.name}</span>
                            <span className="block truncate text-xs text-ink-muted">
                              {state.departments.find((x) => x.id === d.departmentId)?.name} · {d.room}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <DoctorStatusBadge status={status} />
                      </td>
                      <td className="tnum text-ink-muted">{q ? `${q} waiting` : "-"}</td>
                      <td className="tnum">
                        <span className="text-ink">{done}</span>
                        <span className="text-ink-subtle"> / {list.length}</span>
                      </td>
                      <td className="tnum pr-5 text-right text-ink-muted">
                        {status === "on-leave" ? "-" : next ? formatMinutes(next.start) : "Fully booked"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Up next"
              description="Scheduled, not yet arrived"
              action={
                <ButtonLink href="/hospital/appointments" variant="ghost" size="sm">
                  View all
                </ButtonLink>
              }
            />
            <ul className="divide-y divide-line border-t border-line">
              {upcoming.map((a) => {
                const p = state.patients.find((x) => x.id === a.patientId)!;
                const d = state.doctors.find((x) => x.id === a.doctorId)!;
                return (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="tnum w-16 shrink-0 text-[13px] font-medium text-ink">{formatMinutes(a.start)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{p.name}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {d.name.replace("Dr. ", "Dr ")} · <ChannelTag channel={a.channel} />
                      </p>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </li>
                );
              })}
              {upcoming.length === 0 && <EmptyState title="Nothing scheduled" description="All remaining patients have arrived." />}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Recent activity" />
            <ul className="space-y-3 px-5 pb-4">
              {state.activity.slice(0, 5).map((a) => (
                <li key={a.id} className="flex gap-3 text-[13px]">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-ink-subtle">
                    {a.kind === "booking" ? <CalendarPlus className="size-3.5" /> : a.kind === "consult" ? <Stethoscope className="size-3.5" /> : a.kind === "checkin" ? <Clock className="size-3.5" /> : <Activity className="size-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="text-ink">
                      <strong className="font-medium">{a.actor}</strong> {a.action}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">{a.target}</span>
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-ink-subtle">{a.time}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {bookOpen && <BookAppointmentModal open onClose={() => setBookOpen(false)} />}
      {registerOpen && <RegisterPatientModal open onClose={() => setRegisterOpen(false)} />}
    </>
  );
}
