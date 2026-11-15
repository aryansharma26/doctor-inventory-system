"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, FileText, Printer, Search } from "lucide-react";
import { useHospital } from "./provider";
import { DOCTORS, money, prettyDate, type Patient, type Visit } from "./types";
import { Avatar, Empty, Modal, PageHeading, Status } from "./ui";
import { PrintDocument } from "./print-document";

export function PatientDirectory() {
  const { patients, visits, role } = useHospital();
  const params = useSearchParams();
  const [query, setQuery] = useState<string | null>(null);
  const search = query ?? params.get("q") ?? "";
  const [selected, setSelected] = useState<Patient | null>(null);
  const [print, setPrint] = useState<Visit | null>(null);
  const clinical = role === "ADMIN" || role === "DOCTOR";
  const filtered = patients.filter((p) =>
    `${p.name} ${p.phone} ${p.id}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="FAMILIAR FACES. CONNECTED RECORDS."
        title="Every patient has a story."
        description="Keep their details close and their care connected, from visit to visit."
      >
        {["ADMIN", "RECEPTION"].includes(role || "") && (
          <Link href="/reception" className="button primary">
            Register a patient <ArrowUpRight size={15} />
          </Link>
        )}
      </PageHeading>
      <section className="surface">
        <div className="section-title">
          <div>
            <h2>
              Patient directory{" "}
              <span className="directory-count">{patients.length}</span>
            </h2>
            <p>A single record for every returning patient.</p>
          </div>
          <FileText size={20} strokeWidth={1.4} />
        </div>
        <div className="filter-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search patient directory"
              placeholder="Search name, mobile or patient ID..."
              value={search}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Patient ID</th>
                <th>Contact</th>
                <th>Visits</th>
                <th>Last visit</th>
                <th className="align-right">Record</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const history = visits
                  .filter((v) => v.patientId === p.id)
                  .sort((a, b) => b.date.localeCompare(a.date));
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="table-person">
                        <Avatar name={p.name} index={i} small />
                        <div>
                          <strong>{p.name}</strong>
                          <span>
                            {p.age} years · {p.gender}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cell-sub">{p.id}</span>
                    </td>
                    <td>
                      <a href={`tel:+91${p.phone}`} className="cell-title">
                        +91 {p.phone}
                      </a>
                    </td>
                    <td>
                      <strong className="cell-title">{history.length}</strong>
                    </td>
                    <td>
                      <span className="cell-sub">
                        {history[0] ? prettyDate(history[0].date) : "—"}
                      </span>
                    </td>
                    <td className="align-right">
                      <button
                        className="button secondary small"
                        onClick={() => setSelected(p)}
                      >
                        View record <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && (
            <Empty
              title="No patient found"
              description="Try their name, mobile number or patient ID."
            />
          )}
        </div>
      </section>
      {selected && (
        <Modal
          title={selected.name}
          description={`${selected.id} · ${selected.age} years · ${selected.gender} · +91 ${selected.phone}`}
          close={() => setSelected(null)}
          wide
        >
          <div className="modal-body">
            {selected.allergies && (
              <div className="allergy-alert">
                Recorded allergies: {selected.allergies}
              </div>
            )}
            <span className="eyebrow">VISIT HISTORY</span>
            <div className="directory-history">
              {visits
                .filter((v) => v.patientId === selected.id)
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((v) => (
                  <article className="history-item" key={v.id}>
                    <div>
                      <strong>
                        {prettyDate(v.date)} ·{" "}
                        {DOCTORS.find((d) => d.id === v.doctorId)?.name}
                      </strong>
                      <Status status={v.status} />
                    </div>
                    <p>{v.reason}</p>
                    {clinical && (
                      <>
                        {v.diagnosis && (
                          <p>
                            <strong>Diagnosis:</strong> {v.diagnosis}
                          </p>
                        )}
                        {v.prescription.map((rx) => (
                          <span className="history-rx" key={rx.medicineId}>
                            {rx.name} · {rx.dosage} · {rx.frequency} ·{" "}
                            {rx.duration}
                          </span>
                        ))}
                        {v.notes && <p className="preserve-lines">{v.notes}</p>}
                      </>
                    )}
                    {v.followUp && (
                      <p>Recommended follow-up: {prettyDate(v.followUp)}</p>
                    )}
                    <p>
                      {money(v.fee)} · {v.paid ? "Paid" : "Payment pending"}
                    </p>
                    <button
                      className="button secondary small"
                      onClick={() => {
                        setSelected(null);
                        setPrint(v);
                      }}
                    >
                      <Printer size={13} />
                      {clinical && v.status === "COMPLETED"
                        ? "Prescription"
                        : "Visit slip"}
                    </button>
                  </article>
                ))}
            </div>
          </div>
        </Modal>
      )}
      {print && (
        <PrintDocument
          visit={print}
          patient={patients.find((p) => p.id === print.patientId)!}
          kind={
            clinical && print.status === "COMPLETED" ? "prescription" : "slip"
          }
          close={() => setPrint(null)}
        />
      )}
    </>
  );
}
