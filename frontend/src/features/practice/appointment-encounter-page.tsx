import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  IndianRupee,
  Paperclip,
  Pill,
  Save,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { practiceKeys } from "./practice-queries";
import type { AppointmentEncounter, AppointmentStatus } from "./types";

const clinicalSchema = z.object({
  symptoms: z.string().max(5000),
  diagnosisSummary: z.string().max(5000),
  clinicalSummary: z.string().max(5000),
  notes: z.string().max(2000),
  followUpAt: z.string(),
});

const invoiceSchema = z.object({
  consultationFee: z.coerce.number().positive("Enter consultation fee"),
  discount: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100),
  dueAt: z.string(),
  paymentAmount: z.coerce.number().min(0),
  paymentMethod: z.enum([
    "CASH",
    "CARD",
    "GCASH",
    "MAYA",
    "BANK_TRANSFER",
    "CREDIT",
    "SPLIT",
    "UPI",
  ]),
  transactionReference: z.string(),
  notes: z.string(),
});

const nextStatuses: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  BOOKED: ["CONFIRMED", "CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["IN_CONSULTATION", "CANCELLED"],
  IN_CONSULTATION: ["COMPLETED"],
};

export function AppointmentEncounterPage() {
  const { appointmentId = "" } = useParams();
  const client = useQueryClient();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const query = useQuery({
    queryKey: ["appointment-encounter", appointmentId],
    queryFn: () =>
      api<AppointmentEncounter>(
        `/practice/appointments/${appointmentId}/encounter`,
      ),
    enabled: Boolean(appointmentId),
  });
  const clinical = useForm<z.infer<typeof clinicalSchema>>({
    resolver: zodResolver(clinicalSchema),
    defaultValues: {
      symptoms: "",
      diagnosisSummary: "",
      clinicalSummary: "",
      notes: "",
      followUpAt: "",
    },
  });
  const invoice = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      consultationFee: 0,
      discount: 0,
      taxRate: 0,
      dueAt: "",
      paymentAmount: 0,
      paymentMethod: "CASH",
      transactionReference: "",
      notes: "",
    },
  });
  useEffect(() => {
    if (!query.data) return;
    clinical.reset({
      symptoms: query.data.symptoms ?? "",
      diagnosisSummary: query.data.diagnosisSummary ?? "",
      clinicalSummary: query.data.clinicalSummary ?? "",
      notes: query.data.notes ?? "",
      followUpAt: query.data.followUpAt?.slice(0, 16) ?? "",
    });
  }, [query.data, clinical]);
  const refresh = () => {
    void client.invalidateQueries({
      queryKey: ["appointment-encounter", appointmentId],
    });
    if (query.data?.patient.id) {
      void client.invalidateQueries({
        queryKey: practiceKeys.patientRecord(query.data.patient.id),
      });
    }
    void client.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const saveClinical = useMutation({
    mutationFn: (values: z.infer<typeof clinicalSchema>) =>
      api(`/practice/appointments/${appointmentId}/clinical`, {
        method: "PATCH",
        body: JSON.stringify({
          symptoms: values.symptoms,
          diagnosisSummary: values.diagnosisSummary,
          clinicalSummary: values.clinicalSummary,
          notes: values.notes,
          followUpAt: values.followUpAt || null,
        }),
      }),
    onSuccess: () => {
      toast.success("Encounter notes saved");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const statusMutation = useMutation({
    mutationFn: (status: AppointmentStatus) =>
      api(`/practice/appointments/${appointmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success("Appointment status updated");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const createInvoice = useMutation({
    mutationFn: (values: z.infer<typeof invoiceSchema>) =>
      api(`/practice/appointments/${appointmentId}/invoice`, {
        method: "POST",
        body: JSON.stringify({
          consultationFee: values.consultationFee,
          discount: values.discount,
          taxRate: values.taxRate,
          dueAt: values.dueAt || undefined,
          notes: values.notes || undefined,
          additionalItems: [],
          ...(values.paymentAmount > 0
            ? {
                payment: {
                  amount: values.paymentAmount,
                  method: values.paymentMethod,
                  transactionReference:
                    values.transactionReference || undefined,
                },
              }
            : {}),
        }),
      }),
    onSuccess: () => {
      toast.success("Invoice generated from appointment");
      setInvoiceOpen(false);
      invoice.reset();
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const encounter = query.data;
  if (query.isLoading)
    return (
      <div className="card grid min-h-80 place-items-center text-sm text-slate-500">
        Loading appointment encounter...
      </div>
    );
  if (!encounter)
    return (
      <div className="card p-10 text-center">
        <h2 className="font-semibold">Appointment unavailable</h2>
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-blue-700"
          to="/appointments"
        >
          Back to appointments
        </Link>
      </div>
    );
  const transitionOptions = nextStatuses[encounter.status] ?? [];
  const hasInvoice = encounter.invoices.some((item) => item.status !== "VOID");

  return (
    <div>
      <Link
        to="/appointments"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Back to appointments
      </Link>
      <section className="mt-4 rounded-2xl bg-[#071b4a] p-6 text-white">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/10">
            <Stethoscope size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{encounter.patient.name}</h1>
              <Status value={encounter.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/60">
              <span>{encounter.patient.patientCode}</span>
              <span>Dr. {encounter.doctor.user.fullName}</span>
              <span>
                {format(new Date(encounter.startsAt), "d MMM yyyy, h:mm a")}
              </span>
              <span>{encounter.type.replaceAll("_", " ")}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="btn-secondary border-white/20! bg-white/10! text-white! hover:bg-white/15!"
              to={`/patients/${encounter.patient.id}`}
            >
              <UserRound size={15} />
              Patient 360
            </Link>
            <Link
              className="btn-secondary border-white/20! bg-white/10! text-white! hover:bg-white/15!"
              to={`/prescriptions?patientId=${encounter.patient.id}&appointmentId=${encounter.id}&doctorId=${encounter.doctorMembershipId}`}
            >
              <Pill size={15} />
              Prescription
            </Link>
            <button
              className="btn-primary"
              disabled={hasInvoice}
              onClick={() => setInvoiceOpen(true)}
            >
              <IndianRupee size={15} />
              {hasInvoice ? "Invoice generated" : "Generate invoice"}
            </button>
          </div>
        </div>
      </section>

      {transitionOptions.length > 0 && (
        <section className="card mt-5 flex flex-wrap items-center gap-3 p-4">
          <span className="text-xs font-semibold text-slate-500">
            Move appointment to:
          </span>
          {transitionOptions.map((status) => (
            <button
              key={status}
              className="btn-secondary px-3! py-2!"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(status)}
            >
              <CheckCircle2 size={14} />
              {status.replaceAll("_", " ")}
            </button>
          ))}
        </section>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <form
          className="card p-5"
          onSubmit={clinical.handleSubmit((values) =>
            saveClinical.mutate(values),
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Clinical encounter</h2>
              <p className="mt-1 text-xs text-slate-500">
                Symptoms, assessment, diagnosis and care plan
              </p>
            </div>
            <button className="btn-primary" disabled={saveClinical.isPending}>
              <Save size={15} />
              {saveClinical.isPending ? "Saving..." : "Save encounter"}
            </button>
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Symptoms / chief complaint">
              <textarea
                className="field min-h-24 py-3"
                {...clinical.register("symptoms")}
              />
            </Field>
            <Field label="Diagnosis summary">
              <textarea
                className="field min-h-24 py-3"
                {...clinical.register("diagnosisSummary")}
              />
            </Field>
            <Field label="Clinical assessment and plan">
              <textarea
                className="field min-h-36 py-3"
                {...clinical.register("clinicalSummary")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Follow-up date">
                <input
                  type="datetime-local"
                  className="field"
                  {...clinical.register("followUpAt")}
                />
              </Field>
              <Field label="Internal notes">
                <textarea
                  className="field min-h-20 py-3"
                  {...clinical.register("notes")}
                />
              </Field>
            </div>
          </div>
        </form>

        <aside className="space-y-5">
          <SummaryCard
            icon={HeartPulse}
            title="Vitals"
            value={encounter.vitals.length}
            detail={
              encounter.vitals[0]
                ? `Latest ${format(new Date(encounter.vitals[0].recordedAt), "d MMM, h:mm a")}`
                : "Not recorded"
            }
            to={`/patients/${encounter.patient.id}`}
          />
          <SummaryCard
            icon={Stethoscope}
            title="Diagnoses"
            value={encounter.diagnoses.length}
            detail={encounter.diagnoses[0]?.name || "Not recorded"}
            to={`/patients/${encounter.patient.id}`}
          />
          <SummaryCard
            icon={FlaskConical}
            title="Lab reports"
            value={encounter.labReports.length}
            detail={encounter.labReports[0]?.testName || "No reports"}
            to={`/patients/${encounter.patient.id}`}
          />
          <SummaryCard
            icon={Paperclip}
            title="Attachments"
            value={encounter.documents.length}
            detail="Encounter-linked documents"
            to={`/documents?patientId=${encounter.patient.id}&appointmentId=${encounter.id}`}
          />
        </aside>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <CompactList
          title="Prescriptions"
          icon={Pill}
          rows={encounter.prescriptions.map((item) => ({
            id: item.id,
            title: item.prescriptionNumber,
            detail: `${item.items.length} medicines · ${item.status}`,
          }))}
        />
        <CompactList
          title="Invoices & payments"
          icon={CreditCard}
          rows={encounter.invoices.map((item) => ({
            id: item.id,
            title: item.invoiceNumber,
            detail: `₱${Number(item.total).toLocaleString("en-PH")} · Paid ₱${Number(item.paid).toLocaleString("en-PH")}`,
          }))}
        />
        <CompactList
          title="Follow-ups"
          icon={CalendarDays}
          rows={encounter.followUps.map((item) => ({
            id: item.id,
            title: item.reason,
            detail: `${format(new Date(item.dueAt), "d MMM yyyy")} · ${item.status}`,
          }))}
        />
      </div>

      <Modal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="Generate appointment invoice"
        description="Creates an invoice linked to this patient, doctor and appointment."
      >
        <form
          onSubmit={invoice.handleSubmit((values) =>
            createInvoice.mutate(values),
          )}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field
            label="Consultation fee"
            error={invoice.formState.errors.consultationFee?.message}
          >
            <input
              type="number"
              step=".01"
              className="field"
              {...invoice.register("consultationFee")}
            />
          </Field>
          <Field label="Discount">
            <input
              type="number"
              step=".01"
              className="field"
              {...invoice.register("discount")}
            />
          </Field>
          <Field label="Tax rate (%)">
            <input
              type="number"
              step=".01"
              className="field"
              {...invoice.register("taxRate")}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className="field"
              {...invoice.register("dueAt")}
            />
          </Field>
          <Field label="Receive now">
            <input
              type="number"
              step=".01"
              className="field"
              {...invoice.register("paymentAmount")}
            />
          </Field>
          <Field label="Payment method">
            <select className="field" {...invoice.register("paymentMethod")}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="GCASH">GCash</option>
              <option value="MAYA">Maya</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CREDIT">Credit</option>
            </select>
          </Field>
          <Field label="Transaction reference">
            <input
              className="field"
              {...invoice.register("transactionReference")}
            />
          </Field>
          <Field label="Invoice notes">
            <input className="field" {...invoice.register("notes")} />
          </Field>
          <div className="col-span-full flex justify-end border-t border-line pt-4">
            <button className="btn-primary" disabled={createInvoice.isPending}>
              <IndianRupee size={15} />
              {createInvoice.isPending ? "Generating..." : "Generate invoice"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      )}
    </fieldset>
  );
}

function Status({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold">
      {value.replaceAll("_", " ")}
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  detail,
  to,
}: {
  icon: typeof HeartPulse;
  title: string;
  value: number;
  detail: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="card flex items-center gap-3 p-4 transition hover:border-blue-200"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500">{title}</div>
        <div className="mt-1 truncate text-sm font-semibold">{detail}</div>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </Link>
  );
}

function CompactList({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Pill;
  rows: Array<{ id: string; title: string; detail: string }>;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Icon size={16} className="text-blue-700" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="divide-y divide-line">
        {rows.map((row) => (
          <div key={row.id} className="p-4">
            <div className="text-xs font-semibold">{row.title}</div>
            <div className="mt-1 text-[11px] text-slate-500">{row.detail}</div>
          </div>
        ))}
        {!rows.length && (
          <div className="p-6 text-center text-xs text-slate-400">
            <FileText size={20} className="mx-auto mb-2 opacity-40" />
            No records
          </div>
        )}
      </div>
    </section>
  );
}
