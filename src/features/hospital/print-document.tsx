"use client";
import { Printer } from "lucide-react";
import { createPortal } from "react-dom";
import {
  DOCTORS,
  money,
  prettyDate,
  prettyTime,
  type Patient,
  type Visit,
} from "./types";
import { Modal } from "./ui";

export function PrintDocument({
  visit,
  patient,
  kind = "slip",
  close,
}: {
  visit: Visit;
  patient: Patient;
  kind?: "slip" | "prescription" | "receipt" | "pharmacy";
  close: () => void;
}) {
  const doctor = DOCTORS.find((d) => d.id === visit.doctorId)!;
  return createPortal(
    <Modal
      title={
        kind === "prescription"
          ? "Prescription"
          : kind === "receipt"
            ? "Consultation receipt"
            : kind === "pharmacy"
              ? "Pharmacy receipt"
              : "Patient registration slip"
      }
      close={close}
      wide
    >
      <div className="print-document">
        <div className="print-letterhead">
          <div>
            <h2>Harmony Hospital</h2>
            <p>Hisar, Haryana · Outpatient care</p>
          </div>
          <strong>
            H<span>+</span>
          </strong>
        </div>
        <div className="print-info">
          <div>
            <h3>{patient.name}</h3>
            <p>
              {patient.id} · {patient.age} years · {patient.gender}
            </p>
            <p>Mobile: {patient.phone}</p>
          </div>
          <div>
            <strong>{visit.token || visit.id}</strong>
            <p>
              {prettyDate(visit.date)} · {prettyTime(visit.time)}
            </p>
            <p>
              {doctor.name} · Room {doctor.room}
            </p>
          </div>
        </div>
        {patient.allergies && (
          <div className="allergy-alert">
            Recorded allergies: {patient.allergies}
          </div>
        )}
        {kind === "prescription" ? (
          <>
            <div className="print-diagnosis">
              <h4>Diagnosis</h4>
              <p>{visit.diagnosis || "—"}</p>
            </div>
            <h2 className="rx-symbol">℞</h2>
            <table className="data-table print-rx">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage / frequency</th>
                  <th>Duration / quantity</th>
                </tr>
              </thead>
              <tbody>
                {visit.prescription.map((rx) => (
                  <tr key={rx.medicineId}>
                    <td>
                      <strong>{rx.name}</strong>
                      <p>{rx.instructions}</p>
                    </td>
                    <td>
                      {rx.dosage}
                      <p>{rx.frequency}</p>
                    </td>
                    <td>
                      {rx.duration}
                      <p>{rx.quantity} units</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visit.notes && (
              <div className="print-diagnosis">
                <h4>Doctor's advice</h4>
                <p className="preserve-lines">{visit.notes}</p>
              </div>
            )}
            {visit.followUp && (
              <div className="print-diagnosis">
                <h4>Follow-up</h4>
                <p>{prettyDate(visit.followUp)}</p>
              </div>
            )}
            <div className="print-signature">
              {doctor.name}
              <br />
              Treating doctor
            </div>
          </>
        ) : kind === "pharmacy" ? (
          <>
            <h4>Dispensed medicines</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {visit.prescription.map((rx) => (
                  <tr key={rx.medicineId}>
                    <td>{rx.name}</td>
                    <td>{rx.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="receipt-total">
              <span>
                Pharmacy payment · {visit.pharmacyPaymentMethod || "Cash"}
              </span>
              <strong>{money(visit.pharmacyTotal)}</strong>
            </div>
            <p>
              Receipt: RX-{visit.id} ·{" "}
              {visit.dispensedAt
                ? new Date(visit.dispensedAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })
                : ""}
            </p>
          </>
        ) : (
          <>
            <div className="print-diagnosis">
              <h4>Reason for visit</h4>
              <p>{visit.reason}</p>
            </div>
            <div className="print-vitals">
              {Object.entries(visit.vitals)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <span key={key}>
                    {
                      {
                        bp: "BP",
                        pulse: "Pulse",
                        weight: "Weight (kg)",
                        temperature: "Temperature (°C)",
                        spo2: "SpO₂ (%)",
                      }[key]
                    }
                    : <strong>{value}</strong>
                  </span>
                ))}
            </div>
            <div className="receipt-total">
              <span>
                Consultation fee ·{" "}
                {visit.paid
                  ? `Paid by ${visit.paymentMethod}`
                  : "Payment pending"}
              </span>
              <strong>{money(visit.fee)}</strong>
            </div>
            {kind === "slip" && (
              <div className="token-print">
                <span>Your queue token</span>
                <strong>{visit.token || "To be assigned at reception"}</strong>
                <p>Please wait for your token to be called.</p>
              </div>
            )}
          </>
        )}
        <p className="print-footnote">
          {kind === "prescription"
            ? "Medicines and instructions are recorded by the treating doctor."
            : "Please keep this slip for your records."}{" "}
          · {visit.id}
        </p>
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={close}>
          Close
        </button>
        <button className="button primary" onClick={() => window.print()}>
          <Printer size={16} />
          Print / save PDF
        </button>
      </div>
    </Modal>,
    document.body,
  );
}
