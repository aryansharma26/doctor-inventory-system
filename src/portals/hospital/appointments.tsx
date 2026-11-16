"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarPlus,
  Download,
  IndianRupee,
  LogIn,
  MoreHorizontal,
  UserRound,
  UserX,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FilterBar,
  IconButton,
  Input,
  Menu,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  Tabs,
  addDays,
  formatDateShort,
  formatINR,
  formatMinutes,
} from "@/design-system";
import { DEMO_TODAY } from "@/mocks/catalog";
import type { Appointment, AppointmentStatus } from "@/mocks/types";
import { useWorkspace } from "./store";
import {
  AppointmentStatusBadge,
  BookAppointmentModal,
  ChannelTag,
  DateChips,
  PatientCell,
  SlotGrid,
  TokenChip,
} from "./shared";

type StatusTab = "all" | AppointmentStatus;
const PAGE = 12;

export function AppointmentsPage() {
  const { state, setStatus, markPaid } = useWorkspace();
  const router = useRouter();
  const [date, setDate] = useState(DEMO_TODAY);
  const [tab, setTab] = useState<StatusTab>("all");
  const [q, setQ] = useState("");
  const [doctor, setDoctor] = useState("");
  const [channel, setChannel] = useState("");
  const [page, setPage] = useState(1);
  const [bookOpen, setBookOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  const patients = useMemo(() => new Map(state.patients.map((p) => [p.id, p])), [state.patients]);
  const doctors = useMemo(() => new Map(state.doctors.map((d) => [d.id, d])), [state.doctors]);

  const forDay = state.appointments.filter((a) => a.date === date);
  const filtered = forDay
    .filter((a) => !doctor || a.doctorId === doctor)
    .filter((a) => !channel || a.channel === channel)
    .filter((a) => {
      const term = q.trim().toLowerCase();
      if (!term) return true;
      const p = patients.get(a.patientId)!;
      return p.name.toLowerCase().includes(term) || p.phone.includes(term) || p.uhid.toLowerCase().includes(term);
    });
  const count = (s: StatusTab) => (s === "all" ? filtered.length : filtered.filter((a) => a.status === s).length);
  const rows = filtered.filter((a) => tab === "all" || a.status === tab).sort((a, b) => a.start - b.start || a.token - b.token);
  const paged = rows.slice((page - 1) * PAGE, page * PAGE);

  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  function exportCsv() {
    const header = ["Token", "Time", "Patient", "UHID", "Doctor", "Status", "Channel", "Fee", "Paid"];
    const lines = rows.map((a) => {
      const p = patients.get(a.patientId)!;
      const d = doctors.get(a.doctorId)!;
      return [a.token, formatMinutes(a.start), p.name, p.uhid, d.name, a.status, a.channel, a.fee, a.paid ? "Yes" : "No"]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `appointments-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} appointments`);
  }

  return (
    <>
      <PageHeader
        title="Appointments"
        description={`${formatDateShort(date)} · ${forDay.filter((a) => a.status !== "cancelled").length} booked`}
        actions={
          <>
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv} disabled={!rows.length}>
              Export
            </Button>
            <Button icon={<CalendarPlus className="size-4" />} onClick={() => setBookOpen(true)}>
              Book appointment
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <DateChips value={date} onChange={resetPage(setDate)} days={7} />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => resetPage(setDate)(addDays(date, -1))}>
              Previous day
            </Button>
            <Input type="date" aria-label="Pick a date" value={date} onChange={(e) => e.target.value && resetPage(setDate)(e.target.value)} className="h-8 w-40 text-[13px]" />
          </div>
        </div>
        <FilterBar>
          <SearchInput value={q} onChange={resetPage(setQ)} placeholder="Search patient, mobile, UHID" className="sm:w-72" />
          <Select aria-label="Doctor" value={doctor} onChange={(e) => resetPage(setDoctor)(e.target.value)} className="sm:w-56">
            <option value="">All doctors</option>
            {state.doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Booking channel" value={channel} onChange={(e) => resetPage(setChannel)(e.target.value)} className="sm:w-40">
            <option value="">All channels</option>
            <option value="online">Online</option>
            <option value="walk-in">Walk-in</option>
            <option value="phone">Phone</option>
          </Select>
          {(q || doctor || channel) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setQ("");
                setDoctor("");
                setChannel("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </FilterBar>
        <Tabs
          className="px-3"
          value={tab}
          onChange={resetPage(setTab)}
          tabs={[
            { value: "all", label: "All", count: count("all") },
            { value: "scheduled", label: "Scheduled", count: count("scheduled") },
            { value: "waiting", label: "Waiting", count: count("waiting") },
            { value: "in-consultation", label: "In consultation", count: count("in-consultation") },
            { value: "completed", label: "Completed", count: count("completed") },
            { value: "no-show", label: "No-show", count: count("no-show") },
            { value: "cancelled", label: "Cancelled", count: count("cancelled") },
          ]}
        />
        {rows.length === 0 ? (
          <EmptyState
            title="No appointments match"
            description={q || doctor || channel ? "Try clearing the filters." : "No bookings for this day yet."}
            action={<Button size="sm" onClick={() => setBookOpen(true)}>Book appointment</Button>}
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th className="w-24">Token</Th>
                <Th>Time</Th>
                <Th>Patient</Th>
                <Th>Doctor</Th>
                <Th>Visit</Th>
                <Th>Status</Th>
                <Th className="text-right">Fee</Th>
                <Th className="w-12">
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {paged.map((a) => {
                  const p = patients.get(a.patientId)!;
                  const d = doctors.get(a.doctorId)!;
                  const actionable = a.status === "scheduled" || a.status === "waiting";
                  return (
                    <Tr key={a.id}>
                      <Td>
                        <TokenChip doctor={d} token={a.token} />
                      </Td>
                      <Td className="tnum whitespace-nowrap">{formatMinutes(a.start)}</Td>
                      <Td className="min-w-52">
                        <Link href={`/hospital/patients/${p.id}`} className="hover:[&_p:first-child]:text-brand-700">
                          <PatientCell patient={p} />
                        </Link>
                      </Td>
                      <Td className="min-w-44">
                        <p className="truncate">{d.name}</p>
                        <p className="truncate text-xs text-ink-muted">{state.departments.find((x) => x.id === d.departmentId)?.name}</p>
                      </Td>
                      <Td className="min-w-36">
                        <p className="text-[13px]">{a.visitType === "follow-up" ? "Follow-up" : "New"}</p>
                        <ChannelTag channel={a.channel} />
                      </Td>
                      <Td>
                        <AppointmentStatusBadge status={a.status} />
                      </Td>
                      <Td className="tnum text-right whitespace-nowrap">
                        {formatINR(a.fee)}
                        <p className={a.paid ? "text-xs text-success-700" : "text-xs text-ink-subtle"}>{a.paid ? "Paid" : "Unpaid"}</p>
                      </Td>
                      <Td>
                        <Menu
                          items={[
                            ...(a.status === "scheduled" && date === DEMO_TODAY
                              ? [{ label: "Check in", icon: <LogIn />, onSelect: () => setStatus(a.id, "waiting") }]
                              : []),
                            { label: "View patient", icon: <UserRound />, onSelect: () => router.push(`/hospital/patients/${p.id}`) },
                            ...(actionable ? [{ label: "Reschedule", icon: <CalendarClock />, onSelect: () => setRescheduling(a) }] : []),
                            ...(!a.paid && a.status !== "cancelled" ? [{ label: "Record payment", icon: <IndianRupee />, onSelect: () => markPaid(a.id) }] : []),
                            ...(actionable
                              ? [
                                  "divider" as const,
                                  ...(date <= DEMO_TODAY ? [{ label: "Mark no-show", icon: <UserX />, onSelect: () => setStatus(a.id, "no-show") }] : []),
                                  { label: "Cancel appointment", icon: <XCircle />, tone: "danger" as const, onSelect: () => setCancelling(a) },
                                ]
                              : []),
                          ]}
                          trigger={(tp) => (
                            <IconButton label={`Actions for ${p.name}`} size="sm" {...tp}>
                              <MoreHorizontal className="size-4" />
                            </IconButton>
                          )}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={PAGE} total={rows.length} onPage={setPage} />
          </>
        )}
      </Card>

      {bookOpen && <BookAppointmentModal open onClose={() => setBookOpen(false)} />}
      {rescheduling && <RescheduleModal appointment={rescheduling} onClose={() => setRescheduling(null)} />}
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        tone="danger"
        title="Cancel this appointment?"
        description={
          cancelling
            ? `${patients.get(cancelling.patientId)?.name}'s ${formatMinutes(cancelling.start)} appointment will be cancelled and the slot freed. The patient will get an SMS.`
            : ""
        }
        confirmLabel="Cancel appointment"
        onConfirm={() => {
          if (!cancelling) return;
          setStatus(cancelling.id, "cancelled");
          toast.success("Appointment cancelled");
        }}
      />
    </>
  );
}

export function RescheduleModal({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { state, reschedule } = useWorkspace();
  const doctor = state.doctors.find((d) => d.id === appointment.doctorId)!;
  const [date, setDate] = useState(appointment.date < DEMO_TODAY ? DEMO_TODAY : appointment.date);
  const [start, setStart] = useState<number | null>(null);
  return (
    <Modal
      open
      onClose={onClose}
      title="Reschedule appointment"
      description={`${state.patients.find((p) => p.id === appointment.patientId)?.name} with ${doctor.name}. Currently ${formatDateShort(appointment.date)}, ${formatMinutes(appointment.start)}.`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={start === null}
            onClick={() => {
              reschedule(appointment.id, date, start!);
              onClose();
            }}
          >
            Confirm new time
          </Button>
        </>
      }
    >
      <DateChips
        value={date}
        doctor={doctor}
        days={10}
        onChange={(d) => {
          setDate(d);
          setStart(null);
        }}
      />
      <div className="mt-4">
        <SlotGrid doctor={doctor} date={date} value={start} onChange={setStart} />
      </div>
    </Modal>
  );
}
