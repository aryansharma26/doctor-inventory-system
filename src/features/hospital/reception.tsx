"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardList,
  Plus,
  Printer,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { useHospital } from "./provider";
import {
  clinicDate,
  DOCTORS,
  EMPTY_VITALS,
  money,
  prettyTime,
  type Patient,
  type Visit,
} from "./types";
import { Avatar, Empty, Field, Modal, PageHeading, Status } from "./ui";
import { PrintDocument } from "./print-document";
import { IntakeVitals } from "./intake-vitals";

export function RegisterPatient({
  close,
  onCreated,
}: {
  close: () => void;
  onCreated: (visit: Visit) => void;
}) {
  const { patients, act } = useHospital();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "Female",
    allergies: "",
    reason: "",
    doctorId: DOCTORS[0].id,
    priority: "Routine",
    paid: false,
    paymentMethod: "Cash",
  });
  const [vitals, setVitals] = useState({ ...EMPTY_VITALS });
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const fill = (p: Patient) =>
    setForm((prev) => ({
      ...prev,
      name: p.name,
      phone: p.phone,
      age: String(p.age),
      gender: p.gender,
      allergies: p.allergies,
    }));
  return (
    <Modal
      title="A warm welcome starts here."
      description="Register a walk-in, record the essentials and issue their OPD slip."
      close={close}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            const visit = await act(
              { ...form, age: Number(form.age), vitals, action: "register" },
              "Patient registered. Their token is ready.",
            );
            onCreated(visit as Visit);
          } catch {
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body">
          <label className="field">
            <span>Returning patient? Find their record</span>
            <select
              defaultValue=""
              onChange={(e) => {
                const p = patients.find((p) => p.id === e.target.value);
                if (p) fill(p);
              }}
            >
              <option value="">New patient — enter details below</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.phone}
                </option>
              ))}
            </select>
          </label>
          <div className="form-section-label">
            <UserPlus size={15} />
            PATIENT DETAILS
          </div>
          <div className="form-grid">
            <Field label="Full name *">
              <input
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. Ananya Singh"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                autoComplete="name"
              />
            </Field>
            <Field label="Mobile number *">
              <div className="phone-input">
                <span>+91</span>
                <input
                  type="tel"
                  aria-label="Mobile number *"
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  title="10-digit Indian mobile number"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </Field>
            <Field label="Age (years) *">
              <input
                type="number"
                required
                min={0}
                max={120}
                placeholder="28"
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
            <Field label="Known allergies" wide>
              <input
                placeholder="Record known allergies, or leave blank if not provided"
                maxLength={500}
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
              />
            </Field>
            <Field label="Reason for visit *" wide>
              <textarea
                required
                minLength={2}
                maxLength={1000}
                rows={2}
                placeholder="A brief note for the doctor..."
                value={form.reason}
                onChange={(e) => set("reason", e.target.value)}
              />
            </Field>
            <Field label="Consulting doctor">
              <select
                value={form.doctorId}
                onChange={(e) => set("doctorId", e.target.value)}
              >
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.specialty}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Visit priority">
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
                <option>Routine</option>
                <option>Urgent</option>
              </select>
            </Field>
          </div>
          <details className="vitals-details">
            <summary>
              Record vitals <span>Optional · only enter measured values</span>
            </summary>
            <div className="form-grid vitals-grid">
              <Field label="Blood pressure">
                <input
                  placeholder="120/80"
                  pattern="[0-9]{2,3}/[0-9]{2,3}"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                />
              </Field>
              {(
                [
                  {
                    key: "pulse",
                    label: "Pulse (bpm)",
                    min: 20,
                    max: 250,
                    step: 1,
                  },
                  {
                    key: "temperature",
                    label: "Temperature (°C)",
                    min: 30,
                    max: 45,
                    step: 0.1,
                  },
                  {
                    key: "weight",
                    label: "Weight (kg)",
                    min: 0.1,
                    max: 500,
                    step: 0.1,
                  },
                  { key: "spo2", label: "SpO₂ (%)", min: 1, max: 100, step: 1 },
                ] as const
              ).map((v) => (
                <Field key={v.key} label={v.label}>
                  <input
                    type="number"
                    min={v.min}
                    max={v.max}
                    step={v.step}
                    value={vitals[v.key]}
                    onChange={(e) =>
                      setVitals({ ...vitals, [v.key]: e.target.value })
                    }
                    placeholder="—"
                  />
                </Field>
              ))}
            </div>
          </details>
          <div className="fee-box">
            <div>
              <span>Consultation fee</span>
              <strong>
                {money(DOCTORS.find((d) => d.id === form.doctorId)!.fee)}
              </strong>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.paid}
                onChange={(e) => set("paid", e.target.checked)}
              />
              Payment collected
            </label>
            <select
              aria-label="Payment method"
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
            >
              {["Cash", "UPI", "Card"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={busy}>
            <ClipboardList size={16} />
            {busy ? "Registering…" : "Register & generate slip"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function Reception() {
  const { patients, visits, act } = useHospital();
  const [register, setRegister] = useState(false);
  const [print, setPrint] = useState<Visit | null>(null);
  const [intake, setIntake] = useState<Visit | null>(null);
  const [cancel, setCancel] = useState<Visit | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [doctor, setDoctor] = useState("ALL");
  const today = visits.filter((v) => v.date === clinicDate());
  const filtered = today
    .filter((v) => {
      const p = patients.find((p) => p.id === v.patientId)!;
      return (
        (status === "ALL" || status === v.status) &&
        (doctor === "ALL" || doctor === v.doctorId) &&
        `${p.name} ${p.phone} ${v.token}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    })
    .sort(
      (a, b) =>
        Number(b.priority === "Urgent") - Number(a.priority === "Urgent") ||
        a.time.localeCompare(b.time),
    );
  return (
    <>
      <PageHeading
        eyebrow="THE FIRST HELLO"
        title="Reception desk"
        description="Register patients, issue OPD slips and manage today’s arrivals."
      >
        <Link href="/appointments" className="button secondary">
          <CalendarDays size={16} />
          Appointments
        </Link>
        <button className="button primary" onClick={() => setRegister(true)}>
          <Plus size={16} />
          Register patient
        </button>
      </PageHeading>
      <div className="summary-strip">
        {[
          { status: "WAITING", label: "In the waiting room" },
          { status: "CONSULTING", label: "With their doctor" },
          { status: "COMPLETED", label: "Visits completed" },
          { status: "BOOKED", label: "Yet to check in" },
        ].map((item) => (
          <button
            key={item.status}
            onClick={() =>
              setStatus(status === item.status ? "ALL" : item.status)
            }
            className={status === item.status ? "summary-selected" : ""}
          >
            <span
              className={`summary-dot status-${item.status.toLowerCase()}`}
            />
            <strong>
              {today.filter((v) => v.status === item.status).length}
            </strong>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <section className="surface">
        <div className="table-toolbar">
          <div className="table-tabs">
            {[
              { value: "ALL", label: "All patients" },
              { value: "WAITING", label: "Waiting" },
              { value: "CALLED", label: "Called" },
              { value: "SKIPPED", label: "On hold" },
              { value: "CONSULTING", label: "In consultation" },
              { value: "COMPLETED", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.value}
                className={status === tab.value ? "tab-active" : ""}
                onClick={() => setStatus(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="live-indicator">
            <i />
            Live hospital queue
          </span>
        </div>
        <div className="filter-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search queue"
              placeholder="Search name, mobile or token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter by doctor"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
          >
            <option value="ALL">All doctors</option>
            {DOCTORS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <Link className="button secondary small" href="/queue">
            Queue display <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Token / time</th>
                <th>Patient</th>
                <th>Doctor / reason</th>
                <th>Status</th>
                <th>Consultation fee</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((visit, i) => {
                const patient = patients.find((p) => p.id === visit.patientId)!;
                const doc = DOCTORS.find((d) => d.id === visit.doctorId)!;
                return (
                  <tr key={visit.id}>
                    <td>
                      <strong className="token-label">
                        {visit.token || "Scheduled"}
                      </strong>
                      <span className="cell-sub">
                        {prettyTime(visit.time)} · {visit.source}
                      </span>
                    </td>
                    <td>
                      <div className="table-person">
                        <Avatar name={patient.name} index={i} small />
                        <div>
                          <strong>
                            {patient.name}
                            {visit.priority === "Urgent" && (
                              <span className="urgent-label">Urgent</span>
                            )}
                          </strong>
                          <span>
                            {patient.age} yrs · {patient.gender} ·{" "}
                            {patient.phone}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="cell-title">{doc.name}</strong>
                      <span className="cell-sub truncate-cell">
                        {visit.reason}
                      </span>
                    </td>
                    <td>
                      <Status status={visit.status} />
                    </td>
                    <td>
                      <strong className="cell-title">{money(visit.fee)}</strong>
                      <span
                        className={`cell-sub ${visit.paid ? "text-green" : "text-amber"}`}
                      >
                        {visit.paid
                          ? `Paid · ${visit.paymentMethod}`
                          : "Payment pending"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {["WAITING", "CALLED", "SKIPPED"].includes(
                          visit.status,
                        ) && (
                          <button
                            className="icon-button"
                            aria-label={`Record vitals for ${patient.name}`}
                            onClick={() => setIntake(visit)}
                          >
                            <Activity size={17} />
                          </button>
                        )}
                        {visit.status === "BOOKED" && (
                          <button
                            className="button primary small"
                            onClick={() =>
                              void act(
                                { action: "checkin", visitId: visit.id },
                                "Patient checked in. Queue token assigned.",
                              ).catch(() => {})
                            }
                          >
                            <Check size={13} />
                            Check in
                          </button>
                        )}
                        <button
                          className="icon-button"
                          aria-label={`Print slip for ${patient.name}`}
                          onClick={() => setPrint(visit)}
                        >
                          <Printer size={16} />
                        </button>
                        {["WAITING", "BOOKED"].includes(visit.status) && (
                          <button
                            className="icon-button danger"
                            aria-label={`Cancel visit for ${patient.name}`}
                            onClick={() => setCancel(visit)}
                          >
                            <X size={16} />
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
              title="No patients in this view"
              description="Try another filter or register a new patient."
            />
          )}
        </div>
        <div className="table-footer">
          <span>
            {filtered.length} of {today.length} visits today
          </span>
          <span>OPD · Harmony Hospital</span>
        </div>
      </section>
      {register && (
        <RegisterPatient
          close={() => setRegister(false)}
          onCreated={(v) => {
            setRegister(false);
            setPrint(v);
          }}
        />
      )}
      {intake && <IntakeVitals visit={intake} close={() => setIntake(null)} />}
      {print && (
        <PrintDocument
          visit={print}
          patient={patients.find((p) => p.id === print.patientId)!}
          close={() => setPrint(null)}
        />
      )}
      {cancel && (
        <Modal
          title="Cancel this visit?"
          description="The patient will be removed from the active queue. Their record is kept."
          close={() => setCancel(null)}
        >
          <div className="modal-body">
            <p>
              {patients.find((p) => p.id === cancel.patientId)?.name} ·{" "}
              {cancel.token || cancel.id}
            </p>
            {cancel.paid && (
              <p className="text-amber">
                The consultation payment remains recorded. Arrange any refund at
                the billing desk.
              </p>
            )}
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setCancel(null)}
            >
              Keep visit
            </button>
            <button
              className="button danger-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await act(
                    { action: "cancel", visitId: cancel.id },
                    "Visit cancelled.",
                  );
                  setCancel(null);
                } catch {
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Cancelling…" : "Cancel visit"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
