"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  clinicDate,
  dateAfter,
  DOCTORS,
  money,
  prettyDate,
  prettyTime,
  type VisitStatus,
} from "./types";
import { Field, Modal, Status } from "./ui";
type BookingStatus = {
  reference: string;
  patientName: string;
  doctorId: string;
  date: string;
  time: string;
  status: VisitStatus;
  token: string;
  fee: number;
  paid: boolean;
  queuePosition: number | null;
};
export function ManageBooking() {
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<BookingStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [change, setChange] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [date, setDate] = useState(dateAfter(1));
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReference(params.get("ref") || "");
  }, []);
  useEffect(() => {
    if (!change || !booking) return;
    const controller = new AbortController();
    setLoadingSlots(true);
    setTime("");
    fetch(`/api/booking?doctor=${booking.doctorId}&date=${date}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setSlots(data.slots);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSlots(false);
      });
    return () => controller.abort();
  }, [change, booking, date]);
  async function request(operation = "status") {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/booking/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: reference.trim(),
          phone,
          operation,
          ...(operation === "reschedule" ? { date, time } : {}),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setBooking(data.booking);
      setChange(false);
      setCancel(false);
      if (operation === "reschedule")
        setNotice("Your new appointment time is confirmed.");
      if (operation === "cancel")
        setNotice("Your appointment has been cancelled.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to check your booking.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="public-site">
      <header className="public-header">
        <Link className="brand" href="/book">
          <span className="brand-mark">
            <Activity size={24} />
          </span>
          MediStock.
        </Link>
        <Link className="text-link" href="/book">
          <ArrowLeft size={16} />
          New appointment
        </Link>
      </header>
      <main className="manage-booking">
        <span className="eyebrow">HARMONY HOSPITAL</span>
        <h1>Manage your appointment</h1>
        <p>
          Use the booking reference and mobile number you entered when booking.
        </p>
        <form
          className="surface booking-lookup"
          onSubmit={(e) => {
            e.preventDefault();
            void request();
          }}
        >
          <Field label="Booking reference">
            <input
              required
              value={reference}
              autoCapitalize="characters"
              onChange={(e) => setReference(e.target.value)}
              placeholder="AP-…"
            />
          </Field>
          <Field label="Mobile number">
            <input
              required
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
            />
          </Field>
          <button className="button primary" disabled={busy}>
            {busy ? "Checking…" : "Find appointment"}
          </button>
        </form>
        {error && (
          <p className="booking-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="booking-notice" role="status">
            <Check size={16} />
            {notice}
          </p>
        )}
        {booking && (
          <section className="surface booking-status">
            <div>
              <h2>{booking.patientName}</h2>
              <Status status={booking.status} />
            </div>
            <h3>{DOCTORS.find((d) => d.id === booking.doctorId)?.name}</h3>
            <p>
              <CalendarDays size={17} />
              {prettyDate(booking.date)} · {prettyTime(booking.time)}
            </p>
            <p>
              Consultation fee: {money(booking.fee)} ·{" "}
              {booking.paid ? "Paid" : "Pay at hospital"}
            </p>
            {booking.token && (
              <div className="booking-queue-token">
                <span>Your OPD token</span>
                <strong>{booking.token}</strong>
                {booking.queuePosition && (
                  <p>Position {booking.queuePosition} in the waiting queue</p>
                )}
                {booking.status === "CALLED" && (
                  <p>
                    Please proceed to room{" "}
                    {DOCTORS.find((d) => d.id === booking.doctorId)?.room}.
                  </p>
                )}
              </div>
            )}
            <p className="form-note">
              Arrive 10 minutes before your appointment. Reception assigns your
              queue token after check-in. Queue order can change for urgent
              patients.
            </p>
            <div className="booking-manage-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void request()}
              >
                <RefreshCw size={15} />
                Refresh status
              </button>
              {booking.status === "BOOKED" && (
                <>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setError("");
                      setChange(true);
                    }}
                  >
                    Change date / time
                  </button>
                  <button
                    className="button danger-button"
                    onClick={() => setCancel(true)}
                  >
                    Cancel appointment
                  </button>
                </>
              )}
            </div>
          </section>
        )}
        {change && booking && (
          <Modal title="Change appointment time" close={() => setChange(false)}>
            <div className="modal-body message-compose">
              <Field label="New appointment date">
                <input
                  type="date"
                  min={clinicDate()}
                  max={dateAfter(30)}
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                />
              </Field>
              <Field label="New appointment time">
                <select
                  disabled={loadingSlots}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  <option value="">
                    {loadingSlots
                      ? "Loading available times…"
                      : "Choose a time"}
                  </option>
                  {slots.map((s) => (
                    <option key={s} value={s}>
                      {prettyTime(s)}
                    </option>
                  ))}
                </select>
              </Field>
              {!loadingSlots && !slots.length && (
                <p>No available times. Try another date.</p>
              )}
              {error && (
                <p className="booking-error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setChange(false)}
              >
                Keep current time
              </button>
              <button
                className="button primary"
                disabled={!time || busy || loadingSlots}
                onClick={() => void request("reschedule")}
              >
                {busy ? "Saving…" : "Confirm new time"}
              </button>
            </div>
          </Modal>
        )}
        {cancel && (
          <Modal
            title="Cancel your appointment?"
            description="Your reserved time will become available to other patients."
            close={() => setCancel(false)}
          >
            <div className="modal-body">
              {booking?.paid && (
                <p>
                  For a payment refund, contact the hospital reception desk.
                </p>
              )}
              {error && <p className="booking-error">{error}</p>}
            </div>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setCancel(false)}
              >
                Keep appointment
              </button>
              <button
                className="button danger-button"
                disabled={busy}
                onClick={() => void request("cancel")}
              >
                Confirm cancellation
              </button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
