"use client";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { type PharmacyInvoice, money } from "./types";
import { Modal } from "./ui";
export function InvoicePrint({
  invoice,
  close,
}: {
  invoice: PharmacyInvoice;
  close: () => void;
}) {
  return createPortal(
    <Modal title="Pharmacy receipt" close={close} wide>
      <div className="print-document invoice-document">
        <div className="print-letterhead">
          <div>
            <h2>Harmony Hospital</h2>
            <p>Pharmacy · Hisar, Haryana</p>
          </div>
          <strong>H+</strong>
        </div>
        <div className="print-info">
          <div>
            <h3>{invoice.customerName}</h3>
            <p>
              {invoice.customerPhone
                ? `+91 ${invoice.customerPhone}`
                : "Counter sale"}
            </p>
          </div>
          <div>
            <strong>{invoice.number}</strong>
            <p>
              {new Date(invoice.createdAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </p>
            <p>Billed by {invoice.createdBy}</p>
          </div>
        </div>
        {invoice.cancelledAt && (
          <div className="allergy-alert">
            CANCELLED · {invoice.cancelReason}
          </div>
        )}
        <table className="data-table invoice-print-table">
          <thead>
            <tr>
              <th>Medicine / batch / expiry</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Disc.</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l) => (
              <tr key={l.medicineId}>
                <td>
                  <strong>{l.name}</strong>
                  <p>
                    Batch {l.batch} · Exp. {l.expiry}
                  </p>
                </td>
                <td>{l.quantity}</td>
                <td>{money(l.unitPrice)}</td>
                <td>{l.discountPercent}%</td>
                <td>{money(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="invoice-print-totals">
          <div>
            <span>Gross amount</span>
            <strong>{money(invoice.gross)}</strong>
          </div>
          <div>
            <span>Discount</span>
            <strong>− {money(invoice.discount)}</strong>
          </div>
          {invoice.tax > 0 && (
            <>
              <div>
                <span>Taxable value</span>
                <strong>{money(invoice.taxable)}</strong>
              </div>
              <div>
                <span>Tax included in selling price</span>
                <strong>{money(invoice.tax)}</strong>
              </div>
            </>
          )}
          <div className="grand-total">
            <span>
              {invoice.cancelledAt ? "Cancelled bill value" : "Total paid"} ·{" "}
              {invoice.paymentMethod}
            </span>
            <strong>{money(invoice.total)}</strong>
          </div>
          {invoice.paymentMethod === "Cash" && (
            <>
              <div>
                <span>Cash received</span>
                <strong>{money(invoice.cashReceived ?? invoice.total)}</strong>
              </div>
              <div>
                <span>Change returned</span>
                <strong>{money(invoice.change || 0)}</strong>
              </div>
            </>
          )}
          {invoice.paymentReference && (
            <p>Payment reference: {invoice.paymentReference}</p>
          )}
        </div>
        <p className="print-footnote">
          Sale receipt · Prices include any configured tax. This receipt records
          the medicines and batch details sold by the pharmacy.{" "}
          {invoice.visitId ? `Hospital visit: ${invoice.visitId}` : ""}
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
