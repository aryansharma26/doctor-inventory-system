"use client";
import { useState } from "react";
import { useHospital } from "./provider";
import type { Visit } from "./types";
import { Field, Modal } from "./ui";
export function IntakeVitals({
  visit,
  close,
}: {
  visit: Visit;
  close: () => void;
}) {
  const { patients, act } = useHospital();
  const patient = patients.find((p) => p.id === visit.patientId)!;
  const [vitals, setVitals] = useState(visit.vitals);
  const [allergies, setAllergies] = useState(patient.allergies);
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={`Record vitals · ${visit.token}`}
      description={`${patient.name} · Only enter values that were measured. Updates appear on the doctor’s desk.`}
      close={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await act(
              { action: "updateIntake", visitId: visit.id, vitals, allergies },
              "Vitals saved and shared with the doctor.",
            );
            close();
          } catch {
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body form-grid">
          <Field label="Blood pressure (mmHg)">
            <input
              pattern="[0-9]{2,3}/[0-9]{2,3}"
              placeholder="120/80"
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
              />
            </Field>
          ))}
          <Field label="Recorded allergies" wide>
            <input
              maxLength={500}
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Known allergies, if provided"
            />
          </Field>
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={close}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save vitals"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
