import { ExternalLink, FileText, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type OPDTicket, saveTicket } from "./opd-store";

interface LabReportsSectionProps {
  ticket: OPDTicket;
  onUpdate?: () => void;
}

const COMMON_LAB_TESTS_PH = [
  { name: "Complete Blood Count (CBC) with Platelet", pricePhp: 350 },
  { name: "Fasting Blood Sugar (FBS)", pricePhp: 250 },
  { name: "HbA1c Blood Glucose Review", pricePhp: 650 },
  {
    name: "Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)",
    pricePhp: 750,
  },
  { name: "Urinalysis (Routine Urine Examination)", pricePhp: 180 },
  { name: "Chest X-Ray PA View", pricePhp: 450 },
  { name: "12-Lead Electrocardiogram (ECG)", pricePhp: 400 },
  { name: "Fecalysis (Stool Examination)", pricePhp: 150 },
];

export function LabReportsSection({
  ticket,
  onUpdate,
}: LabReportsSectionProps) {
  const [selectedTestName, setSelectedTestName] = useState(
    COMMON_LAB_TESTS_PH[0].name,
  );
  const [customTestName, setCustomTestName] = useState("");
  const [pricePhp, setPricePhp] = useState<number>(
    COMMON_LAB_TESTS_PH[0].pricePhp,
  );
  const [labNotes, setLabNotes] = useState("");

  const handleOrderLabTest = () => {
    const nameToUse = customTestName.trim() || selectedTestName;
    if (!nameToUse) {
      toast.error("Please select or enter a lab test name");
      return;
    }

    const newOrder = {
      id: `lab-${Date.now()}`,
      testName: nameToUse,
      status: "ORDERED" as const,
      pricePhp,
      orderedAt: new Date().toISOString(),
      notes: labNotes.trim(),
    };

    const currentOrders = ticket.labOrders || [];
    const updatedTicket: OPDTicket = {
      ...ticket,
      labOrders: [...currentOrders, newOrder],
    };

    saveTicket(updatedTicket);
    setCustomTestName("");
    setLabNotes("");
    toast.success(`Lab Test "${nameToUse}" ordered for ${ticket.patientName}`);
    if (onUpdate) onUpdate();
  };

  const handleAttachReport = (labId: string) => {
    const fakeReportUrl = `https://cityhealthcare-ph.org/reports/${ticket.patientId}/${labId}.pdf`;
    const updatedOrders = (ticket.labOrders || []).map((order) => {
      if (order.id === labId) {
        return {
          ...order,
          status: "COMPLETED" as const,
          reportUrl: fakeReportUrl,
          notes:
            order.notes || "Report verified by Pathologist Dr. Santos, RMT",
        };
      }
      return order;
    });

    const updatedTicket: OPDTicket = {
      ...ticket,
      labOrders: updatedOrders,
    };

    saveTicket(updatedTicket);
    toast.success("Diagnostic PDF report attached successfully!");
    if (onUpdate) onUpdate();
  };

  const handleRemoveOrder = (labId: string) => {
    const updatedOrders = (ticket.labOrders || []).filter(
      (o) => o.id !== labId,
    );
    const updatedTicket: OPDTicket = {
      ...ticket,
      labOrders: updatedOrders,
    };
    saveTicket(updatedTicket);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
            DIAGNOSTICS & LABORATORY EMR
          </span>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Lab Test Orders &
            Diagnostic Reports
          </h3>
        </div>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-900 font-extrabold text-xs rounded-full">
          {(ticket.labOrders || []).length} Orders
        </span>
      </div>

      {/* Lab Order Generator Widget */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Select Philippines Diagnostic Lab Test
            </label>
            <select
              value={selectedTestName}
              onChange={(e) => {
                setSelectedTestName(e.target.value);
                const found = COMMON_LAB_TESTS_PH.find(
                  (t) => t.name === e.target.value,
                );
                if (found) setPricePhp(found.pricePhp);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
            >
              {COMMON_LAB_TESTS_PH.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} (₱{t.pricePhp})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Or Custom Test & Price (₱ PHP)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Custom Test Name"
                value={customTestName}
                onChange={(e) => setCustomTestName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
              />
              <input
                type="number"
                placeholder="₱ Price"
                value={pricePhp}
                onChange={(e) => setPricePhp(Number(e.target.value) || 0)}
                className="w-24 px-2 py-2 rounded-xl border border-slate-300 text-xs font-bold text-center bg-white"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleOrderLabTest}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
        >
          <Plus className="w-4 h-4" /> Issue Diagnostic Order (₱{pricePhp})
        </button>
      </div>

      {/* Active Lab Test Orders List */}
      <div className="space-y-3">
        {!ticket.labOrders || ticket.labOrders.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No lab tests ordered yet for this patient.
          </div>
        ) : (
          ticket.labOrders.map((order, idx) => (
            <div
              key={order.id}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {idx + 1}. {order.testName}
                  </span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    ₱{order.pricePhp} PHP
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {order.notes && (
                  <p className="text-slate-600 italic">
                    Notes: "{order.notes}"
                  </p>
                )}
                {order.reportUrl && (
                  <a
                    href={order.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-bold text-[11px]"
                  >
                    <ExternalLink className="w-3 h-3" /> View Attached
                    Diagnostic Report PDF
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {order.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleAttachReport(order.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Attach Report PDF
                  </button>
                )}

                <button
                  onClick={() => handleRemoveOrder(order.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
