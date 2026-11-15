"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Download,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import {
  clinicDate,
  dateAfter,
  DOCTORS,
  money,
  prettyDate,
  prettyTime,
} from "./types";
import { Avatar, Field } from "./ui";
import { BookingDrawing, HospitalDrawing } from "./illustrations";

type Confirmation = {
  reference: string;
  patientName: string;
  doctorId: string;
  date: string;
  time: string;
  fee: number;
};
export function Booking() {
  const [doctor, setDoctor] = useState(DOCTORS[0].id);
  const [date, setDate] = useState(clinicDate());
  const [slot, setSlot] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotLoading, setSlotLoading] = useState(true);
  const [slotError, setSlotError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "Female",
    reason: "",
    allergies: "",
  });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const selectedDoctor = DOCTORS.find((d) => d.id === doctor)!;
  useEffect(() => {
    const controller = new AbortController();
    setSlotLoading(true);
    setSlot("");
    setSlotError("");
    fetch(`/api/booking?doctor=${doctor}&date=${date}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      })
      .then((data) => setSlots(data.slots))
      .catch((e) => {
        if (e.name !== "AbortError")
          setSlotError(e.message || "Unable to load times. Please retry.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setSlotLoading(false);
      });
    return () => controller.abort();
  }, [doctor, date, refresh]);
  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const downloadCalendar = () => {
    if (!confirmation) return;
    const start = new Date(
      `${confirmation.date}T${confirmation.time}:00+05:30`,
    );
    const stamp = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    const data = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MediStock//Appointments//EN",
      "BEGIN:VEVENT",
      `UID:${confirmation.reference}@medistock.local`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(new Date(start.getTime() + 15 * 60000))}`,
      "SUMMARY:Appointment at Harmony Hospital",
      `DESCRIPTION:${DOCTORS.find((d) => d.id === confirmation.doctorId)!.name}. Reference ${confirmation.reference}.`,
      "LOCATION:Harmony Hospital - Hisar",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([data], { type: "text/calendar" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "hospital-appointment.ics";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="public-site">
      <header className="public-header">
        <Link href="/book" className="brand">
          <span className="brand-mark">
            <Activity size={24} />
          </span>
          MediStock<span className="brand-dot">.</span>
        </Link>
        <span className="public-hospital-name">HARMONY HOSPITAL · HISAR</span>
        <Link href="/book/manage" className="text-link">
          Manage booking
        </Link>
        <Link href="/login" className="text-link">
          Staff sign in <ArrowRight size={15} />
        </Link>
      </header>
      {confirmation ? (
        <main className="booking-confirmation">
          <BookingDrawing />
          <span className="eyebrow">ONE LESS THING TO THINK ABOUT</span>
          <h1>
            We’ll see you soon,
            <br />
            {confirmation.patientName.split(" ")[0]}.
          </h1>
          <p>
            Your appointment is confirmed. Keep your reference for check-in.
          </p>
          <div className="confirmation-card">
            <span className="confirmation-status">
              <CheckCircle2 size={16} />
              Appointment confirmed
            </span>
            <h3>{DOCTORS.find((d) => d.id === confirmation.doctorId)?.name}</h3>
            <p>
              {prettyDate(confirmation.date, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              <br />
              {prettyTime(confirmation.time)} · Harmony Hospital, Hisar
            </p>
            <div>
              <span>Booking reference</span>
              <strong>{confirmation.reference}</strong>
            </div>
            <div>
              <span>Consultation fee · pay at hospital</span>
              <strong>{money(confirmation.fee)}</strong>
            </div>
          </div>
          <div className="confirmation-actions">
            <Link
              className="button primary"
              href={`/book/manage?ref=${confirmation.reference}`}
            >
              Check status / change booking
            </Link>
            <button className="button primary" onClick={downloadCalendar}>
              <Download size={15} />
              Add to calendar
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setConfirmation(null);
                setForm({
                  name: "",
                  phone: "",
                  age: "",
                  gender: "Female",
                  reason: "",
                  allergies: "",
                });
                setConsent(false);
                setRefresh((n) => n + 1);
              }}
            >
              Book another appointment
            </button>
          </div>
          <p className="form-note">
            Please arrive 10 minutes early and share your booking reference at
            reception.
          </p>
        </main>
      ) : (
        <main className="booking-layout">
          <aside className="booking-intro">
            <span className="eyebrow">A LITTLE CLOSER TO FEELING BETTER</span>
            <h1>
              Your care.
              <br />
              Your time.
              <br />
              <span>We’re here.</span>
            </h1>
            <p>
              Choose your doctor and an available appointment time.
              <br />
              Confirm your details, then pay at the hospital. You can reschedule
              or cancel using your booking reference.
            </p>
            <HospitalDrawing className="booking-hospital-drawing" />
            <div className="booking-promises">
              <span>
                <Check size={15} />
                Choose a doctor and a time that suits you
              </span>
              <span>
                <Check size={15} />
                Instant confirmation, no phone calls needed
              </span>
              <span>
                <Check size={15} />
                Pay for your consultation at the hospital
              </span>
            </div>
            <div className="hospital-location">
              <MapPin size={19} />
              <div>
                <strong>Harmony Hospital</strong>
                <span>Hisar, Haryana · Consultations 9 AM – 5 PM IST</span>
              </div>
            </div>
          </aside>
          <section className="booking-form-panel">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!slot || busy || slotLoading) {
                  setError("Choose an available appointment time.");
                  return;
                }
                setBusy(true);
                setError("");
                try {
                  const response = await fetch("/api/booking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...form,
                      age: Number(form.age),
                      doctorId: doctor,
                      date,
                      time: slot,
                      consent,
                    }),
                  });
                  const data = await response.json();
                  if (!response.ok) {
                    if (response.status === 409) setRefresh((n) => n + 1);
                    throw new Error(data.error);
                  }
                  setConfirmation(data.booking);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Unable to book. Please try again.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="booking-step">
                <span>01</span>
                <div>
                  <h2>Find your care specialist.</h2>
                  <p>A little expertise. A lot of understanding.</p>
                </div>
              </div>
              <div className="doctor-options">
                {DOCTORS.map((d, i) => (
                  <label
                    className={`doctor-option ${doctor === d.id ? "doctor-option-selected" : ""}`}
                    key={d.id}
                  >
                    <input
                      type="radio"
                      name="doctor"
                      value={d.id}
                      checked={doctor === d.id}
                      onChange={() => setDoctor(d.id)}
                    />
                    <Avatar name={d.name.replace("Dr. ", "")} index={i + 1} />
                    <div>
                      <strong>{d.name}</strong>
                      <span>{d.specialty}</span>
                    </div>
                    <span>{money(d.fee)}</span>
                    {doctor === d.id && <CheckCircle2 size={17} />}
                  </label>
                ))}
              </div>
              <div className="booking-step">
                <span>02</span>
                <div>
                  <h2>Make a little time.</h2>
                  <p>Available times are shown in Indian Standard Time.</p>
                </div>
              </div>
              <Field label="Your appointment date">
                <input
                  aria-label="Your appointment date"
                  type="date"
                  required
                  min={clinicDate()}
                  max={dateAfter(30)}
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                />
              </Field>
              <fieldset className="slot-fieldset">
                <legend>Choose a time *</legend>
                {slotLoading ? (
                  <p className="slots-message">
                    Finding available appointments…
                  </p>
                ) : slotError ? (
                  <p className="slots-message text-amber" role="alert">
                    {slotError}{" "}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setRefresh((n) => n + 1)}
                    >
                      Try again
                    </button>
                  </p>
                ) : !slots.length ? (
                  <div className="slots-message">
                    <CalendarDays size={22} />
                    <p>
                      This day is fully booked or has ended.
                      <br />
                      Choose another date to find your time.
                    </p>
                  </div>
                ) : (
                  <div className="booking-slots">
                    {slots.map((s) => (
                      <label
                        className={slot === s ? "slot-selected" : ""}
                        key={s}
                      >
                        <input
                          type="radio"
                          name="time"
                          required
                          checked={slot === s}
                          onChange={() => setSlot(s)}
                          value={s}
                        />
                        {prettyTime(s)}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              <div className="booking-step">
                <span>03</span>
                <div>
                  <h2>A little about you.</h2>
                  <p>So we can be ready for your visit.</p>
                </div>
              </div>
              <div className="form-grid">
                <Field label="Full name *">
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </Field>
                <Field label="Mobile number *">
                  <div className="phone-input">
                    <span>+91</span>
                    <input
                      required
                      type="tel"
                      aria-label="Mobile number *"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      title="Enter a 10-digit Indian mobile number"
                      autoComplete="tel-national"
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                </Field>
                <Field label="Age (years) *">
                  <input
                    required
                    type="number"
                    min={0}
                    max={120}
                    placeholder="Age"
                    value={form.age}
                    onChange={(e) => set("age", e.target.value)}
                  />
                </Field>
                <Field label="Gender *">
                  <select
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                  >
                    {["Female", "Male", "Other"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </Field>
                <Field label="What brings you in? *" wide>
                  <textarea
                    required
                    rows={2}
                    minLength={2}
                    maxLength={1000}
                    placeholder="Briefly describe your reason for visiting..."
                    value={form.reason}
                    onChange={(e) => set("reason", e.target.value)}
                  />
                </Field>
                <Field label="Known allergies (optional)" wide>
                  <input
                    maxLength={500}
                    placeholder="Any allergies your doctor should know about"
                    value={form.allergies}
                    onChange={(e) => set("allergies", e.target.value)}
                  />
                </Field>
              </div>
              <label className="booking-consent">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  I agree to share these details with the hospital to arrange my
                  appointment and provide care.
                </span>
              </label>
              {error && (
                <p className="booking-error" role="alert">
                  {error}
                </p>
              )}
              <div className="booking-submit">
                <div>
                  <span>Consultation with {selectedDoctor.name}</span>
                  <strong>
                    {money(selectedDoctor.fee)}
                    <small>Pay at hospital</small>
                  </strong>
                </div>
                <button
                  className="button primary"
                  type="submit"
                  disabled={busy || !slot || slotLoading}
                >
                  {busy ? "Confirming…" : "Confirm appointment"}
                  <ArrowRight size={16} />
                </button>
              </div>
              <p className="booking-privacy">
                <ShieldCheck size={13} />
                Your details are shared only with the hospital care team.
              </p>
            </form>
          </section>
        </main>
      )}
      <footer className="public-footer">
        <span>MediStock. A little more care.</span>
        <span>Connected care, from your first hello.</span>
      </footer>
    </div>
  );
}
