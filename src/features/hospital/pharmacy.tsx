"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Download,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useHospital } from "./provider";
import {
  clinicDate,
  DOCTORS,
  money,
  type PharmacyInvoice,
  type Visit,
} from "./types";
import { invoiceLine, invoiceTotals } from "./invoice-math";
import { Avatar, downloadCsv, Empty, Field, Modal, PageHeading } from "./ui";
import { InvoicePrint } from "./invoice-print";
type CartLine = {
  medicineId: string;
  quantity: number;
  discountPercent: number;
};
export function Pharmacy() {
  const { visits, patients, medicines, invoices, act } = useHospital();
  const [tab, setTab] = useState("counter");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [visitId, setVisitId] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("Cash");
  const [cash, setCash] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [print, setPrint] = useState<PharmacyInvoice | null>(null);
  const [cancel, setCancel] = useState<PharmacyInvoice | null>(null);
  const [reason, setReason] = useState("");
  const [discard, setDiscard] = useState(false);
  const requestId = useRef("");
  const visit = visits.find((v) => v.id === visitId);
  const patient = patients.find((p) => p.id === visit?.patientId);
  const pending = visits.filter(
    (v) => v.status === "COMPLETED" && v.prescription.length && !v.dispensedAt,
  );
  const lines = cart.flatMap((l) => {
    const m = medicines.find((m) => m.id === l.medicineId);
    return m ? [invoiceLine(m, l.quantity, l.discountPercent)] : [];
  });
  const totals = invoiceTotals(lines);
  const usable = cart.every((l) => {
    const m = medicines.find((m) => m.id === l.medicineId);
    return m && m.expiry > clinicDate() && m.stock >= l.quantity;
  });
  const results = search.trim()
    ? medicines
        .filter((m) =>
          `${m.name} ${m.generic} ${m.barcode || ""} ${m.batch}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .slice(0, 10)
    : [];
  function edit(next: CartLine[]) {
    setCart(next);
    requestId.current = "";
  }
  function loadPrescription(v: Visit) {
    if (cart.length && visitId !== v.id) {
      toast.info("Clear the current bill before loading another prescription.");
      return;
    }
    const p = patients.find((p) => p.id === v.patientId)!;
    setVisitId(v.id);
    setCustomer(p.name);
    setPhone(p.phone);
    edit(
      v.prescription.map((r) => ({
        medicineId: r.medicineId,
        quantity: r.quantity,
        discountPercent: 0,
      })),
    );
    setTab("counter");
  }
  function addMedicine(id: string) {
    const med = medicines.find((m) => m.id === id)!;
    if (med.expiry <= clinicDate() || !med.stock) {
      toast.error("This batch has no usable stock.");
      return;
    }
    if (
      med.prescriptionRequired !== false &&
      !visit?.prescription.some((r) => r.medicineId === id)
    ) {
      toast.error(
        "Load the patient's completed prescription for this medicine.",
      );
      return;
    }
    const existing = cart.find((l) => l.medicineId === id);
    if (visit?.prescription.some((r) => r.medicineId === id) && existing) {
      toast.info("The doctor's prescribed quantity is already in this bill.");
      return;
    }
    edit(
      existing
        ? cart.map((l) =>
            l.medicineId === id ? { ...l, quantity: l.quantity + 1 } : l,
          )
        : [...cart, { medicineId: id, quantity: 1, discountPercent: 0 }],
    );
    setSearch("");
  }
  function clear() {
    edit([]);
    setVisitId("");
    setCustomer("");
    setPhone("");
    setCash("");
    setPaymentReference("");
    setDiscard(false);
  }
  const dailySales = invoices.filter(
    (i) => !i.cancelledAt && clinicDate(new Date(i.createdAt)) === clinicDate(),
  );
  return (
    <>
      <PageHeading
        eyebrow="PHARMACY"
        title="Pharmacy counter"
        description="Prepare prescriptions, make medicine bills and collect payments."
      >
        <Link className="button secondary" href="/inventory">
          <Package size={17} />
          Medicine stock
        </Link>
      </PageHeading>
      <div className="summary-strip">
        <div>
          <strong>{pending.length}</strong>
          <span>Prescriptions waiting</span>
        </div>
        <div>
          <strong>{dailySales.length}</strong>
          <span>Bills today</span>
        </div>
        <div>
          <strong>{money(dailySales.reduce((n, i) => n + i.total, 0))}</strong>
          <span>Collected today</span>
        </div>
      </div>
      <div className="pharmacy-page-tabs">
        <button
          className={tab === "counter" ? "selected" : ""}
          onClick={() => setTab("counter")}
        >
          <ShoppingCart size={17} />
          Billing counter
        </button>
        <button
          className={tab === "bills" ? "selected" : ""}
          onClick={() => setTab("bills")}
        >
          <Printer size={17} />
          Bills & returns
        </button>
      </div>
      {tab === "counter" ? (
        <div className="counter-layout">
          <aside className="surface prescription-inbox">
            <div className="section-title">
              <div>
                <h2>Doctor prescriptions</h2>
                <p>Completed consultations ready for pharmacy</p>
              </div>
              <span className="nav-count">{pending.length}</span>
            </div>
            {pending.map((v, i) => {
              const p = patients.find((p) => p.id === v.patientId)!;
              return (
                <article
                  className={`pharmacy-rx-card ${visitId === v.id ? "selected-prescription" : ""}`}
                  key={v.id}
                >
                  <div className="table-person">
                    <Avatar name={p.name} small index={i} />
                    <div>
                      <strong>{p.name}</strong>
                      <span>
                        {v.token} · {p.age} years
                      </span>
                    </div>
                  </div>
                  <p>{DOCTORS.find((d) => d.id === v.doctorId)?.name}</p>
                  <p>
                    {v.prescription.length} medicine(s)
                    {p.allergies ? ` · Allergy: ${p.allergies}` : ""}
                  </p>
                  <button
                    className="button secondary small"
                    onClick={() => loadPrescription(v)}
                  >
                    {visitId === v.id ? "Loaded in bill" : "Review & dispense"}
                  </button>
                </article>
              );
            })}
            {!pending.length && (
              <Empty
                title="No prescriptions waiting"
                description="Completed doctor prescriptions arrive here automatically."
              />
            )}
          </aside>
          <section className="surface billing-counter">
            <div className="counter-header">
              <h2>
                {visit ? `Prescription · ${visit.token}` : "New pharmacy bill"}
              </h2>
              <button
                className="button secondary small"
                disabled={!cart.length && !customer}
                onClick={() => setDiscard(true)}
              >
                Clear bill
              </button>
            </div>
            <div className="counter-customer form-grid">
              <Field label="Customer / patient name *">
                <input
                  required
                  value={customer}
                  disabled={!!visit}
                  maxLength={100}
                  onChange={(e) => {
                    setCustomer(e.target.value);
                    requestId.current = "";
                  }}
                  placeholder="Customer name"
                />
              </Field>
              <Field label="Mobile number">
                <input
                  type="tel"
                  value={phone}
                  disabled={!!visit}
                  maxLength={10}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    requestId.current = "";
                  }}
                  placeholder="10-digit mobile (optional)"
                />
              </Field>
            </div>
            {patient?.allergies && (
              <div className="allergy-alert">
                <AlertCircle size={16} />
                Recorded allergies: {patient.allergies}
              </div>
            )}
            <div className="medicine-search">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const exact =
                    results.find((m) => m.barcode === search) ||
                    (results.length === 1 && results[0]);
                  if (exact) addMedicine(exact.id);
                }}
              >
                <Search size={18} />
                <input
                  aria-label="Search or scan medicine"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medicine, batch or scan a barcode…"
                />
              </form>
              {!!results.length && (
                <div className="medicine-results">
                  {results.map((m) => (
                    <button key={m.id} onClick={() => addMedicine(m.id)}>
                      <div>
                        <strong>
                          {m.name} {m.strength}
                        </strong>
                        <span>
                          Batch {m.batch} · {m.stock} in stock ·{" "}
                          {m.prescriptionRequired === false
                            ? "OTC"
                            : "Prescription required"}
                        </span>
                      </div>
                      <strong>{money(m.price)}</strong>
                      <Plus size={16} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="table-scroll">
              <table className="data-table counter-cart">
                <thead>
                  <tr>
                    <th>Medicine / batch</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Discount %</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cart.map((l) => {
                    const m = medicines.find((m) => m.id === l.medicineId)!;
                    const locked = !!visit?.prescription.some(
                      (r) => r.medicineId === l.medicineId,
                    );
                    return (
                      <tr key={l.medicineId}>
                        <td>
                          <strong>
                            {m.name} {m.strength}
                          </strong>
                          <span className="cell-sub">
                            {m.batch} · Exp {m.expiry}
                          </span>
                          <span
                            className={`cell-sub ${m.stock < l.quantity ? "text-amber" : ""}`}
                          >
                            {m.stock} available
                            {locked ? " · prescribed quantity" : ""}
                          </span>
                        </td>
                        <td>
                          <input
                            aria-label={`Quantity ${m.name}`}
                            type="number"
                            min={1}
                            max={m.stock}
                            disabled={locked}
                            value={l.quantity}
                            onChange={(e) =>
                              edit(
                                cart.map((x) =>
                                  x.medicineId === l.medicineId
                                    ? {
                                        ...x,
                                        quantity: Math.max(
                                          1,
                                          Number(e.target.value) || 1,
                                        ),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>{money(m.price)}</td>
                        <td>
                          <input
                            aria-label={`Discount ${m.name}`}
                            type="number"
                            min={0}
                            max={100}
                            value={l.discountPercent}
                            onChange={(e) =>
                              edit(
                                cart.map((x) =>
                                  x.medicineId === l.medicineId
                                    ? {
                                        ...x,
                                        discountPercent: Math.min(
                                          100,
                                          Math.max(
                                            0,
                                            Number(e.target.value) || 0,
                                          ),
                                        ),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>
                          {money(
                            invoiceLine(m, l.quantity, l.discountPercent).total,
                          )}
                        </td>
                        <td>
                          <button
                            className="icon-button danger"
                            disabled={locked}
                            aria-label={`Remove ${m.name}`}
                            onClick={() =>
                              edit(
                                cart.filter(
                                  (x) => x.medicineId !== l.medicineId,
                                ),
                              )
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!cart.length && (
                <Empty
                  title="Start a medicine bill"
                  description="Load a doctor's prescription, or add an OTC medicine from the search above."
                />
              )}
            </div>
            {!usable && (
              <p className="booking-error">
                Some quantities exceed usable stock. Restock before collecting
                payment.
              </p>
            )}
            <div className="counter-checkout">
              <div className="counter-payment">
                <Field label="Payment method">
                  <select
                    value={method}
                    onChange={(e) => {
                      setMethod(e.target.value);
                      requestId.current = "";
                    }}
                  >
                    {["Cash", "UPI", "Card"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                {method === "Cash" ? (
                  <Field label="Cash received (₹)">
                    <input
                      type="number"
                      min={totals.total}
                      step="0.01"
                      placeholder={`Exact amount: ${totals.total}`}
                      value={cash}
                      onChange={(e) => {
                        setCash(e.target.value);
                        requestId.current = "";
                      }}
                    />
                  </Field>
                ) : (
                  <Field label="Payment reference (optional)">
                    <input
                      maxLength={100}
                      value={paymentReference}
                      onChange={(e) => {
                        setPaymentReference(e.target.value);
                        requestId.current = "";
                      }}
                      placeholder="Transaction reference"
                    />
                  </Field>
                )}
                <p className="form-note">
                  Record payment only after receiving it at the counter.
                </p>
              </div>
              <div className="bill-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(totals.gross)}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>− {money(totals.discount)}</strong>
                </div>
                {totals.tax > 0 && (
                  <div>
                    <span>Included tax</span>
                    <strong>{money(totals.tax)}</strong>
                  </div>
                )}
                <div className="grand-total">
                  <span>Total</span>
                  <strong>{money(totals.total)}</strong>
                </div>
                {method === "Cash" && cash && Number(cash) >= totals.total && (
                  <div>
                    <span>Change to return</span>
                    <strong>{money(Number(cash) - totals.total)}</strong>
                  </div>
                )}
                <button
                  className="button primary"
                  disabled={
                    busy ||
                    !cart.length ||
                    !usable ||
                    customer.trim().length < 2 ||
                    (method === "Cash" &&
                      cash !== "" &&
                      Number(cash) < totals.total)
                  }
                  onClick={async () => {
                    if (busy) return;
                    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
                      toast.error("Check the 10-digit mobile number.");
                      return;
                    }
                    setBusy(true);
                    requestId.current ||= crypto.randomUUID();
                    try {
                      const invoice = await act(
                        {
                          action: "invoice",
                          requestId: requestId.current,
                          visitId,
                          customerName: customer,
                          customerPhone: phone,
                          paymentMethod: method,
                          paymentReference,
                          ...(cash ? { cashReceived: Number(cash) } : {}),
                          lines: cart,
                        },
                        "Bill saved. Stock updated.",
                      );
                      setPrint(invoice as PharmacyInvoice);
                      clear();
                    } catch {
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Check size={17} />
                  {busy
                    ? "Saving bill…"
                    : visit
                      ? "Payment received & dispense"
                      : "Payment received & save bill"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section className="surface">
          <div className="filter-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Search pharmacy bills"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Bill number, customer or mobile…"
              />
            </label>
            <button
              className="button secondary small"
              onClick={() =>
                downloadCsv(`pharmacy-sales-${clinicDate()}.csv`, [
                  [
                    "Bill",
                    "Customer",
                    "Phone",
                    "Date",
                    "Gross",
                    "Discount",
                    "Tax included",
                    "Total",
                    "Method",
                    "Status",
                  ],
                  ...invoices.map((i) => [
                    i.number,
                    i.customerName,
                    i.customerPhone,
                    i.createdAt,
                    i.gross,
                    i.discount,
                    i.tax,
                    i.total,
                    i.paymentMethod,
                    i.cancelledAt ? "Cancelled" : "Paid",
                  ]),
                ])
              }
            >
              <Download size={14} />
              Export sales
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill / date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter((i) =>
                    `${i.number} ${i.customerName} ${i.customerPhone}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.number}</strong>
                        <span className="cell-sub">
                          {new Date(i.createdAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}
                        </span>
                      </td>
                      <td>
                        <strong>{i.customerName}</strong>
                        <span className="cell-sub">{i.customerPhone}</span>
                      </td>
                      <td>{money(i.total)}</td>
                      <td>{i.paymentMethod}</td>
                      <td>
                        <span
                          className={`status ${i.cancelledAt ? "status-cancelled" : "status-completed"}`}
                        >
                          {i.cancelledAt ? "Cancelled" : "Paid"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="button secondary small"
                            onClick={() => setPrint(i)}
                          >
                            <Printer size={14} />
                            Receipt
                          </button>
                          {!i.cancelledAt && (
                            <button
                              className="icon-button danger"
                              aria-label={`Cancel bill ${i.number}`}
                              onClick={() => {
                                setCancel(i);
                                setReason("");
                              }}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!invoices.length && (
              <Empty
                title="No pharmacy bills yet"
                description="Saved bills and returns appear here."
              />
            )}
          </div>
        </section>
      )}
      {print && <InvoicePrint invoice={print} close={() => setPrint(null)} />}
      {discard && (
        <Modal
          title="Clear this unfinished bill?"
          description="No payment or stock change has been saved."
          close={() => setDiscard(false)}
        >
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDiscard(false)}
            >
              Keep bill
            </button>
            <button className="button primary" onClick={clear}>
              Clear bill
            </button>
          </div>
        </Modal>
      )}
      {cancel && (
        <Modal
          title="Cancel bill and return stock"
          description="The bill number stays in the records. Stock is restored once; settle any payment refund at the counter."
          close={() => setCancel(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await act(
                  { action: "cancelInvoice", invoiceId: cancel.id, reason },
                  "Bill cancelled. Stock restored.",
                );
                setCancel(null);
              } catch {
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="modal-body">
              <h3>
                {cancel.number} · {money(cancel.total)}
              </h3>
              <Field label="Cancellation / return reason">
                <textarea
                  required
                  minLength={3}
                  maxLength={300}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setCancel(null)}
              >
                Keep bill
              </button>
              <button className="button danger-button" disabled={busy}>
                {busy ? "Cancelling…" : "Cancel bill & restore stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
