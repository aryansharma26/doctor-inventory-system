"use client";
import { useState } from "react";
import { Check, Download, Printer, Search, Wallet } from "lucide-react";
import { useHospital } from "./provider";
import { clinicDate, money, paymentDate, type Visit } from "./types";
import { Avatar, downloadCsv, Empty, Modal, PageHeading } from "./ui";
import { PrintDocument } from "./print-document";

export function Billing() {
  const { visits, patients, act } = useHospital();
  const [date, setDate] = useState(clinicDate());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [collect, setCollect] = useState<Visit | null>(null);
  const [method, setMethod] = useState("Cash");
  const [busy, setBusy] = useState(false);
  const [print, setPrint] = useState<Visit | null>(null);
  const daily = visits.filter(
    (v) => v.date === date || (v.paid && paymentDate(v) === date),
  );
  const paid = visits.filter((v) => v.paid && paymentDate(v) === date);
  const pending = daily.filter((v) => !v.paid && v.status !== "CANCELLED");
  const filtered = daily.filter(
    (v) =>
      `${patients.find((p) => p.id === v.patientId)?.name} ${v.id}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "paid" ? v.paid : !v.paid && v.status !== "CANCELLED")),
  );
  const total = paid.reduce((sum, v) => sum + v.fee, 0);
  return (
    <>
      <PageHeading
        eyebrow="THE DETAILS, TAKEN CARE OF"
        title="Clear bills. Calmer days."
        description="Consultation payments, receipts and a clear picture of your collections."
      >
        <input
          aria-label="Billing date"
          className="date-input"
          type="date"
          value={date}
          onChange={(e) => {
            if (e.target.value) setDate(e.target.value);
          }}
        />
        <button
          className="button secondary"
          onClick={() =>
            downloadCsv(`consultation-collections-${date}.csv`, [
              [
                "Reference",
                "Patient",
                "Date",
                "Fee INR",
                "Payment",
                "Method",
                "Visit status",
              ],
              ...daily.map((v) => [
                v.id,
                patients.find((p) => p.id === v.patientId)!.name,
                v.date,
                v.fee,
                v.paid ? "Paid" : "Unpaid",
                v.paymentMethod,
                v.status,
              ]),
            ])
          }
        >
          <Download size={15} />
          Export collections
        </button>
      </PageHeading>
      <div className="summary-strip">
        <div>
          <Wallet size={19} />
          <strong>{money(total)}</strong>
          <span>Consultation collections</span>
        </div>
        <div>
          <strong>{money(pending.reduce((sum, v) => sum + v.fee, 0))}</strong>
          <span>Awaiting payment</span>
        </div>
        <div>
          <strong>{paid.length}</strong>
          <span>Paid consultations</span>
        </div>
        <div>
          <strong>
            {money(
              visits
                .filter(
                  (v) =>
                    v.dispensedAt &&
                    clinicDate(new Date(v.dispensedAt)) === date,
                )
                .reduce((sum, v) => sum + v.pharmacyTotal, 0),
            )}
          </strong>
          <span>Pharmacy collections</span>
        </div>
      </div>
      <section className="surface">
        <div className="table-toolbar">
          <div className="table-tabs">
            {[
              { id: "all", label: "All visits" },
              { id: "paid", label: "Paid" },
              { id: "pending", label: "Payment pending" },
            ].map((t) => (
              <button
                key={t.id}
                className={filter === t.id ? "tab-active" : ""}
                onClick={() => setFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search bills"
              placeholder="Search patient or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Bill reference</th>
                <th>Consultation fee</th>
                <th>Payment status</th>
                <th>Method</th>
                <th className="align-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const p = patients.find((p) => p.id === v.patientId)!;
                return (
                  <tr key={v.id}>
                    <td>
                      <div className="table-person">
                        <Avatar name={p.name} index={i} small />
                        <div>
                          <strong>{p.name}</strong>
                          <span>
                            {p.phone}
                            {v.status === "CANCELLED"
                              ? " · Cancelled visit"
                              : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cell-sub">{v.id}</span>
                    </td>
                    <td>
                      <strong className="cell-title">{money(v.fee)}</strong>
                    </td>
                    <td>
                      <span
                        className={`status ${v.paid ? "status-completed" : v.status === "CANCELLED" ? "status-cancelled" : "status-waiting"}`}
                      >
                        <i />
                        {v.paid
                          ? "Paid"
                          : v.status === "CANCELLED"
                            ? "Cancelled"
                            : "Pending"}
                      </span>
                    </td>
                    <td>
                      <span className="cell-sub">
                        {v.paid ? v.paymentMethod : "—"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {v.paid ? (
                          <button
                            className="button secondary small"
                            onClick={() => setPrint(v)}
                          >
                            <Printer size={13} />
                            Receipt
                          </button>
                        ) : v.status !== "CANCELLED" ? (
                          <button
                            className="button primary small"
                            onClick={() => setCollect(v)}
                          >
                            Collect payment
                          </button>
                        ) : (
                          "—"
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
              title="No bills for this view"
              description="Try another date or register a new patient at reception."
            />
          )}
        </div>
      </section>
      {collect && (
        <Modal
          title="Record consultation payment"
          description="Confirm the amount and payment method after receiving payment."
          close={() => setCollect(null)}
        >
          <div className="modal-body">
            <h3>{patients.find((p) => p.id === collect.patientId)?.name}</h3>
            <div className="fee-box">
              <div>
                <span>Consultation fee</span>
                <strong>{money(collect.fee)}</strong>
              </div>
              <select
                aria-label="Collection payment method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {["Cash", "UPI", "Card"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setCollect(null)}
            >
              Go back
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const visit = await act(
                    {
                      action: "pay",
                      visitId: collect.id,
                      paymentMethod: method,
                    },
                    "Payment recorded.",
                  );
                  setCollect(null);
                  setPrint(visit as Visit);
                } catch {
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Check size={15} />
              {busy ? "Saving…" : "Payment received"}
            </button>
          </div>
        </Modal>
      )}
      {print && (
        <PrintDocument
          visit={print}
          patient={patients.find((p) => p.id === print.patientId)!}
          kind="receipt"
          close={() => setPrint(null)}
        />
      )}
    </>
  );
}
