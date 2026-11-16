"use client";

import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CalendarCheck, Check, Globe, Phone, Footprints, UserPlus } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ErrorState,
  Field,
  Input,
  Modal,
  SearchInput,
  Segmented,
  Select,
  Skeleton,
  Textarea,
  Toggle,
  addDays,
  ageFrom,
  formatDateShort,
  formatINR,
  formatMinutes,
  formatPhone,
  type Tone,
} from "@/design-system";
import { cn } from "@/lib/utils";
import { DEMO_TODAY } from "@/mocks/catalog";
import { openSlots, sessionLabel, slotsFor, tokenCode, worksOn } from "@/mocks/scheduling";
import type { AppointmentStatus, BookingChannel, Doctor, DoctorStatus, Gender, Patient } from "@/mocks/types";
import { useHospitalStore, useWorkspace } from "./store";

/* ------------------------------------------------------------ Gate */

export function WorkspaceGate({ children }: { children: ReactNode }) {
  const { state, loading, error, retry } = useHospitalStore();
  if (error) return <ErrorState title="Couldn't load the hospital workspace" onRetry={retry} />;
  if (loading || !state)
    return (
      <div aria-busy="true" aria-label="Loading workspace">
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="mb-8 h-4 w-80" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[112px] rounded-card" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-card lg:col-span-2" />
          <Skeleton className="h-80 rounded-card" />
        </div>
      </div>
    );
  return <>{children}</>;
}

/* ---------------------------------------------------------- Badges */

export const APPT_STATUS: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  scheduled: { label: "Scheduled", tone: "neutral" },
  waiting: { label: "Waiting", tone: "warning" },
  "in-consultation": { label: "In consultation", tone: "brand" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  "no-show": { label: "No-show", tone: "danger" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const s = APPT_STATUS[status];
  return (
    <Badge tone={s.tone} dot className={status === "cancelled" ? "line-through decoration-ink-subtle/60" : undefined}>
      {s.label}
    </Badge>
  );
}

export const DOCTOR_STATUS: Record<DoctorStatus, { label: string; tone: Tone }> = {
  available: { label: "Available", tone: "success" },
  "in-consultation": { label: "In consultation", tone: "brand" },
  "on-break": { label: "On break", tone: "warning" },
  "off-duty": { label: "Off duty", tone: "neutral" },
  "on-leave": { label: "On leave", tone: "danger" },
};

export function DoctorStatusBadge({ status }: { status: DoctorStatus }) {
  const s = DOCTOR_STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

const CHANNEL: Record<BookingChannel, { label: string; icon: ReactNode }> = {
  online: { label: "Online", icon: <Globe className="size-3" /> },
  "walk-in": { label: "Walk-in", icon: <Footprints className="size-3" /> },
  phone: { label: "Phone", icon: <Phone className="size-3" /> },
};

export function ChannelTag({ channel }: { channel: BookingChannel }) {
  const c = CHANNEL[channel];
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
      {c.icon}
      {c.label}
    </span>
  );
}

export function TokenChip({ doctor, token, size = "md" }: { doctor: Pick<Doctor, "name">; token: number; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "tnum inline-flex items-center justify-center rounded-[7px] border border-brand-200 bg-brand-50 font-semibold text-brand-800",
        size === "lg" ? "h-9 min-w-16 px-2.5 text-[15px]" : "h-7 min-w-14 px-2 text-xs",
      )}
    >
      {tokenCode(doctor, token)}
    </span>
  );
}

export function PatientCell({ patient, sub }: { patient: Patient; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={patient.name} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{patient.name}</p>
        <p className="truncate text-xs text-ink-muted">
          {sub ?? (
            <>
              {patient.gender[0]}, {ageFrom(patient.dob, DEMO_TODAY)}y · {patient.uhid}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------- Patient registration */

const EMPTY_FORM = {
  name: "",
  phone: "",
  gender: "" as Gender | "",
  dob: "",
  bloodGroup: "",
  email: "",
  address: "",
  abhaId: "",
  allergies: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyPhone: "",
};

export function RegisterPatientModal({
  open,
  onClose,
  onRegistered,
  initialName = "",
}: {
  open: boolean;
  onClose: () => void;
  onRegistered?: (p: Patient) => void;
  initialName?: string;
}) {
  const { registerPatient, state } = useWorkspace();
  const [form, setForm] = useState({ ...EMPTY_FORM, name: initialName });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const set = (k: keyof typeof EMPTY_FORM) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const duplicate = useMemo(() => {
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10) return undefined;
    return state.patients.find((p) => p.phone.endsWith(digits.slice(-10)));
  }, [form.phone, state.patients]);

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Enter the patient's full name";
    if (form.phone.replace(/\D/g, "").length !== 10) e.phone = "Enter a 10-digit mobile number";
    if (!form.gender) e.gender = "Select gender";
    if (!form.dob) e.dob = "Enter date of birth";
    else if (form.dob > DEMO_TODAY) e.dob = "Date of birth can't be in the future";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      const p = registerPatient({
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ""),
        gender: form.gender as Gender,
        dob: form.dob,
        bloodGroup: form.bloodGroup || "Unknown",
        email: form.email || undefined,
        address: form.address,
        abhaId: form.abhaId || undefined,
        allergies: form.allergies.split(",").map((a) => a.trim()).filter(Boolean),
        conditions: [],
        emergencyContact: form.emergencyName
          ? { name: form.emergencyName, relation: form.emergencyRelation || "Relative", phone: form.emergencyPhone }
          : undefined,
      });
      setSubmitting(false);
      toast.success("Patient registered", { description: `${p.name} · ${p.uhid}` });
      setForm({ ...EMPTY_FORM });
      onRegistered?.(p);
      onClose();
    }, 300);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Register new patient"
      description="Fields marked * are required."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={submitting} onClick={submit} icon={<UserPlus className="size-4" />}>
            Register patient
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name} className="sm:col-span-2">
            {(id) => <Input id={id} value={form.name} onChange={set("name")} placeholder="e.g. Sneha Patil" aria-invalid={!!errors.name} data-autofocus />}
          </Field>
          <Field label="Mobile number" required error={errors.phone} hint="Used for SMS token updates">
            {(id) => (
              <div className="flex">
                <span className="inline-flex h-9 items-center rounded-l-control border border-r-0 border-line-strong bg-subtle px-2.5 text-sm text-ink-muted">+91</span>
                <Input id={id} inputMode="numeric" maxLength={10} value={form.phone} onChange={set("phone")} placeholder="98220 12345" className="rounded-l-none" aria-invalid={!!errors.phone} />
              </div>
            )}
          </Field>
          <Field label="Gender" required error={errors.gender}>
            {() => (
              <Segmented
                className="w-full [&>button]:flex-1 [&>button]:justify-center"
                value={form.gender || ("" as Gender)}
                onChange={(g) => setForm((f) => ({ ...f, gender: g }))}
                options={(["Female", "Male", "Other"] as const).map((g) => ({ value: g, label: g }))}
              />
            )}
          </Field>
          <Field label="Date of birth" required error={errors.dob}>
            {(id) => <Input id={id} type="date" max={DEMO_TODAY} value={form.dob} onChange={set("dob")} aria-invalid={!!errors.dob} />}
          </Field>
          <Field label="Blood group">
            {(id) => (
              <Select id={id} value={form.bloodGroup} onChange={set("bloodGroup")}>
                <option value="">Not known</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        {duplicate && (
          <div className="flex items-center justify-between gap-3 rounded-[10px] border border-warning-600/25 bg-warning-50 px-3.5 py-2.5 text-[13px]">
            <span className="text-warning-700">
              <strong className="font-semibold">{duplicate.name}</strong> ({duplicate.uhid}) is already registered with this number.
            </span>
            {onRegistered && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onRegistered(duplicate);
                  onClose();
                }}
              >
                Use existing
              </Button>
            )}
          </div>
        )}

        <details className="group rounded-[10px] border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13px] font-medium text-ink">
            Additional details
            <span className="text-xs font-normal text-ink-subtle group-open:hidden">Email, address, ABHA, allergies, emergency contact</span>
          </summary>
          <div className="grid gap-4 border-t border-line px-4 py-4 sm:grid-cols-2">
            <Field label="Email" error={errors.email}>
              {(id) => <Input id={id} type="email" value={form.email} onChange={set("email")} placeholder="name@example.com" />}
            </Field>
            <Field label="ABHA ID" hint="Ayushman Bharat Health Account">
              {(id) => <Input id={id} value={form.abhaId} onChange={set("abhaId")} placeholder="91-XXXX-XXXX-XXXX" />}
            </Field>
            <Field label="Address" className="sm:col-span-2">
              {(id) => <Input id={id} value={form.address} onChange={set("address")} placeholder="Flat, building, area" />}
            </Field>
            <Field label="Known allergies" hint="Separate with commas" className="sm:col-span-2">
              {(id) => <Input id={id} value={form.allergies} onChange={set("allergies")} placeholder="e.g. Penicillin, Peanuts" />}
            </Field>
            <Field label="Emergency contact">
              {(id) => <Input id={id} value={form.emergencyName} onChange={set("emergencyName")} placeholder="Name" />}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Relation">
                {(id) => <Input id={id} value={form.emergencyRelation} onChange={set("emergencyRelation")} placeholder="Spouse" />}
              </Field>
              <Field label="Phone">
                {(id) => <Input id={id} inputMode="numeric" value={form.emergencyPhone} onChange={set("emergencyPhone")} placeholder="10 digits" />}
              </Field>
            </div>
          </div>
        </details>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

/* --------------------------------------------------- Patient picker */

export function PatientPicker({
  value,
  onChange,
  onRegisterNew,
}: {
  value: Patient | null;
  onChange: (p: Patient | null) => void;
  onRegisterNew: (name: string) => void;
}) {
  const { state } = useWorkspace();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    return state.patients
      .filter((p) => p.name.toLowerCase().includes(term) || p.phone.includes(term) || p.uhid.toLowerCase().includes(term))
      .slice(0, 6);
  }, [q, state.patients]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[10px] border border-brand-200 bg-brand-50/50 px-3 py-2.5">
        <PatientCell patient={value} sub={`${value.uhid} · ${formatPhone(value.phone)}`} />
        <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
          Change
        </Button>
      </div>
    );
  }
  return (
    <div>
      <SearchInput value={q} onChange={setQ} placeholder="Search by name, mobile or UHID" autoFocus />
      {q.trim().length >= 2 && (
        <div className="mt-2 overflow-hidden rounded-[10px] border border-line">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p)}
              className="flex w-full items-center justify-between gap-3 border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-subtle"
            >
              <PatientCell patient={p} sub={`${p.uhid} · ${formatPhone(p.phone)}`} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onRegisterNew(q)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-brand-700 hover:bg-brand-50"
          >
            <UserPlus className="size-4" />
            {results.length ? "Not listed? Register a new patient" : `No match. Register "${q.trim()}" as new patient`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------- Slot grid */

export function SlotGrid({
  doctor,
  date,
  value,
  onChange,
}: {
  doctor: Doctor;
  date: string;
  value: number | null;
  onChange: (start: number) => void;
}) {
  const { state } = useWorkspace();
  const slots = slotsFor(doctor, date, state.appointments).filter((s) => !s.past);
  if (!worksOn(doctor, date))
    return <p className="rounded-[10px] bg-subtle px-3 py-4 text-center text-[13px] text-ink-muted">{doctor.name} has no OPD on this day.</p>;
  if (slots.length === 0)
    return <p className="rounded-[10px] bg-subtle px-3 py-4 text-center text-[13px] text-ink-muted">Today’s OPD hours are over. Pick another day.</p>;
  const groups = slots.reduce<Record<string, typeof slots>>((acc, s) => {
    (acc[sessionLabel(s.start)] ??= []).push(s);
    return acc;
  }, {});
  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([label, list]) => (
        <div key={label}>
          <p className="mb-1.5 text-xs font-medium text-ink-muted">
            {label} · <span className="tnum">{list.filter((s) => !s.taken).length} open</span>
          </p>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {list.map((s) => (
              <button
                key={s.start}
                type="button"
                disabled={s.taken}
                onClick={() => onChange(s.start)}
                aria-pressed={value === s.start}
                className={cn(
                  "tnum h-8 rounded-[7px] border text-xs font-medium transition-colors",
                  s.taken
                    ? "cursor-not-allowed border-transparent bg-ink/[0.04] text-ink-subtle line-through"
                    : value === s.start
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line-strong bg-surface text-ink hover:border-brand-400 hover:bg-brand-50",
                )}
              >
                {formatMinutes(s.start)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------- Book appointment modal */

export function DateChips({ value, onChange, days = 7, doctor }: { value: string; onChange: (d: string) => void; days?: number; doctor?: Doctor }) {
  return (
    <div className="ds-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {Array.from({ length: days }, (_, i) => addDays(DEMO_TODAY, i)).map((d, i) => {
        const off = doctor ? !worksOn(doctor, d) : false;
        const [dow, rest] = formatDateShort(d).split(", ");
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            aria-pressed={value === d}
            className={cn(
              "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[10px] border text-xs transition-colors",
              value === d ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface hover:border-brand-400",
              off && value !== d && "text-ink-subtle",
            )}
          >
            <span className={cn("font-medium", value === d ? "text-white/80" : "text-ink-muted")}>{i === 0 ? "Today" : dow}</span>
            <span className="tnum text-sm font-semibold">{rest!.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function BookAppointmentModal({
  open,
  onClose,
  initialPatient = null,
  initialDoctorId,
  initialDate = DEMO_TODAY,
  initialStart,
  defaultCheckIn = false,
}: {
  open: boolean;
  onClose: () => void;
  initialPatient?: Patient | null;
  initialDoctorId?: string;
  initialDate?: string;
  initialStart?: number;
  defaultCheckIn?: boolean;
}) {
  const { state, book } = useWorkspace();
  const [patient, setPatient] = useState<Patient | null>(initialPatient);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const initialDoctor = state.doctors.find((d) => d.id === initialDoctorId);
  const [dept, setDept] = useState<string>(initialDoctor?.departmentId ?? "");
  const [doctorId, setDoctorId] = useState(initialDoctorId ?? "");
  const [date, setDate] = useState(initialDate);
  const firstOpen = (id: string, d: string) => {
    const doc = state.doctors.find((x) => x.id === id);
    return doc ? (openSlots(doc, d, state.appointments)[0]?.start ?? null) : null;
  };
  const [start, setStart] = useState<number | null>(() =>
    initialStart ?? (initialDoctorId ? firstOpen(initialDoctorId, initialDate) : null),
  );
  const [visitType, setVisitType] = useState<"new" | "follow-up">("new");
  const [channel, setChannel] = useState<BookingChannel>("walk-in");
  const [reason, setReason] = useState("");
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [done, setDone] = useState<{ token: number; doctor: Doctor; start: number; date: string } | null>(null);

  const doctors = state.doctors.filter((d) => !dept || d.departmentId === dept);
  const doctor = state.doctors.find((d) => d.id === doctorId);

  function reset() {
    setPatient(initialPatient);
    setDoctorId(initialDoctorId ?? "");
    setDept(initialDoctor?.departmentId ?? "");
    setDate(DEMO_TODAY);
    setStart(null);
    setReason("");
    setDone(null);
    setCheckIn(defaultCheckIn);
  }

  function close() {
    reset();
    onClose();
  }

  function submit() {
    if (!patient || !doctor || start === null) return;
    const appt = book({
      patientId: patient.id,
      doctorId: doctor.id,
      date,
      start,
      visitType,
      channel,
      reason,
      checkInNow: checkIn && date === DEMO_TODAY,
    });
    setDone({ token: appt.token, doctor, start, date });
  }

  const canSubmit = !!patient && !!doctor && start !== null;
  const fee = doctor ? (visitType === "follow-up" ? doctor.followUpFee : doctor.fee) : 0;

  if (done) {
    return (
      <Modal open={open} onClose={close} title="Appointment booked" size="sm" footer={<Button onClick={close}>Done</Button>}>
        <div className="py-2 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-success-50 text-success-600">
            <Check className="size-5" />
          </div>
          <p className="text-[13px] text-ink-muted">Token number</p>
          <p className="tnum mt-1 text-4xl font-semibold tracking-tight text-ink">{tokenCode(done.doctor, done.token)}</p>
          <p className="mt-3 text-sm text-ink">
            {patient?.name} with {done.doctor.name}
          </p>
          <p className="text-[13px] text-ink-muted">
            {done.date === DEMO_TODAY ? "Today" : formatDateShort(done.date)}, {formatMinutes(done.start)} · {done.doctor.room}
          </p>
          {checkIn && done.date === DEMO_TODAY && (
            <Badge tone="warning" dot className="mt-3">
              Checked in, now in waiting queue
            </Badge>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        open={open && !registerOpen}
        onClose={close}
        size="lg"
        title="Book appointment"
        footer={
          <>
            <div className="mr-auto hidden items-center text-[13px] text-ink-muted sm:flex">
              {doctor && start !== null && (
                <span>
                  Fee <strong className="tnum font-semibold text-ink">{formatINR(fee)}</strong>
                </span>
              )}
            </div>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button disabled={!canSubmit} onClick={submit} icon={<CalendarCheck className="size-4" />}>
              {checkIn && date === DEMO_TODAY ? "Book & check in" : "Book appointment"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <section>
            <p className="mb-2 text-[13px] font-medium">1. Patient</p>
            <PatientPicker
              value={patient}
              onChange={setPatient}
              onRegisterNew={(name) => {
                setRegisterName(name);
                setRegisterOpen(true);
              }}
            />
          </section>

          <section>
            <p className="mb-2 text-[13px] font-medium">2. Doctor</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                aria-label="Department"
                value={dept}
                onChange={(e) => {
                  setDept(e.target.value);
                  setDoctorId("");
                  setStart(null);
                }}
              >
                <option value="">All departments</option>
                {state.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Doctor"
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(e.target.value);
                  setStart(firstOpen(e.target.value, date));
                }}
              >
                <option value="">Select doctor</option>
                {doctors.map((d) => {
                  const st = state.doctorStatus[d.id];
                  const open = openSlots(d, date, state.appointments).length;
                  return (
                    <option key={d.id} value={d.id} disabled={st === "on-leave"}>
                      {d.name} · {d.specialty}
                      {st === "on-leave" ? " (on leave)" : ` · ${open} open`}
                    </option>
                  );
                })}
              </Select>
            </div>
          </section>

          {doctor && (
            <section className="animate-fade-in">
              <p className="mb-2 text-[13px] font-medium">3. Date &amp; time</p>
              <DateChips
                value={date}
                doctor={doctor}
                onChange={(d) => {
                  setDate(d);
                  setStart(firstOpen(doctorId, d));
                }}
              />
              <div className="mt-3">
                <SlotGrid doctor={doctor} date={date} value={start} onChange={setStart} />
              </div>
            </section>
          )}

          {doctor && (
            <section className="grid gap-4 sm:grid-cols-2">
              <Field label="Visit type">
                {() => (
                  <Segmented
                    className="w-full [&>button]:flex-1 [&>button]:justify-center"
                    value={visitType}
                    onChange={setVisitType}
                    options={[
                      { value: "new", label: `New · ${formatINR(doctor.fee)}` },
                      { value: "follow-up", label: `Follow-up · ${formatINR(doctor.followUpFee)}` },
                    ]}
                  />
                )}
              </Field>
              <Field label="Booked via">
                {() => (
                  <Segmented
                    className="w-full [&>button]:flex-1 [&>button]:justify-center"
                    value={channel}
                    onChange={setChannel}
                    options={[
                      { value: "walk-in", label: "Walk-in" },
                      { value: "phone", label: "Phone" },
                    ]}
                  />
                )}
              </Field>
              <Field label="Reason for visit" className="sm:col-span-2">
                {(id) => <Textarea id={id} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fever for 3 days" className="min-h-0" />}
              </Field>
              {date === DEMO_TODAY && (
                <div className="sm:col-span-2">
                  <Toggle checked={checkIn} onChange={setCheckIn} label="Check in now" description="Adds the patient to the waiting queue now." />
                </div>
              )}
            </section>
          )}
        </div>
      </Modal>
      {registerOpen && (
        <RegisterPatientModal
          open
          initialName={/^\d+$/.test(registerName.trim()) ? "" : registerName.trim()}
          onClose={() => setRegisterOpen(false)}
          onRegistered={(p) => setPatient(p)}
        />
      )}
    </>
  );
}
