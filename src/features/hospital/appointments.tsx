"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Copy,
  Globe,
  Printer,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useHospital } from "./provider";
import {
  clinicDate,
  DOCTORS,
  prettyDate,
  prettyTime,
  type Visit,
} from "./types";
import { Avatar, Empty, Modal, PageHeading, Status } from "./ui";
import { PrintDocument } from "./print-document";

export function Appointments({ followUps = false }: { followUps?: boolean }) {
  const { visits, patients, role, act } = useHospital();
  const [date, setDate] = useState(clinicDate());
  const [doctor, setDoctor] = useState("ALL");
  const [search, setSearch] = useState("");
  const [print, setPrint] = useState<Visit | null>(null);
  const [cancel, setCancel] = useState<Visit | null>(null);
  const [busy, setBusy] = useState(false);
  const filtered = visits
    .filter(
      (v) =>
        (followUps ? v.followUp === date : v.date === date) &&
        (doctor === "ALL" || v.doctorId === doctor) &&
        `${patients.find((p) => p.id === v.patientId)?.name} ${v.id}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const shiftDay = (days: number) => {
    const value = new Date(date + "T12:00:00+05:30");
    value.setUTCDate(value.getUTCDate() + days);
    setDate(clinicDate(value));
  };
  return (
    <>
      <PageHeading
        eyebrow={followUps ? "KEEP CARE GOING" : "A DAY, THOUGHTFULLY PLANNED"}
        title={
          followUps ? "A little follow-through." : "Every visit has its place."
        }
        description={
          followUps
            ? "Recommended follow-ups from completed consultations. Book a new appointment to confirm a visit."
            : "Online bookings and walk-in visits, together in one appointment book."
        }
      >
        <Link className="button secondary" href="/reminders">
          <CalendarDays size={15} />
          Follow-ups
        </Link>
        <Link className="button primary" href="/book" target="_blank">
          <Globe size={15} />
          Book an appointment <ArrowUpRight size={14} />
        </Link>
      </PageHeading>
      <div className="online-booking-banner">
        <span className="online-banner-icon">
          <CalendarDays size={24} strokeWidth={1.5} />
        </span>
        <div>
          <strong>Let the first step happen from home.</strong>
          <p>
            Share your booking page. New appointments arrive here automatically.
          </p>
        </div>
        <button
          className="button secondary small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${window.location.origin}/book`,
              );
              toast.success("Booking link copied.");
            } catch {
              toast.error("Copy the booking page URL from your browser.");
            }
          }}
        >
          <Copy size={14} />
          Copy booking link
        </button>
      </div>
      <section className="surface">
        <div className="appointment-date-toolbar">
          <div>
            <button
              className="icon-button"
              aria-label="Previous day"
              onClick={() => shiftDay(-1)}
            >
              <ArrowLeft size={16} />
            </button>
            <label className="appointment-date">
              <CalendarDays size={16} />
              <input
                type="date"
                aria-label="Appointment date"
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
              />
            </label>
            <button
              className="icon-button"
              aria-label="Next day"
              onClick={() => shiftDay(1)}
            >
              <ArrowRight size={16} />
            </button>
            <button
              className="button secondary small"
              onClick={() => setDate(clinicDate())}
            >
              Today
            </button>
          </div>
          <span>
            {filtered.length} {followUps ? "recommended follow-ups" : "visits"}
          </span>
        </div>
        <div className="filter-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search appointments"
              placeholder="Find patient or appointment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter appointments by doctor"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
          >
            <option value="ALL">All doctors</option>
            {DOCTORS.map((d) => (
              <option value={d.id} key={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{followUps ? "Follow-up date" : "Time / source"}</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Reason for visit</th>
                <th>Status</th>
                <th className="align-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const p = patients.find((p) => p.id === v.patientId)!;
                return (
                  <tr key={v.id}>
                    <td>
                      <strong className="cell-title">
                        {followUps
                          ? prettyDate(v.followUp)
                          : prettyTime(v.time)}
                      </strong>
                      <span className="cell-sub">
                        {v.source === "Online" && <Globe size={10} />}{" "}
                        {followUps ? "Recommended" : v.source}
                      </span>
                    </td>
                    <td>
                      <div className="table-person">
                        <Avatar name={p.name} index={i} small />
                        <div>
                          <strong>{p.name}</strong>
                          <span>
                            {p.phone} · {v.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="cell-title">
                        {DOCTORS.find((d) => d.id === v.doctorId)?.name}
                      </strong>
                      <span className="cell-sub">
                        {DOCTORS.find((d) => d.id === v.doctorId)?.specialty}
                      </span>
                    </td>
                    <td>
                      <span className="cell-sub truncate-cell">{v.reason}</span>
                    </td>
                    <td>
                      <Status status={v.status} />
                    </td>
                    <td>
                      <div className="row-actions">
                        {v.status === "BOOKED" &&
                        date === clinicDate() &&
                        ["ADMIN", "RECEPTION"].includes(role || "") ? (
                          <button
                            className="button primary small"
                            onClick={() =>
                              void act(
                                { action: "checkin", visitId: v.id },
                                "Patient checked in. Their OPD token is ready.",
                              ).catch(() => {})
                            }
                          >
                            <Check size={13} />
                            Check in
                          </button>
                        ) : (
                          <button
                            className="icon-button"
                            aria-label={`Print appointment for ${p.name}`}
                            onClick={() => setPrint(v)}
                          >
                            <Printer size={16} />
                          </button>
                        )}
                        {["ADMIN", "RECEPTION"].includes(role || "") &&
                          ["BOOKED", "WAITING"].includes(v.status) && (
                            <button
                              className="icon-button danger"
                              aria-label={`Cancel appointment for ${p.name}`}
                              onClick={() => setCancel(v)}
                            >
                              <X size={15} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && (
            <Empty
              title={
                followUps
                  ? "No follow-ups for this day"
                  : "A little room in the diary."
              }
              description="Choose another date or share your booking link with a patient."
            />
          )}
        </div>
      </section>
      {cancel && (
        <Modal
          title="Cancel this appointment?"
          description="The appointment is removed from the active diary. Its patient and payment records are kept."
          close={() => setCancel(null)}
        >
          <div className="modal-body">
            <p>
              {patients.find((p) => p.id === cancel.patientId)?.name} ·{" "}
              {prettyDate(cancel.date)} · {prettyTime(cancel.time)}
            </p>
            {cancel.paid && (
              <p className="form-note">
                The payment stays recorded. Arrange any refund at the billing
                desk.
              </p>
            )}
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setCancel(null)}
            >
              Keep appointment
            </button>
            <button
              className="button danger-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await act(
                    { action: "cancel", visitId: cancel.id },
                    "Appointment cancelled.",
                  );
                  setCancel(null);
                } catch {
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Cancelling…" : "Cancel appointment"}
            </button>
          </div>
        </Modal>
      )}
      {print && (
        <PrintDocument
          visit={print}
          patient={patients.find((p) => p.id === print.patientId)!}
          close={() => setPrint(null)}
        />
      )}
    </>
  );
}
