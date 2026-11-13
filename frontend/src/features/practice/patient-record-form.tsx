import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { practiceKeys } from "./practice-queries";
import type { PatientRecord } from "./types";

export type PatientResource =
  | "medical-history"
  | "allergy"
  | "vital"
  | "diagnosis"
  | "lab-report"
  | "vaccination"
  | "insurance"
  | "follow-up"
  | "note"
  | "payment";

const optional = z.string().trim().optional();
const baseSchema = z.object({
  appointmentId: optional,
  condition: optional,
  category: optional,
  status: optional,
  diagnosedOn: optional,
  isChronic: z.boolean().optional(),
  treatment: optional,
  notes: optional,
  allergen: optional,
  allergyType: optional,
  severity: optional,
  reaction: optional,
  onsetDate: optional,
  systolicBp: optional,
  diastolicBp: optional,
  heartRate: optional,
  respiratoryRate: optional,
  temperatureCelsius: optional,
  oxygenSaturation: optional,
  heightCm: optional,
  weightKg: optional,
  bloodGlucoseMgDl: optional,
  painScore: optional,
  name: optional,
  code: optional,
  diagnosisType: optional,
  diagnosedAt: optional,
  testName: optional,
  reportNumber: optional,
  labName: optional,
  orderedAt: optional,
  abnormal: z.boolean().optional(),
  interpretation: optional,
  vaccineName: optional,
  disease: optional,
  doseNumber: optional,
  lotNumber: optional,
  manufacturer: optional,
  administeredAt: optional,
  nextDoseAt: optional,
  providerName: optional,
  planName: optional,
  policyNumber: optional,
  policyHolder: optional,
  validFrom: optional,
  validUntil: optional,
  coverageAmount: optional,
  copayAmount: optional,
  dueAt: optional,
  reason: optional,
  priority: optional,
  channel: optional,
  noteType: optional,
  title: optional,
  summary: optional,
  invoiceId: optional,
  amount: optional,
  method: optional,
  transactionReference: optional,
});

type FormValues = z.infer<typeof baseSchema>;

const requiredByResource: Record<PatientResource, Array<keyof FormValues>> = {
  "medical-history": ["condition"],
  allergy: ["allergen", "allergyType"],
  vital: [],
  diagnosis: ["name"],
  "lab-report": ["testName"],
  vaccination: ["vaccineName", "administeredAt"],
  insurance: ["providerName", "policyNumber", "policyHolder"],
  "follow-up": ["dueAt", "reason"],
  note: ["noteType", "title", "summary"],
  payment: ["invoiceId", "amount", "method"],
};

const defaults: FormValues = {
  status: "ACTIVE",
  isChronic: false,
  severity: "MODERATE",
  allergyType: "DRUG",
  diagnosisType: "PRIMARY",
  abnormal: false,
  priority: "NORMAL",
  channel: "PHONE",
  noteType: "CONSULTATION",
  method: "CASH",
  administeredAt: new Date().toISOString().slice(0, 10),
  orderedAt: new Date().toISOString().slice(0, 10),
  diagnosedAt: new Date().toISOString().slice(0, 10),
};

const defaultsFor = (resource: PatientResource): FormValues => ({
  ...defaults,
  status:
    resource === "diagnosis"
      ? "CONFIRMED"
      : resource === "lab-report"
        ? "ORDERED"
        : "ACTIVE",
});

export function PatientRecordForm({
  resource,
  patient,
  onSaved,
}: {
  resource: PatientResource;
  patient: PatientRecord;
  onSaved: () => void;
}) {
  const client = useQueryClient();
  const formDefaults = useMemo(() => defaultsFor(resource), [resource]);
  const schema = useMemo(
    () =>
      baseSchema.superRefine((values, context) => {
        for (const field of requiredByResource[resource]) {
          const value = values[field];
          if (typeof value !== "string" || value.trim().length === 0) {
            context.addIssue({
              code: "custom",
              path: [field],
              message: "This field is required",
            });
          }
        }
        if (resource === "vital") {
          const measurements: Array<keyof FormValues> = [
            "systolicBp",
            "diastolicBp",
            "heartRate",
            "respiratoryRate",
            "temperatureCelsius",
            "oxygenSaturation",
            "heightCm",
            "weightKg",
            "bloodGlucoseMgDl",
            "painScore",
          ];
          if (!measurements.some((field) => values[field])) {
            context.addIssue({
              code: "custom",
              path: ["systolicBp"],
              message: "Enter at least one measurement",
            });
          }
        }
        if (resource === "payment" && Number(values.amount) <= 0) {
          context.addIssue({
            code: "custom",
            path: ["amount"],
            message: "Enter a valid payment amount",
          });
        }
      }),
    [resource],
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: formDefaults,
  });
  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const { path, payload } = requestFor(resource, patient.id, values);
      return api(path, { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      toast.success("Patient record updated");
      void client.invalidateQueries({
        queryKey: practiceKeys.patientRecord(patient.id),
      });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset(formDefaults);
      onSaved();
    },
    onError: (error) => toast.error(error.message),
  });
  const appointments = patient.appointments.filter(
    (item) => !["CANCELLED", "NO_SHOW"].includes(item.status),
  );
  const payableInvoices = patient.invoices.filter(
    (item) =>
      ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(item.status) &&
      Number(item.total) > Number(item.paid),
  );

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="grid gap-4 sm:grid-cols-2"
    >
      {!["insurance", "note", "payment"].includes(resource) && (
        <Field label="Related appointment">
          <select className="field" {...form.register("appointmentId")}>
            <option value="">Not linked to an appointment</option>
            {appointments.map((item) => (
              <option key={item.id} value={item.id}>
                {new Date(item.startsAt).toLocaleDateString("en-PH")} ·{" "}
                {item.type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
      )}

      {resource === "medical-history" && (
        <>
          <Field
            label="Condition"
            error={form.formState.errors.condition?.message}
          >
            <input
              className="field"
              placeholder="e.g. Hypertension"
              {...form.register("condition")}
            />
          </Field>
          <Field label="Category">
            <input
              className="field"
              placeholder="Chronic, surgical, family..."
              {...form.register("category")}
            />
          </Field>
          <Field label="Status">
            <select className="field" {...form.register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
          <Field label="Diagnosed on">
            <input
              type="date"
              className="field"
              {...form.register("diagnosedOn")}
            />
          </Field>
          <label className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-blue-600"
              {...form.register("isChronic")}
            />
            Chronic condition
          </label>
          <Field label="Treatment">
            <input className="field" {...form.register("treatment")} />
          </Field>
        </>
      )}

      {resource === "allergy" && (
        <>
          <Field
            label="Allergen"
            error={form.formState.errors.allergen?.message}
          >
            <input
              className="field"
              placeholder="Medicine, food, substance..."
              {...form.register("allergen")}
            />
          </Field>
          <Field label="Type">
            <select className="field" {...form.register("allergyType")}>
              <option value="DRUG">Drug</option>
              <option value="FOOD">Food</option>
              <option value="ENVIRONMENTAL">Environmental</option>
              <option value="LATEX">Latex</option>
              <option value="INSECT">Insect</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Severity">
            <select className="field" {...form.register("severity")}>
              <option value="MILD">Mild</option>
              <option value="MODERATE">Moderate</option>
              <option value="SEVERE">Severe</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </Field>
          <Field label="Onset date">
            <input
              type="date"
              className="field"
              {...form.register("onsetDate")}
            />
          </Field>
          <Field label="Reaction">
            <input
              className="field"
              placeholder="Observed reaction"
              {...form.register("reaction")}
            />
          </Field>
        </>
      )}

      {resource === "vital" && (
        <>
          <Field label="Blood pressure">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="field"
                placeholder="Systolic"
                {...form.register("systolicBp")}
              />
              <input
                type="number"
                className="field"
                placeholder="Diastolic"
                {...form.register("diastolicBp")}
              />
            </div>
            <ErrorText value={form.formState.errors.systolicBp?.message} />
          </Field>
          <Field label="Pulse / min">
            <input
              type="number"
              className="field"
              {...form.register("heartRate")}
            />
          </Field>
          <Field label="Respiratory rate">
            <input
              type="number"
              className="field"
              {...form.register("respiratoryRate")}
            />
          </Field>
          <Field label="Temperature (°C)">
            <input
              type="number"
              step=".1"
              className="field"
              {...form.register("temperatureCelsius")}
            />
          </Field>
          <Field label="Oxygen saturation (%)">
            <input
              type="number"
              step=".1"
              className="field"
              {...form.register("oxygenSaturation")}
            />
          </Field>
          <Field label="Height (cm)">
            <input
              type="number"
              step=".1"
              className="field"
              {...form.register("heightCm")}
            />
          </Field>
          <Field label="Weight (kg)">
            <input
              type="number"
              step=".1"
              className="field"
              {...form.register("weightKg")}
            />
          </Field>
          <Field label="Blood glucose (mg/dL)">
            <input
              type="number"
              step=".1"
              className="field"
              {...form.register("bloodGlucoseMgDl")}
            />
          </Field>
          <Field label="Pain score (0-10)">
            <input
              type="number"
              min={0}
              max={10}
              className="field"
              {...form.register("painScore")}
            />
          </Field>
        </>
      )}

      {resource === "diagnosis" && (
        <>
          <Field label="Diagnosis" error={form.formState.errors.name?.message}>
            <input
              className="field"
              placeholder="Clinical diagnosis"
              {...form.register("name")}
            />
          </Field>
          <Field label="ICD / SNOMED code">
            <input className="field" {...form.register("code")} />
          </Field>
          <Field label="Type">
            <select className="field" {...form.register("diagnosisType")}>
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
              <option value="DIFFERENTIAL">Differential</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="field" {...form.register("status")}>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROVISIONAL">Provisional</option>
              <option value="RESOLVED">Resolved</option>
              <option value="RULED_OUT">Ruled out</option>
            </select>
          </Field>
          <Field label="Diagnosed on">
            <input
              type="date"
              className="field"
              {...form.register("diagnosedAt")}
            />
          </Field>
        </>
      )}

      {resource === "lab-report" && (
        <>
          <Field
            label="Test name"
            error={form.formState.errors.testName?.message}
          >
            <input
              className="field"
              placeholder="CBC, HbA1c, X-Ray..."
              {...form.register("testName")}
            />
          </Field>
          <Field label="External report number">
            <input
              className="field"
              placeholder="Auto-generated when blank"
              {...form.register("reportNumber")}
            />
          </Field>
          <Field label="Laboratory">
            <input className="field" {...form.register("labName")} />
          </Field>
          <Field label="Status">
            <select className="field" {...form.register("status")}>
              <option value="ORDERED">Ordered</option>
              <option value="SAMPLE_COLLECTED">Sample collected</option>
              <option value="PROCESSING">Processing</option>
              <option value="FINAL">Final</option>
              <option value="AMENDED">Amended</option>
            </select>
          </Field>
          <Field label="Ordered on">
            <input
              type="date"
              className="field"
              {...form.register("orderedAt")}
            />
          </Field>
          <label className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-rose-600"
              {...form.register("abnormal")}
            />
            Contains abnormal result
          </label>
          <Field label="Interpretation" wide>
            <textarea
              className="field min-h-24 py-3"
              {...form.register("interpretation")}
            />
          </Field>
        </>
      )}

      {resource === "vaccination" && (
        <>
          <Field
            label="Vaccine"
            error={form.formState.errors.vaccineName?.message}
          >
            <input className="field" {...form.register("vaccineName")} />
          </Field>
          <Field label="Disease / indication">
            <input className="field" {...form.register("disease")} />
          </Field>
          <Field label="Dose">
            <input
              className="field"
              placeholder="1, 2, Booster..."
              {...form.register("doseNumber")}
            />
          </Field>
          <Field label="Batch / lot">
            <input className="field" {...form.register("lotNumber")} />
          </Field>
          <Field label="Manufacturer">
            <input className="field" {...form.register("manufacturer")} />
          </Field>
          <Field
            label="Administered on"
            error={form.formState.errors.administeredAt?.message}
          >
            <input
              type="date"
              className="field"
              {...form.register("administeredAt")}
            />
          </Field>
          <Field label="Next dose">
            <input
              type="date"
              className="field"
              {...form.register("nextDoseAt")}
            />
          </Field>
        </>
      )}

      {resource === "insurance" && (
        <>
          <Field
            label="Provider"
            error={form.formState.errors.providerName?.message}
          >
            <input className="field" {...form.register("providerName")} />
          </Field>
          <Field label="Plan">
            <input className="field" {...form.register("planName")} />
          </Field>
          <Field
            label="Policy number"
            error={form.formState.errors.policyNumber?.message}
          >
            <input className="field" {...form.register("policyNumber")} />
          </Field>
          <Field
            label="Policy holder"
            error={form.formState.errors.policyHolder?.message}
          >
            <input className="field" {...form.register("policyHolder")} />
          </Field>
          <Field label="Status">
            <select className="field" {...form.register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </Field>
          <Field label="Coverage amount">
            <input
              type="number"
              step=".01"
              className="field"
              {...form.register("coverageAmount")}
            />
          </Field>
          <Field label="Copay">
            <input
              type="number"
              step=".01"
              className="field"
              {...form.register("copayAmount")}
            />
          </Field>
          <Field label="Valid from">
            <input
              type="date"
              className="field"
              {...form.register("validFrom")}
            />
          </Field>
          <Field label="Valid until">
            <input
              type="date"
              className="field"
              {...form.register("validUntil")}
            />
          </Field>
        </>
      )}

      {resource === "follow-up" && (
        <>
          <Field
            label="Due date and time"
            error={form.formState.errors.dueAt?.message}
          >
            <input
              type="datetime-local"
              className="field"
              {...form.register("dueAt")}
            />
          </Field>
          <Field label="Priority">
            <select className="field" {...form.register("priority")}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </Field>
          <Field label="Channel">
            <select className="field" {...form.register("channel")}>
              <option value="PHONE">Phone</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="IN_PERSON">In person</option>
            </select>
          </Field>
          <Field
            label="Reason"
            error={form.formState.errors.reason?.message}
            wide
          >
            <textarea
              className="field min-h-24 py-3"
              {...form.register("reason")}
            />
          </Field>
        </>
      )}

      {resource === "note" && (
        <>
          <Field label="Note type">
            <select className="field" {...form.register("noteType")}>
              <option value="CONSULTATION">Consultation</option>
              <option value="PROGRESS">Progress</option>
              <option value="MEDICAL_HISTORY">Medical history</option>
              <option value="LAB_RESULT">Lab result</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Title" error={form.formState.errors.title?.message}>
            <input className="field" {...form.register("title")} />
          </Field>
          <Field
            label="Clinical note"
            error={form.formState.errors.summary?.message}
            wide
          >
            <textarea
              className="field min-h-40 py-3"
              {...form.register("summary")}
            />
          </Field>
        </>
      )}

      {resource === "payment" && (
        <>
          <Field
            label="Invoice"
            error={form.formState.errors.invoiceId?.message}
            wide
          >
            <select className="field" {...form.register("invoiceId")}>
              <option value="">Select outstanding invoice</option>
              {payableInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} · Balance ₱
                  {(
                    Number(invoice.total) - Number(invoice.paid)
                  ).toLocaleString("en-PH")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount" error={form.formState.errors.amount?.message}>
            <input
              type="number"
              step=".01"
              className="field"
              {...form.register("amount")}
            />
          </Field>
          <Field label="Payment method">
            <select className="field" {...form.register("method")}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="GCASH">GCash</option>
              <option value="MAYA">Maya</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CREDIT">Credit</option>
              <option value="SPLIT">Split</option>
            </select>
          </Field>
          <Field label="Transaction reference">
            <input
              className="field"
              {...form.register("transactionReference")}
            />
          </Field>
        </>
      )}

      {!["lab-report", "note", "follow-up"].includes(resource) && (
        <Field label="Notes" wide>
          <textarea
            className="field min-h-24 py-3"
            {...form.register("notes")}
          />
        </Field>
      )}

      <div className="col-span-full flex justify-end border-t border-line pt-4">
        <button className="btn-primary" disabled={mutation.isPending}>
          <Save size={15} />
          {mutation.isPending ? "Saving..." : "Save to patient record"}
        </button>
      </div>
    </form>
  );
}

function requestFor(
  resource: PatientResource,
  patientId: string,
  values: FormValues,
) {
  const optionalNumber = (value?: string) =>
    value ? Number(value) : undefined;
  const common = {
    ...(values.appointmentId ? { appointmentId: values.appointmentId } : {}),
  };
  const paths: Record<PatientResource, string> = {
    "medical-history": "medical-history",
    allergy: "allergies",
    vital: "vitals",
    diagnosis: "diagnoses",
    "lab-report": "lab-reports",
    vaccination: "vaccinations",
    insurance: "insurance",
    "follow-up": "follow-ups",
    note: "notes",
    payment: "payments",
  };
  let payload: Record<string, unknown>;
  switch (resource) {
    case "medical-history":
      payload = {
        ...common,
        condition: values.condition,
        category: values.category || undefined,
        status: values.status || "ACTIVE",
        diagnosedOn: values.diagnosedOn || undefined,
        isChronic: Boolean(values.isChronic),
        treatment: values.treatment || undefined,
        notes: values.notes || undefined,
      };
      break;
    case "allergy":
      payload = {
        ...common,
        allergen: values.allergen,
        allergyType: values.allergyType,
        severity: values.severity || "MODERATE",
        status: "ACTIVE",
        reaction: values.reaction || undefined,
        onsetDate: values.onsetDate || undefined,
        notes: values.notes || undefined,
      };
      break;
    case "vital":
      payload = {
        ...common,
        systolicBp: optionalNumber(values.systolicBp),
        diastolicBp: optionalNumber(values.diastolicBp),
        heartRate: optionalNumber(values.heartRate),
        respiratoryRate: optionalNumber(values.respiratoryRate),
        temperatureCelsius: optionalNumber(values.temperatureCelsius),
        oxygenSaturation: optionalNumber(values.oxygenSaturation),
        heightCm: optionalNumber(values.heightCm),
        weightKg: optionalNumber(values.weightKg),
        bloodGlucoseMgDl: optionalNumber(values.bloodGlucoseMgDl),
        painScore: optionalNumber(values.painScore),
        notes: values.notes || undefined,
      };
      break;
    case "diagnosis":
      payload = {
        ...common,
        name: values.name,
        code: values.code || undefined,
        diagnosisType: values.diagnosisType || "PRIMARY",
        status: values.status || "CONFIRMED",
        diagnosedAt: values.diagnosedAt || undefined,
        notes: values.notes || undefined,
      };
      break;
    case "lab-report":
      payload = {
        ...common,
        testName: values.testName,
        reportNumber: values.reportNumber || undefined,
        labName: values.labName || undefined,
        status: values.status || "ORDERED",
        orderedAt: values.orderedAt || undefined,
        abnormal: Boolean(values.abnormal),
        interpretation: values.interpretation || undefined,
        results: {},
        notes: values.notes || undefined,
      };
      break;
    case "vaccination":
      payload = {
        ...common,
        vaccineName: values.vaccineName,
        disease: values.disease || undefined,
        doseNumber: values.doseNumber || undefined,
        lotNumber: values.lotNumber || undefined,
        manufacturer: values.manufacturer || undefined,
        administeredAt: values.administeredAt,
        nextDoseAt: values.nextDoseAt || undefined,
        notes: values.notes || undefined,
      };
      break;
    case "insurance":
      payload = {
        providerName: values.providerName,
        planName: values.planName || undefined,
        policyNumber: values.policyNumber,
        policyHolder: values.policyHolder,
        status: values.status || "ACTIVE",
        validFrom: values.validFrom || undefined,
        validUntil: values.validUntil || undefined,
        coverageAmount: optionalNumber(values.coverageAmount),
        copayAmount: optionalNumber(values.copayAmount),
        metadata: {},
        notes: values.notes || undefined,
      };
      break;
    case "follow-up":
      payload = {
        ...common,
        dueAt: values.dueAt,
        reason: values.reason,
        priority: values.priority || "NORMAL",
        channel: values.channel || undefined,
        notes: values.notes || undefined,
      };
      break;
    case "note":
      payload = {
        noteType: values.noteType,
        title: values.title,
        summary: values.summary,
        details: {},
      };
      break;
    case "payment":
      payload = {
        invoiceId: values.invoiceId,
        amount: Number(values.amount),
        method: values.method,
        transactionReference: values.transactionReference || undefined,
        notes: values.notes || undefined,
      };
      break;
  }
  return {
    path: `/practice/patients/${patientId}/${paths[resource]}`,
    payload,
  };
}

function Field({
  label,
  error,
  wide,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={wide ? "sm:col-span-2" : undefined}>
      <legend className="field-label">{label}</legend>
      {children}
      <ErrorText value={error} />
    </fieldset>
  );
}

function ErrorText({ value }: { value?: string }) {
  return value ? (
    <span className="mt-1 block text-xs text-rose-600">{value}</span>
  ) : null;
}
