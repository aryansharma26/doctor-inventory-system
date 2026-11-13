import {
  CheckCircle2,
  DollarSign,
  Printer,
  QrCode,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type OPDTicket, saveTicket } from "./opd-store";

interface OPDBillingModalProps {
  ticket: OPDTicket;
  onClose: () => void;
}

export function OPDBillingModal({ ticket, onClose }: OPDBillingModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<
    "GCASH" | "MAYA" | "CARD" | "CASH" | "CARD"
  >(ticket.billing?.paymentMethod || "GCASH");
  const [gcashRefNo, setGcashRefNo] = useState(
    ticket.billing?.gcashRefNo ||
      `GCASH-${Math.floor(10000000 + Math.random() * 90000000)}`,
  );
  const [isPaid, setIsPaid] = useState<boolean>(
    ticket.billing?.paymentStatus === "PAID",
  );

  const consultationFeePhp = ticket.billing?.consultationFeePhp || 600;
  const vitalsCheckFeePhp = ticket.billing?.vitalsCheckFeePhp || 150;

  const labFeePhp = (ticket.labOrders || []).reduce(
    (acc, item) => acc + item.pricePhp,
    0,
  );
  const medsFeePhp = (ticket.prescribedMedicines || []).length * 120; // ₱120 approx per medicine

  const totalAmountPhp =
    consultationFeePhp + vitalsCheckFeePhp + labFeePhp + medsFeePhp;

  const handleMarkAsPaid = () => {
    const updatedBilling = {
      invoiceNo:
        ticket.billing?.invoiceNo ||
        `INV-PH-${Date.now().toString().slice(-6)}`,
      consultationFeePhp,
      vitalsCheckFeePhp,
      labFeePhp,
      medicinesFeePhp: medsFeePhp,
      totalAmountPhp,
      paymentMethod,
      paymentStatus: "PAID" as const,
      paidAt: new Date().toISOString(),
      gcashRefNo:
        paymentMethod === "GCASH" || paymentMethod === "MAYA"
          ? gcashRefNo
          : undefined,
    };

    const updatedTicket: OPDTicket = {
      ...ticket,
      billing: updatedBilling,
    };

    saveTicket(updatedTicket);
    setIsPaid(true);
    toast.success(
      `Payment of ₱${totalAmountPhp.toLocaleString()} recorded via ${paymentMethod}! Official Receipt Ready.`,
    );
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print flex flex-wrap items-center justify-center gap-3 w-full p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
        <button
          onClick={handlePrintReceipt}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition shadow cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print Official Receipt (₱)
        </button>

        {!isPaid && (
          <button
            onClick={handleMarkAsPaid}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition shadow cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirm Payment & Issue Receipt
          </button>
        )}

        <button
          onClick={onClose}
          className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl transition cursor-pointer"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-4xl">
        {/* Left Column: Payment & E-Wallet Controls (5 cols) (Hidden during print) */}
        <div className="no-print lg:col-span-5 bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">
              PHILIPPINES OPD BILLING
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Payment & E-Wallet Terminal
            </h3>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Philippines Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("GCASH")}
                className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === "GCASH"
                    ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Wallet className="w-5 h-5 text-blue-600" />
                GCash
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("MAYA")}
                className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === "MAYA"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-600" />
                Maya
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === "CARD"
                    ? "border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <QrCode className="w-5 h-5 text-red-600" />
                QR Ph
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <DollarSign className="w-5 h-5 text-amber-600" />
                Cash
              </button>
            </div>
          </div>

          {/* E-Wallet QR Display */}
          {(paymentMethod === "GCASH" ||
            paymentMethod === "MAYA" ||
            paymentMethod === "CARD") && (
            <div className="p-4 bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl text-center space-y-2 shadow-inner">
              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                SCAN TO PAY WITH {paymentMethod} / QR PH
              </span>

              {/* Simulated E-Wallet QR Pattern */}
              <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-xl shadow-lg flex items-center justify-center">
                <div className="w-full h-full border-4 border-slate-900 rounded-md p-1.5 flex flex-col justify-between items-center bg-slate-900 text-emerald-400 font-mono text-[10px] font-black">
                  <span>[QR PH MERCHANT]</span>
                  <QrCode className="w-12 h-12 text-blue-400" />
                  <span>₱{totalAmountPhp.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-slate-300 block text-[11px]">
                  Merchant: City Healthcare Manila
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ₱{totalAmountPhp.toLocaleString()} PHP
                </span>
              </div>

              <div>
                <label className="block text-[10px] text-blue-200 font-medium text-left mb-1">
                  E-Wallet Reference No.
                </label>
                <input
                  type="text"
                  value={gcashRefNo}
                  onChange={(e) => setGcashRefNo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-blue-400/30 bg-white/10 text-white text-xs font-mono font-bold"
                />
              </div>
            </div>
          )}

          {!isPaid && (
            <button
              onClick={handleMarkAsPaid}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" /> Mark Paid & Finalize Receipt
            </button>
          )}
        </div>

        {/* Right Column: Philippines Official Receipt Printable Slip (7 cols) */}
        <div className="lg:col-span-7 bg-white text-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 font-sans printable-receipt-area">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              CITY HEALTHCARE CLINIC INC.
            </h2>
            <p className="text-[11px] text-slate-600 font-medium">
              Medical Zone, Bonifacio Global City, Taguig City, Metro Manila
            </p>
            <p className="text-[10px] text-slate-500">
              TIN: 009-842-110-000 • VAT Registered • Tel: (02) 8888-9900
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-full">
              OFFICIAL RECEIPT (OR)
            </div>
          </div>

          {/* Receipt Header Info */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">
                PATIENT NAME
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {ticket.patientName}
              </span>
              <span className="text-[11px] text-slate-600 block">
                Phone: {ticket.phone}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-semibold block">
                OR / INVOICE NO
              </span>
              <span className="font-mono font-bold text-slate-900">
                {ticket.billing?.invoiceNo || "INV-PH-PENDING"}
              </span>
              <span className="text-[11px] text-slate-600 block">
                {new Date().toLocaleDateString("en-PH")}
              </span>
            </div>
          </div>

          {/* Itemized Billing Table */}
          <table className="w-full text-left text-xs mb-4 border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <th className="p-2 border border-slate-700">Description</th>
                <th className="p-2 border border-slate-700 text-right w-28">
                  Amount (PHP ₱)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              <tr>
                <td className="p-2 border border-slate-300">
                  OPD Physician Consultation Fee
                </td>
                <td className="p-2 border border-slate-300 text-right font-semibold">
                  ₱{consultationFeePhp.toLocaleString()}.00
                </td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">
                  Reception Vitals & Triage Assessment
                </td>
                <td className="p-2 border border-slate-300 text-right font-semibold">
                  ₱{vitalsCheckFeePhp.toLocaleString()}.00
                </td>
              </tr>
              {labFeePhp > 0 && (
                <tr>
                  <td className="p-2 border border-slate-300">
                    Diagnostic Laboratory Orders
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-semibold">
                    ₱{labFeePhp.toLocaleString()}.00
                  </td>
                </tr>
              )}
              {medsFeePhp > 0 && (
                <tr>
                  <td className="p-2 border border-slate-300">
                    Prescribed Pharmaceuticals
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-semibold">
                    ₱{medsFeePhp.toLocaleString()}.00
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-black text-slate-900 text-sm">
                <td className="p-2.5 border border-slate-300">
                  TOTAL AMOUNT DUE
                </td>
                <td className="p-2.5 border border-slate-300 text-right text-emerald-800 font-mono">
                  ₱{totalAmountPhp.toLocaleString()}.00
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Status Summary */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                PAYMENT MODE
              </span>
              <span className="font-extrabold text-emerald-950">
                {paymentMethod}
              </span>
              {gcashRefNo && (
                <span className="text-[10px] text-emerald-700 block font-mono">
                  Ref: {gcashRefNo}
                </span>
              )}
            </div>

            <span
              className={`px-3 py-1 text-xs font-black rounded-full ${
                isPaid ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
              }`}
            >
              {isPaid ? "PAID IN FULL" : "PENDING PAYMENT"}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500">
            <p className="font-semibold text-slate-700">
              Thank you for choosing City Healthcare Manila!
            </p>
            <p>Official Electronic Receipt • BIR Authorized Systems</p>
          </div>
        </div>
      </div>
    </div>
  );
}
