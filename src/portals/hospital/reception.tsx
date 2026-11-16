"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarPlus,
  Check,
  Clock3,
  Globe,
  IdCard,
  LogIn,
  Phone,
  Printer,
  Undo2,
  UserPlus,
  X,
} from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Kbd,
  PageHeader,
  SearchInput,
  Segmented,
  Tabs,
  ageFrom,
  formatINR,
  formatMinutes,
  formatPhone,
  formatDateShort,
} from "@/design-system";
import { cn } from "@/lib/utils";
import { DEMO_NOW, DEMO_TODAY } from "@/mocks/catalog";
import { openSlots, tokenCode } from "@/mocks/scheduling";
import type { Appointment, Patient } from "@/mocks/types";
import { useWorkspace } from "./store";
import {
  AppointmentStatusBadge,
  BookAppointmentModal,
  ChannelTag,
  DoctorStatusBadge,
  RegisterPatientModal,
  TokenChip,
} from "./shared";

type ArrivalTab = "expected" | "waiting" | "done";

export function ReceptionDesk() {
  const { state, setStatus, markPaid } = useWorkspace();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ArrivalTab>("expected");
  const [deptFilter, setDeptFilter] = useState<"all" | "online">("all");
  const [book, setBook] = useState<{ patient: Patient | null; doctorId?: string } | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [slip, setSlip] = useState<Appointment | null>(null);
  const [showAll, setShowAll] = useState(false);

  const today = state.appointments.filter((a) => a.date === DEMO_TODAY);
  const patientsById = useMemo(() => new Map(state.patients.map((p) => [p.id, p])), [state.patients]);
  const doctorsById = useMemo(() => new Map(state.doctors.map((d) => [d.id, d])), [state.doctors]);

  const term = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (term.length < 2) return [];
    return state.patients
      .filter((p) => p.name.toLowerCase().includes(term) || p.phone.includes(term) || p.uhid.toLowerCase().includes(term))
      .slice(0, 8);
  }, [term, state.patients]);

  const lists: Record<ArrivalTab, Appointment[]> = {
    expected: today.filter((a) => a.status === "scheduled").sort((a, b) => a.start - b.start),
    waiting: today
      .filter((a) => a.status === "waiting" || a.status === "in-consultation")
      .sort((a, b) => (a.checkedInAt ?? 0) - (b.checkedInAt ?? 0)),
    done: today.filter((a) => ["completed", "no-show", "cancelled"].includes(a.status)).sort((a, b) => b.start - a.start),
  };
  const visible = lists[tab].filter((a) => deptFilter === "all" || a.channel === "online");

  function checkIn(a: Appointment) {
    setStatus(a.id, "waiting");
    const d = doctorsById.get(a.doctorId)!;
    toast.success(`Checked in · token ${tokenCode(d, a.token)}`, {
      description: `${patientsById.get(a.patientId)?.name} → ${d.name}, ${d.room}`,
      action: { label: "Undo", onClick: () => setStatus(a.id, "scheduled") },
    });
  }

  return (
    <>
      <PageHeader
        title="Reception desk"
        description={`${formatDateShort(DEMO_TODAY)} · ${today.filter((a) => a.status === "waiting").length} waiting · ${today.filter((a) => a.status === "scheduled").length} yet to arrive`}
        actions={
          <>
            <Button variant="secondary" icon={<UserPlus className="size-4" />} onClick={() => setRegisterOpen(true)}>
              New patient
            </Button>
            <Button icon={<CalendarPlus className="size-4" />} onClick={() => setBook({ patient: null })}>
              Walk-in booking
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          {/* Patient lookup */}
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold">Find patient</h2>
              <span className="hidden items-center gap-0.5 text-xs text-ink-subtle sm:flex">
                <Kbd>Ctrl</Kbd>
                <Kbd>K</Kbd>
              </span>
            </div>
            <SearchInput value={query} onChange={setQuery} placeholder="Name, mobile number or UHID" size="lg" className="mt-3" />
            {term.length >= 2 && (
              <div className="mt-3 animate-fade-in overflow-hidden rounded-[10px] border border-line">
                {matches.map((p) => {
                  const appt = today.find((a) => a.patientId === p.id && a.status !== "cancelled");
                  const doc = appt ? doctorsById.get(appt.doctorId) : undefined;
                  return (
                    <div key={p.id} className="flex flex-col gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:flex-row sm:items-center">
                      <Link href={`/hospital/patients/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar name={p.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium hover:text-brand-700">{p.name}</p>
                          <p className="truncate text-xs text-ink-muted">
                            {p.gender[0]}, {ageFrom(p.dob, DEMO_TODAY)}y · {formatPhone(p.phone)} · {p.uhid}
                          </p>
                        </div>
                      </Link>
                      {appt && doc ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink-muted">
                            {formatMinutes(appt.start)} · {doc.name}
                          </span>
                          {appt.status === "scheduled" ? (
                            <Button size="sm" icon={<LogIn className="size-3.5" />} onClick={() => checkIn(appt)}>
                              Check in
                            </Button>
                          ) : (
                            <AppointmentStatusBadge status={appt.status} />
                          )}
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" icon={<CalendarPlus className="size-3.5" />} onClick={() => setBook({ patient: p })}>
                          Book &amp; check in
                        </Button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setRegisterOpen(true)}
                  className="flex w-full items-center gap-2 bg-subtle/60 px-4 py-2.5 text-left text-[13px] font-medium text-brand-700 hover:bg-brand-50"
                >
                  <UserPlus className="size-4" />
                  {matches.length ? "Not the right person? Register a new patient" : `No patient found for "${query.trim()}". Register new patient`}
                </button>
              </div>
            )}
          </Card>

          {/* Arrivals */}
          <Card>
            <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[15px] font-semibold">Today&apos;s patients</h2>
                
              </div>
              <Segmented
                size="sm"
                value={deptFilter}
                onChange={setDeptFilter}
                options={[
                  { value: "all", label: "All bookings" },
                  { value: "online", label: <><Globe className="size-3" /> Online only</> },
                ]}
              />
            </div>
            <Tabs
              className="mt-3 px-3"
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "expected", label: "Expected", count: lists.expected.length },
                { value: "waiting", label: "Waiting & in room", count: lists.waiting.length },
                { value: "done", label: "Done", count: lists.done.length },
              ]}
            />
            <ul className="divide-y divide-line">
              {(showAll ? visible : visible.slice(0, 25)).map((a) => {
                const p = patientsById.get(a.patientId)!;
                const d = doctorsById.get(a.doctorId)!;
                const late = a.status === "scheduled" && a.start < DEMO_NOW - 15;
                const wait = a.checkedInAt !== undefined ? DEMO_NOW - a.checkedInAt : 0;
                return (
                  <li key={a.id} className="flex flex-col gap-3 px-5 py-3 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="tnum w-[68px] shrink-0">
                        <p className="text-[13px] font-medium text-ink">{formatMinutes(a.start)}</p>
                        {late ? (
                          <p className="text-[11px] font-medium text-danger-700">Late</p>
                        ) : a.status === "waiting" ? (
                          <p className={cn("text-[11px]", wait > 30 ? "font-medium text-danger-700" : "text-ink-subtle")}>{wait} min wait</p>
                        ) : (
                          <ChannelTag channel={a.channel} />
                        )}
                      </div>
                      <Avatar name={p.name} size="sm" className="hidden sm:inline-flex" />
                      <div className="min-w-0">
                        <Link href={`/hospital/patients/${p.id}`} className="block truncate font-medium text-ink hover:text-brand-700">
                          {p.name}
                        </Link>
                        <p className="truncate text-xs text-ink-muted">
                          {d.name} · {a.visitType === "follow-up" ? "Follow-up" : "New visit"} · {a.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-[80px] md:pl-0">
                      {a.status !== "scheduled" && <TokenChip doctor={d} token={a.token} />}
                      {!a.paid && a.status !== "cancelled" && a.status !== "no-show" && (
                        <Button size="sm" variant="ghost" onClick={() => markPaid(a.id)} title="Record payment">
                          {formatINR(a.fee)} due
                        </Button>
                      )}
                      {a.status === "scheduled" && (
                        <>
                          <Button size="sm" variant="ghost" icon={<X className="size-3.5" />} onClick={() => setStatus(a.id, "no-show")} aria-label={`Mark ${p.name} as no-show`}>
                            <span className="hidden lg:inline">No-show</span>
                          </Button>
                          <Button size="sm" icon={<LogIn className="size-3.5" />} onClick={() => checkIn(a)}>
                            Check in
                          </Button>
                        </>
                      )}
                      {a.status === "waiting" && (
                        <>
                          <Button size="sm" variant="ghost" icon={<Undo2 className="size-3.5" />} onClick={() => setStatus(a.id, "scheduled")}>
                            Undo
                          </Button>
                          <Button size="sm" variant="secondary" icon={<Printer className="size-3.5" />} onClick={() => setSlip(a)}>
                            Token slip
                          </Button>
                        </>
                      )}
                      {a.status !== "scheduled" && a.status !== "waiting" && <AppointmentStatusBadge status={a.status} />}
                    </div>
                  </li>
                );
              })}
              {!showAll && visible.length > 25 && (
                <li className="px-5 py-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
                    Show all {visible.length} patients
                  </Button>
                </li>
              )}
              {visible.length === 0 && (
                <EmptyState
                  icon={<Check className="size-5" />}
                  title={tab === "expected" ? "Everyone has arrived" : tab === "waiting" ? "No one is waiting" : "Nothing completed yet"}
                />
              )}
            </ul>
          </Card>
        </div>

        {/* Doctor availability */}
        <aside className="space-y-4">
          <Card>
            <CardHeader title="Doctors on duty" description={`${state.doctors.filter((d) => state.doctorStatus[d.id] !== "on-leave" && state.doctorStatus[d.id] !== "off-duty").length} consulting now`} />
            <ul className="divide-y divide-line border-t border-line">
              {state.doctors.map((d) => {
                const status = state.doctorStatus[d.id]!;
                const next = openSlots(d, DEMO_TODAY, state.appointments)[0];
                const q = today.filter((a) => a.doctorId === d.id && a.status === "waiting").length;
                const disabled = status === "on-leave" || !next;
                return (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={d.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{d.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                        <DoctorStatusBadge status={status} />
                        {status !== "on-leave" && (
                          <span className="tnum">
                            {q} waiting · {next ? `next ${formatMinutes(next.start)}` : "full today"}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" disabled={disabled} onClick={() => setBook({ patient: null, doctorId: d.id })}>
                      Book
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>

      {book && (
        <BookAppointmentModal open onClose={() => setBook(null)} initialPatient={book.patient} initialDoctorId={book.doctorId} defaultCheckIn />
      )}
      {registerOpen && (
        <RegisterPatientModal
          open
          initialName={/\d/.test(query) ? "" : query.trim()}
          onClose={() => setRegisterOpen(false)}
          onRegistered={(p) => {
            setQuery(p.phone);
            setBook({ patient: p });
          }}
        />
      )}
      {slip && <TokenSlip appointment={slip} onClose={() => setSlip(null)} />}
    </>
  );
}

function TokenSlip({ appointment: a, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { state } = useWorkspace();
  const p = state.patients.find((x) => x.id === a.patientId)!;
  const d = state.doctors.find((x) => x.id === a.doctorId)!;
  const ahead = state.appointments.filter(
    (x) => x.date === a.date && x.doctorId === a.doctorId && x.status === "waiting" && (x.checkedInAt ?? 0) < (a.checkedInAt ?? 0),
  ).length;
  return (
    <div className="ds-root fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} />
      <div role="dialog" aria-label="Token slip" className="relative w-full max-w-xs animate-pop-in rounded-sheet bg-surface p-6 text-center shadow-pop">
        <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">{state.hospital.name}</p>
        <p className="mt-4 text-[13px] text-ink-muted">Your token</p>
        <p className="tnum text-5xl font-semibold tracking-tight">{tokenCode(d, a.token)}</p>
        <div className="mt-4 space-y-1 border-y border-dashed border-line-strong py-3 text-[13px]">
          <p className="font-medium">{p.name}</p>
          <p className="text-ink-muted">{d.name} · {d.room}</p>
          <p className="flex items-center justify-center gap-1 text-ink-muted">
            <Clock3 className="size-3.5" /> {ahead} patient{ahead === 1 ? "" : "s"} ahead of you
          </p>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-subtle">
          <IdCard className="size-3.5" /> {p.uhid}
          <span>·</span>
          <Phone className="size-3.5" /> SMS updates on
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            className="flex-1"
            icon={<Printer className="size-4" />}
            onClick={() => {
              toast.success("Token slip sent to printer");
              onClose();
            }}
          >
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
