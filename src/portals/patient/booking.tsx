"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock,
  GraduationCap,
  Languages,
  MapPin,
  Phone,
  Star,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Segmented,
  Skeleton,
  Textarea,
  addDays,
  formatDate,
  formatDateShort,
  formatINR,
  formatMinutes,
  useMockQuery,
} from "@/design-system";
import { cn } from "@/lib/utils";
import { DEMO_TODAY } from "@/mocks/catalog";
import { openSlots, sessionLabel, slotsFor, tokenCode, worksOn, type BookedSlot } from "@/mocks/scheduling";
import type { AppointmentStatus, Gender } from "@/mocks/types";
import {
  ApiError,
  createOnlineBooking,
  fetchBookingContext,
  fetchBookingStatus,
  lookupPatients,
  type BookingContext,
  type BookingStatus,
  type PublicDoctor,
} from "@/services/mock-api";

type Step = 1 | 2 | 3 | 4;
type Details = { phone: string; name: string; gender: Gender | ""; dob: string; reason: string };
type Match = { id: string; displayName: string };

const LAST_BOOKING_KEY = "medistock.last-booking";
const DAYS_AHEAD = 7;
const STATUS_POLL_MS = 3000;
const NEW_PATIENT = "new";

/** Only called after data has loaded, which happens in the browser. */
function lastBookingId() {
  try {
    return window.sessionStorage.getItem(LAST_BOOKING_KEY);
  } catch {
    return null;
  }
}

function bookedSlots(ctx: BookingContext): BookedSlot[] {
  return ctx.taken.map((t) => ({ ...t, status: "scheduled" as const }));
}

export function PatientBooking() {
  const query = useMockQuery(() => fetchBookingContext());
  const [fresh, setFresh] = useState<BookingContext | null>(null);
  const ctx = fresh ?? query.data ?? null;

  const [step, setStep] = useState<Step>(1);
  const [dept, setDept] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(DEMO_TODAY);
  const [start, setStart] = useState<number | null>(null);
  const [details, setDetails] = useState<Details>({ phone: "", name: "", gender: "", dob: "", reason: "" });
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [who, setWho] = useState<string>(NEW_PATIENT);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [slotError, setSlotError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // undefined = not decided yet: fall back to a booking made earlier in this tab.
  const [chosenBookingId, setBookingId] = useState<string | null | undefined>(undefined);
  const bookingId = chosenBookingId === undefined && ctx ? lastBookingId() : (chosenBookingId ?? null);

  const taken = useMemo(() => (ctx ? bookedSlots(ctx) : []), [ctx]);
  const doctor = ctx?.doctors.find((d) => d.id === doctorId);
  const returning = matches?.find((m) => m.id === who);

  if (query.error) return <Frame><ErrorState title="Couldn't load doctors" onRetry={query.retry} /></Frame>;
  if (!ctx)
    return (
      <Frame>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      </Frame>
    );

  if (bookingId) {
    return (
      <Frame hospital={ctx.hospital.name}>
        <Confirmation
          bookingId={bookingId}
          ctx={ctx}
          onNew={() => {
            try {
              window.sessionStorage.removeItem(LAST_BOOKING_KEY);
            } catch {}
            setBookingId(null);
            setStep(1);
            setDoctorId("");
            setStart(null);
            setDetails({ phone: "", name: "", gender: "", dob: "", reason: "" });
            setMatches(null);
            setWho(NEW_PATIENT);
            fetchBookingContext().then(setFresh).catch(() => {});
          }}
        />
      </Frame>
    );
  }

  function onPhoneChange(raw: string) {
    const phone = raw.replace(/\D/g, "").slice(0, 10);
    setDetails((d) => ({ ...d, phone }));
    setMatches(null);
    setWho(NEW_PATIENT);
    if (phone.length !== 10) return;
    setLookingUp(true);
    lookupPatients(phone)
      .then((found) => {
        setMatches(found);
        setWho(found[0]?.id ?? NEW_PATIENT);
      })
      .catch(() => setMatches([]))
      .finally(() => setLookingUp(false));
  }

  function validateDetails() {
    const e: typeof errors = {};
    if (details.phone.length !== 10) e.phone = "Enter your 10-digit mobile number";
    if (!returning) {
      if (details.name.trim().length < 2) e.name = "Enter the patient's full name";
      if (!details.gender) e.gender = "Select gender";
      if (!details.dob) e.dob = "Enter date of birth";
      else if (details.dob > DEMO_TODAY) e.dob = "Date of birth can't be in the future";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function confirm() {
    if (!doctor || start === null) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const id = await createOnlineBooking({
        doctorId: doctor.id,
        date,
        start,
        reason: details.reason.trim(),
        phone: details.phone,
        ...(returning
          ? { patientId: returning.id }
          : { patient: { name: details.name.trim(), gender: details.gender as Gender, dob: details.dob } }),
      });
      try {
        window.sessionStorage.setItem(LAST_BOOKING_KEY, id);
      } catch {}
      setBookingId(id);
      window.scrollTo({ top: 0 });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // Slot was taken meanwhile: refresh availability and send the patient back to pick again.
        fetchBookingContext().then(setFresh).catch(() => {});
        setStart(null);
        setStep(2);
        setSlotError(e.message);
      } else {
        setSubmitError(e instanceof Error ? e.message : "Couldn't confirm the booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const doctors = ctx.doctors.filter((d) => !dept || d.departmentId === dept);

  return (
    <Frame hospital={ctx.hospital.name}>
      <Stepper step={step} />

      {step === 1 && (
        <section className="animate-fade-in">
          <h1 className="text-xl font-semibold">Choose a doctor</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {ctx.hospital.name}, {ctx.hospital.area}
          </p>
          <div className="ds-scroll -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {[{ id: "", name: "All" }, ...ctx.departments].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDept(d.id)}
                aria-pressed={dept === d.id}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-colors",
                  dept === d.id ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface text-ink hover:border-brand-400",
                )}
              >
                {d.name}
              </button>
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {doctors.map((d) => {
              const next = nextAvailable(d, taken);
              return (
                <li key={d.id}>
                  <DoctorCard
                    doctor={d}
                    department={ctx.departments.find((x) => x.id === d.departmentId)?.name ?? ""}
                    next={next}
                    onSelect={() => {
                      setDoctorId(d.id);
                      setDate(next?.date ?? DEMO_TODAY);
                      setStart(null);
                      setSlotError("");
                      setStep(2);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === 2 && doctor && (
        <section className="animate-fade-in">
          <BackButton onClick={() => setStep(1)} />
          <DoctorSummary doctor={doctor} />
          <h2 className="mt-6 text-base font-semibold">Pick a date</h2>
          <div className="ds-scroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(DEMO_TODAY, i)).map((d, i) => {
              const off = !worksOn(doctor, d);
              const open = off ? 0 : openSlots(doctor, d, taken).length;
              const [dow, rest] = formatDateShort(d).split(", ");
              return (
                <button
                  key={d}
                  type="button"
                  disabled={open === 0}
                  onClick={() => {
                    setDate(d);
                    setStart(null);
                  }}
                  aria-pressed={date === d}
                  className={cn(
                    "flex h-[72px] w-16 shrink-0 flex-col items-center justify-center rounded-[12px] border text-xs transition-colors disabled:cursor-not-allowed",
                    date === d ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface hover:border-brand-400",
                    open === 0 && date !== d && "border-dashed bg-subtle text-ink-subtle",
                  )}
                >
                  <span className={cn("font-medium", date === d ? "text-white/80" : "text-ink-muted")}>{i === 0 ? "Today" : dow}</span>
                  <span className="tnum text-base font-semibold">{rest!.split(" ")[0]}</span>
                  <span className={cn("text-[10px]", date === d ? "text-white/80" : "text-ink-subtle")}>
                    {off ? "No OPD" : open === 0 ? "Full" : `${open} open`}
                  </span>
                </button>
              );
            })}
          </div>
          <h2 className="mt-6 text-base font-semibold">Pick a time</h2>
          {slotError && (
            <p role="alert" className="mt-2 rounded-[10px] bg-warning-50 px-3 py-2 text-[13px] text-warning-700">
              {slotError}
            </p>
          )}
          <SlotPicker doctor={doctor} date={date} taken={taken} value={start} onChange={setStart} />
          <StickyAction>
            <Button size="lg" className="w-full" disabled={start === null} onClick={() => setStep(3)}>
              Continue
              <ChevronRight className="size-4" />
            </Button>
          </StickyAction>
        </section>
      )}

      {step === 3 && doctor && start !== null && (
        <section className="animate-fade-in">
          <BackButton onClick={() => setStep(2)} />
          <h1 className="text-xl font-semibold">Patient details</h1>
          <p className="mt-1 text-sm text-ink-muted">Your token and updates will be sent to this mobile number.</p>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!lookingUp && validateDetails()) setStep(4);
            }}
          >
            <Field label="Mobile number" required error={errors.phone} hint={lookingUp ? "Checking for existing records…" : undefined}>
              {(id) => (
                <div className="flex">
                  <span className="inline-flex h-11 items-center rounded-l-control border border-r-0 border-line-strong bg-subtle px-3 text-[15px] text-ink-muted">+91</span>
                  <Input
                    id={id}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={details.phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="98220 12345"
                    className="h-11 rounded-l-none text-[15px]"
                    aria-invalid={!!errors.phone}
                  />
                </div>
              )}
            </Field>

            {matches && matches.length > 0 && (
              <fieldset className="rounded-[12px] border border-line bg-surface p-3">
                <legend className="px-1 text-[13px] font-medium">Who is this appointment for?</legend>
                <div className="mt-1 space-y-1">
                  {matches.map((m) => (
                    <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-[8px] px-2 py-2 hover:bg-subtle">
                      <input type="radio" name="who" className="size-4 accent-brand-600" checked={who === m.id} onChange={() => setWho(m.id)} />
                      <Avatar name={m.displayName} size="sm" />
                      <span className="text-sm">
                        {m.displayName}
                        <span className="block text-xs text-ink-muted">Registered patient</span>
                      </span>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-3 rounded-[8px] px-2 py-2 hover:bg-subtle">
                    <input type="radio" name="who" className="size-4 accent-brand-600" checked={who === NEW_PATIENT} onChange={() => setWho(NEW_PATIENT)} />
                    <span className="flex size-8 items-center justify-center rounded-full bg-ink/[0.05] text-ink-subtle">
                      <UserPlus className="size-4" />
                    </span>
                    <span className="text-sm">Someone else</span>
                  </label>
                </div>
              </fieldset>
            )}

            {!returning && (
              <>
                <Field label="Full name" required error={errors.name}>
                  {(id) => (
                    <Input id={id} autoComplete="name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} placeholder="As on your ID" className="h-11 text-[15px]" aria-invalid={!!errors.name} />
                  )}
                </Field>
                <Field label="Gender" required error={errors.gender}>
                  {() => (
                    <Segmented
                      className="w-full [&>button]:h-10 [&>button]:flex-1 [&>button]:justify-center"
                      value={details.gender || ("" as Gender)}
                      onChange={(g) => setDetails({ ...details, gender: g })}
                      options={(["Female", "Male", "Other"] as const).map((g) => ({ value: g, label: g }))}
                    />
                  )}
                </Field>
                <Field label="Date of birth" required error={errors.dob}>
                  {(id) => <Input id={id} type="date" max={DEMO_TODAY} value={details.dob} onChange={(e) => setDetails({ ...details, dob: e.target.value })} className="h-11 text-[15px]" aria-invalid={!!errors.dob} />}
                </Field>
              </>
            )}

            <Field label="Reason for visit" hint="Optional. Helps the doctor prepare.">
              {(id) => <Textarea id={id} rows={3} value={details.reason} onChange={(e) => setDetails({ ...details, reason: e.target.value })} placeholder="e.g. Fever for 3 days" className="text-[15px]" />}
            </Field>
            <StickyAction>
              <Button type="submit" size="lg" className="w-full" disabled={lookingUp}>
                Review booking
                <ChevronRight className="size-4" />
              </Button>
            </StickyAction>
          </form>
        </section>
      )}

      {step === 4 && doctor && start !== null && (
        <section className="animate-fade-in">
          <BackButton onClick={() => setStep(3)} />
          <h1 className="text-xl font-semibold">Review and confirm</h1>
          <Card className="mt-4 divide-y divide-line">
            <ReviewRow icon={<Stethoscope className="size-4" />} label="Doctor" value={`${doctor.name} · ${doctor.specialty}`} />
            <ReviewRow icon={<CalendarCheck className="size-4" />} label="Date and time" value={`${date === DEMO_TODAY ? "Today" : formatDateShort(date)}, ${formatMinutes(start)}`} />
            <ReviewRow icon={<Building2 className="size-4" />} label="Hospital" value={`${ctx.hospital.name}, ${doctor.room}`} />
            <ReviewRow icon={<Phone className="size-4" />} label="Patient" value={`${returning ? returning.displayName : details.name.trim()} · +91 ${details.phone}`} />
            {details.reason.trim() && <ReviewRow icon={<Clock className="size-4" />} label="Reason" value={details.reason.trim()} />}
          </Card>
          <div className="mt-4 flex items-center justify-between rounded-[12px] bg-subtle px-4 py-3">
            <span className="text-sm text-ink-muted">Consultation fee, pay at the hospital</span>
            <span className="tnum text-base font-semibold">{formatINR(doctor.fee)}</span>
          </div>
          <p className="mt-3 text-xs text-ink-subtle">Please arrive 15 minutes early. You can cancel by calling {ctx.hospital.phone}.</p>
          {submitError && (
            <p role="alert" className="mt-3 rounded-[10px] bg-danger-50 px-3 py-2 text-[13px] text-danger-700">
              {submitError}
            </p>
          )}
          <StickyAction>
            <Button size="lg" className="w-full" loading={submitting} onClick={confirm}>
              Confirm booking
            </Button>
          </StickyAction>
        </section>
      )}
    </Frame>
  );
}

/* ------------------------------------------------------------------ Pieces */

function Frame({ children, hospital }: { children: React.ReactNode; hospital?: string }) {
  return (
    <div className="ds-root min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-2.5 px-4">
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[13px] font-semibold">Book an appointment</p>
            {hospital && <p className="truncate text-[11px] text-ink-subtle">{hospital}</p>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pt-5 pb-32">{children}</main>
    </div>
  );
}

const STEPS = ["Doctor", "Time", "Details", "Confirm"];

function Stepper({ step }: { step: Step }) {
  return (
    <ol className="mb-6 flex items-center gap-2" aria-label="Booking steps">
      {STEPS.map((label, i) => {
        const n = (i + 1) as Step;
        return (
          <li key={label} className="flex flex-1 flex-col gap-1.5" aria-current={n === step ? "step" : undefined}>
            <span className={cn("h-1 rounded-full", n <= step ? "bg-brand-600" : "bg-ink/[0.08]")} />
            <span className={cn("text-[11px]", n === step ? "font-medium text-ink" : "text-ink-subtle")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="-ml-1 mb-3 inline-flex items-center gap-1 rounded-control px-1 py-1 text-[13px] text-ink-muted hover:text-ink">
      <ArrowLeft className="size-4" /> Back
    </button>
  );
}

function StickyAction({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-md">
      <div className="mx-auto max-w-xl px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">{children}</div>
    </div>
  );
}

function nextAvailable(doctor: PublicDoctor, taken: BookedSlot[]) {
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = addDays(DEMO_TODAY, i);
    const slot = openSlots(doctor, d, taken)[0];
    if (slot) return { date: d, start: slot.start };
  }
  return undefined;
}

function DoctorCard({
  doctor,
  department,
  next,
  onSelect,
}: {
  doctor: PublicDoctor;
  department: string;
  next?: { date: string; start: number };
  onSelect: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar name={doctor.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{doctor.name}</p>
          <p className="text-[13px] text-ink-muted">
            {doctor.specialty} · {department}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="size-3.5 text-ink-subtle" />
              {doctor.qualifications.join(", ")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 text-ink-subtle" />
              {doctor.rating} · {doctor.experienceYears} yrs
            </span>
            <span className="inline-flex items-center gap-1">
              <Languages className="size-3.5 text-ink-subtle" />
              {doctor.languages.join(", ")}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="min-w-0">
          <p className="tnum text-sm font-semibold">{formatINR(doctor.fee)}</p>
          <p className="truncate text-xs text-ink-muted">
            {next ? `Next: ${next.date === DEMO_TODAY ? "Today" : formatDateShort(next.date)}, ${formatMinutes(next.start)}` : "No slots this week"}
          </p>
        </div>
        <Button onClick={onSelect} disabled={!next}>
          Book
        </Button>
      </div>
    </Card>
  );
}

function DoctorSummary({ doctor }: { doctor: PublicDoctor }) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-4 py-3">
      <Avatar name={doctor.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{doctor.name}</p>
        <p className="truncate text-xs text-ink-muted">
          {doctor.specialty} · {doctor.room}
        </p>
      </div>
      <span className="tnum text-sm font-semibold">{formatINR(doctor.fee)}</span>
    </div>
  );
}

function SlotPicker({
  doctor,
  date,
  taken,
  value,
  onChange,
}: {
  doctor: PublicDoctor;
  date: string;
  taken: BookedSlot[];
  value: number | null;
  onChange: (s: number) => void;
}) {
  const slots = slotsFor(doctor, date, taken).filter((s) => !s.past);
  if (!worksOn(doctor, date)) return <p className="mt-3 text-[13px] text-ink-muted">{doctor.name} has no OPD on this day.</p>;
  if (slots.length === 0) return <p className="mt-3 text-[13px] text-ink-muted">No more slots today. Pick another day.</p>;
  const groups = slots.reduce<Record<string, typeof slots>>((acc, s) => {
    (acc[sessionLabel(s.start)] ??= []).push(s);
    return acc;
  }, {});
  return (
    <div className="mt-3 space-y-4">
      {Object.entries(groups).map(([label, list]) => (
        <div key={label}>
          <p className="mb-2 text-xs font-medium text-ink-muted">{label}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {list.map((s) => (
              <button
                key={s.start}
                type="button"
                disabled={s.taken}
                onClick={() => onChange(s.start)}
                aria-pressed={value === s.start}
                className={cn(
                  "tnum h-11 rounded-[10px] border text-[13px] font-medium transition-colors",
                  s.taken
                    ? "cursor-not-allowed border-transparent bg-ink/[0.04] text-ink-subtle line-through"
                    : value === s.start
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line-strong bg-surface hover:border-brand-400 hover:bg-brand-50",
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

function ReviewRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <span className="mt-0.5 text-ink-subtle">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-subtle">{label}</p>
        <p className="text-sm text-ink">{value}</p>
      </div>
    </div>
  );
}

const STATUS_STEPS: Array<{ status: AppointmentStatus[]; label: string }> = [
  { status: ["scheduled"], label: "Booked" },
  { status: ["waiting"], label: "Checked in" },
  { status: ["in-consultation"], label: "With doctor" },
  { status: ["completed"], label: "Done" },
];

/** Loads the booking from the database and keeps refreshing its status. */
function Confirmation({ bookingId, ctx, onNew }: { bookingId: string; ctx: BookingContext; onNew: () => void }) {
  const [data, setData] = useState<BookingStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    const load = () =>
      fetchBookingStatus(bookingId)
        .then((d) => {
          if (!live) return;
          setData(d);
          setError("");
        })
        .catch((e: unknown) => live && setError(e instanceof Error ? e.message : "Couldn't load the booking."));
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), STATUS_POLL_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [bookingId]);

  if (!data) {
    if (error) return <ErrorState title="Couldn't load your booking" description={error} onRetry={onNew} />;
    return <Skeleton className="h-96 rounded-card" />;
  }

  const a = data.appointment;
  const doctor = ctx.doctors.find((d) => d.id === a.doctorId);
  if (!doctor) return <ErrorState title="Couldn't load your booking" onRetry={onNew} />;
  const code = tokenCode(doctor, a.token);
  const stage = STATUS_STEPS.findIndex((s) => s.status.includes(a.status));
  const closed = a.status === "cancelled" || a.status === "no-show";
  const isToday = a.date === DEMO_TODAY;

  return (
    <section className="animate-fade-in">
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-50 text-success-600">
          <Check className="size-6" />
        </div>
        <h1 className="mt-3 text-xl font-semibold">Appointment confirmed</h1>
        <p className="mt-1 text-sm text-ink-muted">Show this token at the reception desk.</p>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="bg-brand-600 px-5 py-6 text-center text-white">
          <p className="text-xs tracking-wide text-white/70 uppercase">Your token</p>
          <p className="tnum mt-1 text-5xl font-semibold tracking-tight">{code}</p>
          <p className="mt-2 text-sm text-white/85">
            {isToday ? "Today" : formatDate(a.date)}, {formatMinutes(a.start)}
          </p>
        </div>
        <div className="divide-y divide-line">
          <ReviewRow icon={<Stethoscope className="size-4" />} label="Doctor" value={`${doctor.name} · ${doctor.specialty}`} />
          <ReviewRow icon={<MapPin className="size-4" />} label="Where" value={`${ctx.hospital.name}, ${doctor.room}. ${ctx.hospital.address}`} />
          <ReviewRow icon={<Phone className="size-4" />} label="Patient" value={`${data.patient.name} · +91 ${data.patient.phoneMasked}`} />
          <ReviewRow icon={<CalendarCheck className="size-4" />} label="Fee" value={`${formatINR(a.fee)} · ${a.paid ? "Paid" : "Pay at reception"}`} />
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Live status</p>
          {closed ? (
            <Badge tone="danger" dot>
              {a.status === "cancelled" ? "Cancelled" : "Missed"}
            </Badge>
          ) : (
            <Badge tone={a.status === "scheduled" ? "neutral" : a.status === "completed" ? "success" : "brand"} dot>
              {STATUS_STEPS[Math.max(0, stage)]!.label}
            </Badge>
          )}
        </div>
        {!closed && (
          <ol className="mt-4 grid grid-cols-4 gap-2">
            {STATUS_STEPS.map((s, i) => (
              <li key={s.label} className="flex flex-col gap-1.5">
                <span className={cn("h-1 rounded-full", i <= stage ? "bg-brand-600" : "bg-ink/[0.08]")} />
                <span className={cn("text-[11px]", i === stage ? "font-medium text-ink" : "text-ink-subtle")}>{s.label}</span>
              </li>
            ))}
          </ol>
        )}
        {isToday && (a.status === "scheduled" || a.status === "waiting") && (
          <p className="mt-4 text-[13px] text-ink-muted">
            {data.ahead === 0 ? "You're next in line." : `${data.ahead} patient${data.ahead === 1 ? "" : "s"} ahead of you with ${doctor.name}.`}
          </p>
        )}
        {a.status === "in-consultation" && <p className="mt-4 text-[13px] text-ink-muted">Please go to {doctor.room}.</p>}
      </Card>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <a
          href={`tel:${ctx.hospital.phone.replace(/\s/g, "")}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-surface text-[15px] font-medium shadow-card hover:bg-subtle"
        >
          <Phone className="size-4" /> Call hospital
        </a>
        <Button size="lg" variant="secondary" onClick={onNew}>
          Book another
        </Button>
      </div>
    </section>
  );
}
