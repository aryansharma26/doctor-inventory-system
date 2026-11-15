"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock3,
  FileText,
  HeartPulse,
  Pill,
  Plus,
  Printer,
  Save,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useHospital } from "./provider";
import {
  clinicDate,
  DOCTORS,
  prettyDate,
  prettyTime,
  type Patient,
  type Prescription,
  type Visit,
} from "./types";
import { Avatar, Empty, Field, PageHeading, Status } from "./ui";
import { PrintDocument } from "./print-document";
import { QuickMessage } from "./messages";

function ConsultationEditor({
  visit,
  keepSelection,
}: {
  visit: Visit;
  keepSelection: () => void;
}) {
  const { medicines, visits, patients, act } = useHospital();
  const patient = patients.find((p) => p.id === visit.patientId)!;
  const [diagnosis, setDiagnosis] = useState(visit.diagnosis);
  const [notes, setNotes] = useState(visit.notes);
  const [followUp, setFollowUp] = useState(visit.followUp);
  const [rx, setRx] = useState<Prescription[]>(visit.prescription);
  const [busy, setBusy] = useState(false);
  const [print, setPrint] = useState(false);
  const [tab, setTab] = useState("consult");
  const [medicineId, setMedicineId] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [instructions, setInstructions] = useState("");
  const editable = visit.status === "CONSULTING";
  const history = visits
    .filter((v) => v.patientId === patient.id && v.id !== visit.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  async function save(complete: boolean) {
    if (busy) return;
    keepSelection();
    setBusy(true);
    try {
      await act(
        {
          action: "consult",
          visitId: visit.id,
          diagnosis,
          notes,
          followUp,
          prescription: rx,
          complete,
        },
        complete
          ? "Consultation completed. Prescription sent to pharmacy."
          : "Consultation draft saved.",
      );
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="surface consultation-panel">
      <div className="patient-record-header">
        <Avatar name={patient.name} index={1} />
        <div>
          <h2>{patient.name}</h2>
          <p>
            {patient.id} · {patient.age} years · {patient.gender} ·{" "}
            {patient.phone}
          </p>
        </div>
        <Status status={visit.status} />
      </div>
      <div className="patient-record-meta">
        <span>
          <Stethoscope size={14} />
          {DOCTORS.find((d) => d.id === visit.doctorId)?.name}
        </span>
        <span>
          <Clock3 size={14} />
          {visit.token || visit.id} · {prettyTime(visit.time)}
        </span>
      </div>
      {patient.allergies ? (
        <div className="allergy-alert">
          <AlertCircle size={16} />
          <strong>Known allergies:</strong> {patient.allergies}
        </div>
      ) : (
        <div className="allergy-none">
          <Check size={14} />
          No allergy information recorded
        </div>
      )}
      <div className="record-tabs">
        <button
          className={tab === "consult" ? "tab-active" : ""}
          onClick={() => setTab("consult")}
        >
          Consultation
        </button>
        <button
          className={tab === "history" ? "tab-active" : ""}
          onClick={() => setTab("history")}
        >
          Previous visits <span>{history.length}</span>
        </button>
      </div>
      {tab === "history" ? (
        <div className="consultation-body">
          {history.length ? (
            history.map((v) => (
              <article className="history-item" key={v.id}>
                <div>
                  <strong>{prettyDate(v.date)}</strong>
                  <Status status={v.status} />
                </div>
                <p>{v.reason}</p>
                {v.diagnosis && (
                  <p>
                    <strong>Diagnosis:</strong> {v.diagnosis}
                  </p>
                )}
                {v.prescription.map((m) => (
                  <span className="history-rx" key={m.medicineId}>
                    {m.name} · {m.dosage} · {m.frequency} · {m.duration}
                  </span>
                ))}
                {v.notes && <p>{v.notes}</p>}
              </article>
            ))
          ) : (
            <Empty
              title="Their first visit here"
              description="Future encounters and prescriptions will be available in this record."
            />
          )}
        </div>
      ) : (
        <div className="consultation-body">
          <div className="record-section-label">
            <HeartPulse size={16} />
            VITALS FROM RECEPTION
          </div>
          <div className="patient-vitals">
            {(
              [
                { key: "bp", label: "Blood pressure", unit: "mmHg" },
                { key: "pulse", label: "Pulse", unit: "bpm" },
                { key: "temperature", label: "Temperature", unit: "°C" },
                { key: "weight", label: "Weight", unit: "kg" },
                { key: "spo2", label: "SpO₂", unit: "%" },
              ] as const
            ).map((v) => (
              <div key={v.key}>
                <span>{v.label}</span>
                <strong>
                  {visit.vitals[v.key] || "—"}
                  <small>{visit.vitals[v.key] ? v.unit : "Not recorded"}</small>
                </strong>
              </div>
            ))}
          </div>
          <div className="complaint-box">
            <span>REASON FOR VISIT</span>
            <p>{visit.reason}</p>
          </div>
          {["WAITING", "CALLED"].includes(visit.status) ? (
            <div className="start-consultation">
              <Stethoscope size={28} strokeWidth={1.4} />
              <h3>Ready when you are.</h3>
              <p>
                Start the consultation to record your findings and prescription.
              </p>
              <button
                className="button primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await act(
                      { action: "start", visitId: visit.id },
                      "Consultation started.",
                    );
                  } catch {
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Start consultation <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              <Field label="Clinical diagnosis *">
                <textarea
                  rows={2}
                  placeholder="Record your diagnosis..."
                  value={diagnosis}
                  maxLength={2000}
                  disabled={!editable}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </Field>
              <div className="record-section-label rx-section-title">
                <Pill size={16} />
                PRESCRIPTION <span>{rx.length} medicines</span>
              </div>
              <div className="prescription-lines">
                {rx.map((item, i) => (
                  <div className="prescription-line" key={item.medicineId}>
                    <span className="rx-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{item.name}</strong>
                      <p>
                        {item.dosage} · {item.frequency} · {item.duration} · Qty{" "}
                        {item.quantity}
                      </p>
                      {item.instructions && <small>{item.instructions}</small>}
                    </div>
                    {editable && (
                      <button
                        className="icon-button danger"
                        aria-label={`Remove ${item.name}`}
                        onClick={() =>
                          setRx(
                            rx.filter((r) => r.medicineId !== item.medicineId),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
                {!rx.length && (
                  <p className="empty-prescription">
                    No medicines added. A consultation can be completed without
                    a prescription.
                  </p>
                )}
              </div>
              {editable && (
                <form
                  className="prescription-adder"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const med = medicines.find((m) => m.id === medicineId);
                    if (!med) return;
                    setRx([
                      ...rx,
                      {
                        medicineId: med.id,
                        name: `${med.name} ${med.strength}`,
                        dosage,
                        frequency,
                        duration,
                        instructions,
                        quantity: Number(quantity),
                      },
                    ]);
                    setMedicineId("");
                    setDosage("");
                    setFrequency("");
                    setDuration("");
                    setInstructions("");
                  }}
                >
                  <Field label="Select from hospital formulary" wide>
                    <select
                      required
                      value={medicineId}
                      onChange={(e) => setMedicineId(e.target.value)}
                    >
                      <option value="">Choose a medicine...</option>
                      {medicines
                        .filter(
                          (m) =>
                            !rx.some((r) => r.medicineId === m.id) &&
                            m.expiry > clinicDate(),
                        )
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.strength} · {m.stock} in stock
                          </option>
                        ))}
                    </select>
                  </Field>
                  <div className="form-grid rx-fields">
                    <Field label="Dosage *">
                      <input
                        required
                        placeholder="e.g. 1 tablet"
                        maxLength={100}
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                      />
                    </Field>
                    <Field label="Frequency *">
                      <input
                        required
                        placeholder="As directed by doctor"
                        maxLength={100}
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                      />
                    </Field>
                    <Field label="Duration *">
                      <input
                        required
                        placeholder="e.g. 3 days"
                        maxLength={100}
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </Field>
                    <Field label="Quantity (units) *">
                      <input
                        required
                        type="number"
                        min={1}
                        max={1000}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </Field>
                    <Field label="Medicine instructions" wide>
                      <input
                        placeholder="Timing, route or any specific instructions"
                        maxLength={300}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                      />
                    </Field>
                  </div>
                  <button type="submit" className="button secondary small">
                    <Plus size={14} />
                    Add to prescription
                  </button>
                </form>
              )}
              <Field label="Advice & consultation notes">
                <textarea
                  rows={3}
                  maxLength={5000}
                  placeholder="Record the advice discussed with the patient..."
                  value={notes}
                  disabled={!editable}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
              <Field
                label="Recommended follow-up date"
                hint="Recorded in the patient history and follow-up list; a new appointment must be booked separately."
              >
                <input
                  type="date"
                  min={clinicDate()}
                  value={followUp}
                  disabled={!editable}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
              </Field>
            </>
          )}
        </div>
      )}
      {tab === "consult" && !["WAITING", "CALLED"].includes(visit.status) && (
        <div className="consultation-footer">
          {editable ? (
            <>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void save(false)}
              >
                <Save size={15} />
                Save draft
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={() => void save(true)}
              >
                <Check size={16} />
                {busy ? "Saving…" : "Complete & send to pharmacy"}
              </button>
            </>
          ) : (
            <>
              <span className="text-green">
                <Check size={15} />
                Consultation completed
              </span>
              <button
                className="button secondary"
                onClick={() => setPrint(true)}
              >
                <Printer size={15} />
                Print prescription
              </button>
            </>
          )}
        </div>
      )}
      {print && (
        <PrintDocument
          visit={visit}
          patient={patient}
          kind="prescription"
          close={() => setPrint(false)}
        />
      )}
    </section>
  );
}

export function DoctorDesk() {
  const { visits, patients, staff, role } = useHospital();
  const [doctor, setDoctor] = useState(staff?.doctorId || DOCTORS[0].id);
  const [selected, setSelected] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const queue = visits
    .filter(
      (v) =>
        v.date === clinicDate() &&
        v.doctorId === doctor &&
        (showCompleted
          ? v.status === "COMPLETED"
          : ["CONSULTING", "CALLED", "WAITING"].includes(v.status)),
    )
    .sort(
      (a, b) =>
        Number(b.status === "CONSULTING") - Number(a.status === "CONSULTING") ||
        Number(b.status === "CALLED") - Number(a.status === "CALLED") ||
        Number(b.priority === "Urgent") - Number(a.priority === "Urgent") ||
        a.createdAt.localeCompare(b.createdAt),
    );
  const active =
    visits.find((v) => v.id === selected && v.doctorId === doctor) || queue[0];
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE MORE FOCUS"
        title="Doctor’s desk"
        description="Your patient queue, clinical records and prescriptions."
      >
        <label className="doctor-picker">
          <Stethoscope size={16} />
          <select
            value={doctor}
            disabled={role === "DOCTOR"}
            onChange={(e) => {
              setDoctor(e.target.value);
              setSelected("");
            }}
          >
            {DOCTORS.filter(
              (d) => !staff?.doctorId || d.id === staff.doctorId,
            ).map((d) => (
              <option value={d.id} key={d.id}>
                {d.name} · Room {d.room}
              </option>
            ))}
          </select>
        </label>
        <QuickMessage visitId={active?.id} />
      </PageHeading>
      <div className="doctor-layout">
        <aside className="surface patient-queue">
          <div className="queue-heading">
            <h2>Your patients</h2>
            <span>{queue.length}</span>
          </div>
          <div className="queue-view-tabs">
            <button
              className={!showCompleted ? "selected" : ""}
              onClick={() => {
                setShowCompleted(false);
                setSelected("");
              }}
            >
              Active queue
            </button>
            <button
              className={showCompleted ? "selected" : ""}
              onClick={() => {
                setShowCompleted(true);
                setSelected("");
              }}
            >
              Completed
            </button>
          </div>
          {queue.map((v, i) => {
            const p = patients.find((p) => p.id === v.patientId)!;
            return (
              <button
                className={`queue-patient ${active?.id === v.id ? "queue-patient-selected" : ""}`}
                key={v.id}
                onClick={() => setSelected(v.id)}
              >
                <div className="queue-patient-top">
                  <Avatar name={p.name} index={i} small />
                  <div>
                    <strong>{p.name}</strong>
                    <span>
                      {p.age} years · {p.gender}
                    </span>
                  </div>
                </div>
                <p>{v.reason}</p>
                <div>
                  <span>
                    {v.token}
                    {v.priority === "Urgent" && " · Urgent"}
                  </span>
                  <Status status={v.status} />
                </div>
              </button>
            );
          })}
          {!queue.length && (
            <Empty
              title="All caught up"
              description={
                showCompleted
                  ? "Completed visits will appear here."
                  : "Your checked-in patients will appear here."
              }
            />
          )}
        </aside>
        {active ? (
          <ConsultationEditor
            key={active.id}
            visit={active}
            keepSelection={() => setSelected(active.id)}
          />
        ) : (
          <section className="surface">
            <Empty
              title="A little breathing room."
              description="Select a patient from your queue when their consultation is ready."
            >
              <FileText size={42} strokeWidth={1} />
            </Empty>
          </section>
        )}
      </div>
    </>
  );
}
