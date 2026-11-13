import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  Coins,
  CreditCard,
  Download,
  FileText,
  FlaskConical,
  HeartPulse,
  History,
  MapPin,
  Phone,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { PatientResource } from "./patient-record-form";
import type { PatientTab } from "./patient-record-page";
import { practiceKeys } from "./practice-queries";
import type {
  Allergy,
  Diagnosis,
  FollowUp,
  LabReport,
  MedicalHistory,
  PatientRecord,
  TimelineEvent,
  Vaccination,
  Vital,
} from "./types";

export function PatientRecordContent({
  tab,
  patient,
  canWrite,
  onAdd,
}: {
  tab: PatientTab;
  patient: PatientRecord;
  canWrite: boolean;
  onAdd: (resource: PatientResource) => void;
}) {
  switch (tab) {
    case "overview":
      return <Overview patient={patient} onAdd={onAdd} canWrite={canWrite} />;
    case "appointments":
      return <Appointments patient={patient} />;
    case "doctors":
      return <Doctors patient={patient} />;
    case "prescriptions":
      return <Prescriptions patient={patient} />;
    case "diagnoses":
      return <Diagnoses rows={patient.diagnoses} />;
    case "labs":
      return <LabReports rows={patient.labReports} />;
    case "billing":
      return <Billing patient={patient} />;
    case "documents":
      return <Documents patient={patient} />;
    case "vitals":
      return <Vitals rows={patient.vitals} />;
    case "history":
      return <MedicalHistoryList rows={patient.medicalHistories} />;
    case "allergies":
      return <Allergies rows={patient.allergies} />;
    case "vaccinations":
      return <Vaccinations rows={patient.vaccinations} />;
    case "followups":
      return <FollowUps patient={patient} canWrite={canWrite} />;
    case "notes":
      return <Notes patient={patient} />;
    case "timeline":
      return <Timeline rows={patient.timeline} />;
  }
}

function Overview({
  patient,
  canWrite,
  onAdd,
}: {
  patient: PatientRecord;
  canWrite: boolean;
  onAdd: (resource: PatientResource) => void;
}) {
  const latestVital = patient.vitals[0];
  const nextAppointment = [...patient.appointments]
    .filter(
      (item) =>
        new Date(item.startsAt) >= new Date() &&
        !["CANCELLED", "NO_SHOW"].includes(item.status),
    )
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    )[0];
  const activeInsurance = patient.insurancePolicies.find(
    (item) => item.status === "ACTIVE",
  );
  const activeConditions = patient.medicalHistories.filter(
    (item) => item.status === "ACTIVE",
  );
  const activeAllergies = patient.allergies.filter(
    (item) => item.status === "ACTIVE",
  );
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <div className="space-y-5">
        <Section
          title="Personal details"
          subtitle="Identity, demographics and emergency contact"
        >
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Patient ID" value={patient.patientCode} />
            <Info
              label="Date of birth"
              value={
                patient.dateOfBirth
                  ? format(new Date(patient.dateOfBirth), "d MMM yyyy")
                  : "Not recorded"
              }
            />
            <Info label="Gender" value={patient.gender || "Not recorded"} />
            <Info
              label="Blood group"
              value={patient.bloodGroup || "Not recorded"}
            />
            <Info
              label="Marital status"
              value={patient.maritalStatus || "Not recorded"}
            />
            <Info
              label="Occupation"
              value={patient.occupation || "Not recorded"}
            />
            <Info
              label="Language"
              value={patient.preferredLanguage || "Not recorded"}
            />
            <Info label="Phone" value={patient.phone || "Not recorded"} />
            <Info label="Email" value={patient.email || "Not recorded"} />
          </dl>
          {patient.emergencyContact && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Phone size={18} className="text-amber-700" />
              <div>
                <div className="text-xs font-semibold text-amber-900">
                  Emergency contact
                </div>
                <div className="mt-1 text-sm text-amber-800">
                  {patient.emergencyContact.name} ·{" "}
                  {patient.emergencyContact.relationship || "Contact"} ·{" "}
                  {patient.emergencyContact.phone}
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section
          title="Clinical snapshot"
          subtitle="Active risks and current care context"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Snapshot
              icon={AlertTriangle}
              tone={
                activeAllergies.length
                  ? "bg-rose-50 text-rose-700"
                  : "bg-emerald-50 text-emerald-700"
              }
              label="Active allergies"
              value={activeAllergies.length}
              detail={
                activeAllergies
                  .slice(0, 2)
                  .map((item) => item.allergen)
                  .join(", ") || "None recorded"
              }
              action={canWrite ? () => onAdd("allergy") : undefined}
            />
            <Snapshot
              icon={Stethoscope}
              tone="bg-blue-50 text-blue-700"
              label="Active conditions"
              value={activeConditions.length}
              detail={
                activeConditions
                  .slice(0, 2)
                  .map((item) => item.condition)
                  .join(", ") || "None recorded"
              }
              action={canWrite ? () => onAdd("medical-history") : undefined}
            />
            <Snapshot
              icon={HeartPulse}
              tone="bg-violet-50 text-violet-700"
              label="Latest vitals"
              value={
                latestVital
                  ? format(new Date(latestVital.recordedAt), "d MMM")
                  : "—"
              }
              detail={
                latestVital ? vitalSummary(latestVital) : "No vitals recorded"
              }
              action={canWrite ? () => onAdd("vital") : undefined}
            />
          </div>
        </Section>

        <Section
          title="Recent patient timeline"
          subtitle="Latest activity across the complete record"
        >
          <Timeline rows={patient.timeline.slice(0, 6)} compact />
        </Section>
      </div>

      <aside className="space-y-5">
        <Section title="Next appointment">
          {nextAppointment ? (
            <div>
              <div className="text-xl font-bold text-slate-900">
                {format(new Date(nextAppointment.startsAt), "d MMM yyyy")}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {format(new Date(nextAppointment.startsAt), "h:mm a")} · Dr.{" "}
                {nextAppointment.doctor.user.fullName}
              </div>
              <Link
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-700"
                to={`/appointments/${nextAppointment.id}`}
              >
                Open encounter <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <Empty label="No upcoming appointment." />
          )}
        </Section>
        <Section title="Insurance">
          {activeInsurance ? (
            <div>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <div className="font-semibold">
                    {activeInsurance.providerName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {activeInsurance.planName || activeInsurance.policyNumber}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Info label="Policy" value={activeInsurance.policyNumber} />
                <Info
                  label="Valid until"
                  value={
                    activeInsurance.validUntil
                      ? format(
                          new Date(activeInsurance.validUntil),
                          "d MMM yyyy",
                        )
                      : "Open"
                  }
                />
              </div>
            </div>
          ) : (
            <Empty label="No active insurance policy." />
          )}
        </Section>
        <Section title="Account">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600">
              <Coins size={18} />
            </span>
            <div>
              <div className="text-xs text-slate-500">Outstanding balance</div>
              <div className="text-2xl font-bold">
                ₱{Number(patient.accountBalance).toLocaleString("en-PH")}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            {patient.invoices.length} invoices · {patient.payments.length}{" "}
            payment receipts
          </div>
        </Section>
        {patient.address && (
          <Section title="Address">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <MapPin size={17} className="mt-0.5 shrink-0 text-slate-400" />
              <span>
                {Object.values(patient.address).filter(Boolean).join(", ")}
              </span>
            </div>
          </Section>
        )}
      </aside>
    </div>
  );
}

function Appointments({ patient }: { patient: PatientRecord }) {
  return (
    <Section
      title="Appointment history"
      subtitle={`${patient.appointments.length} visits across the patient lifecycle`}
      flush
    >
      <div className="divide-y divide-line">
        {patient.appointments.map((row) => (
          <article
            key={row.id}
            className="flex flex-col gap-3 p-5 md:flex-row md:items-center"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <CalendarDays size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900">
                {format(new Date(row.startsAt), "d MMM yyyy, h:mm a")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Dr. {row.doctor.user.fullName} · {row.type.replaceAll("_", " ")}
              </div>
              {(row.symptoms || row.reason) && (
                <div className="mt-2 line-clamp-2 text-xs text-slate-600">
                  {row.symptoms || row.reason}
                </div>
              )}
            </div>
            <Status value={row.status} />
            <Link
              className="btn-secondary px-3! py-2!"
              to={`/appointments/${row.id}`}
            >
              Encounter <ArrowRight size={13} />
            </Link>
          </article>
        ))}
        {!patient.appointments.length && (
          <Empty label="No appointments recorded." />
        )}
      </div>
    </Section>
  );
}

function Doctors({ patient }: { patient: PatientRecord }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {patient.doctorsConsulted.map((doctor) => (
        <Link
          key={doctor.id}
          to={`/doctors/${doctor.id}`}
          className="card p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <UsersRound size={20} />
            </span>
            <div>
              <div className="font-semibold text-slate-900">
                Dr. {doctor.user.fullName}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {doctor.user.email}
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Info label="Consultations" value={String(doctor.visits)} />
            <Info
              label="Last consulted"
              value={format(new Date(doctor.lastConsultedAt), "d MMM yyyy")}
            />
          </div>
        </Link>
      ))}
      {!patient.doctorsConsulted.length && (
        <div className="card md:col-span-2 xl:col-span-3">
          <Empty label="No doctor consultations recorded." />
        </div>
      )}
    </div>
  );
}

function Prescriptions({ patient }: { patient: PatientRecord }) {
  return (
    <Section title="Prescription history" flush>
      <div className="divide-y divide-line">
        {patient.prescriptions.map((row) => (
          <article key={row.id} className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
                <Pill size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">
                  {row.prescriptionNumber}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {format(new Date(row.issuedAt), "d MMM yyyy")} · Dr.{" "}
                  {row.doctor.user.fullName}
                </div>
              </div>
              <Status value={row.status} />
            </div>
            {row.diagnosis && (
              <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Diagnosis: {row.diagnosis}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {row.items.map((item) => (
                <span
                  key={item.id}
                  className="rounded-lg border border-line bg-slate-50 px-3 py-2 text-xs"
                >
                  <strong>{item.medicineName}</strong> · {item.dosage} ·{" "}
                  {item.frequency}
                  {item.durationDays ? ` · ${item.durationDays} days` : ""}
                </span>
              ))}
            </div>
          </article>
        ))}
        {!patient.prescriptions.length && (
          <Empty label="No prescriptions recorded." />
        )}
      </div>
    </Section>
  );
}

function Diagnoses({ rows }: { rows: Diagnosis[] }) {
  return (
    <RecordGrid empty="No diagnoses recorded.">
      {rows.map((row) => (
        <RecordCard
          key={row.id}
          icon={Stethoscope}
          title={row.name}
          status={row.status}
          date={row.diagnosedAt}
          author={row.recordedBy.fullName}
        >
          <div className="text-xs text-slate-500">
            {[row.code, row.diagnosisType.replaceAll("_", " ")]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {row.notes && (
            <p className="mt-3 text-sm leading-6 text-slate-600">{row.notes}</p>
          )}
        </RecordCard>
      ))}
    </RecordGrid>
  );
}

function LabReports({ rows }: { rows: LabReport[] }) {
  return (
    <RecordGrid empty="No lab reports recorded.">
      {rows.map((row) => (
        <RecordCard
          key={row.id}
          icon={FlaskConical}
          title={row.testName}
          status={row.abnormal ? "ABNORMAL" : row.status}
          date={row.reportedAt || row.orderedAt}
          author={row.recordedBy.fullName}
          danger={row.abnormal}
        >
          <div className="text-xs text-slate-500">
            {row.reportNumber}
            {row.labName ? ` · ${row.labName}` : ""}
          </div>
          {row.interpretation && (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {row.interpretation}
            </p>
          )}
        </RecordCard>
      ))}
    </RecordGrid>
  );
}

function Billing({ patient }: { patient: PatientRecord }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Section
        title="Invoices"
        subtitle={`Outstanding ₱${Number(patient.accountBalance).toLocaleString("en-PH")}`}
        flush
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right!">Total</th>
                <th className="text-right!">Paid</th>
                <th className="text-right!">Balance</th>
              </tr>
            </thead>
            <tbody>
              {patient.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-semibold! text-blue-700!">
                    {invoice.invoiceNumber}
                  </td>
                  <td>
                    {invoice.issuedAt
                      ? format(new Date(invoice.issuedAt), "d MMM yyyy")
                      : "Draft"}
                  </td>
                  <td>
                    <Status value={invoice.status} />
                  </td>
                  <td className="text-right!">
                    ₱{Number(invoice.total).toLocaleString("en-PH")}
                  </td>
                  <td className="text-right!">
                    ₱{Number(invoice.paid).toLocaleString("en-PH")}
                  </td>
                  <td className="text-right! font-semibold!">
                    ₱
                    {(
                      Number(invoice.total) - Number(invoice.paid)
                    ).toLocaleString("en-PH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!patient.invoices.length && <Empty label="No invoices recorded." />}
        </div>
      </Section>
      <Section
        title="Payment receipts"
        subtitle={`${patient.payments.length} recorded payments`}
        flush
      >
        <div className="divide-y divide-line">
          {patient.payments.map((payment) => (
            <div key={payment.id} className="p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CreditCard size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {payment.receiptNumber}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {payment.invoice?.invoiceNumber || "Invoice"} ·{" "}
                    {format(new Date(payment.paidAt), "d MMM yyyy, h:mm a")}
                  </div>
                </div>
                <div className="text-sm font-bold">
                  ₱{Number(payment.amount).toLocaleString("en-PH")}
                </div>
              </div>
            </div>
          ))}
          {!patient.payments.length && <Empty label="No payments recorded." />}
        </div>
      </Section>
    </div>
  );
}

function Documents({ patient }: { patient: PatientRecord }) {
  const download = async (id: string) => {
    try {
      const result = await api<{ url: string }>(`/documents/${id}/download`);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Document download failed",
      );
    }
  };
  return (
    <Section
      title="Patient documents"
      subtitle="Reports, prescriptions, insurance and clinical attachments"
      flush
    >
      <div className="divide-y divide-line">
        {patient.documents.map((document) => (
          <div key={document.id} className="flex items-center gap-3 p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
              <FileText size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {document.originalName}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {document.category.replaceAll("-", " ")} ·{" "}
                {format(new Date(document.createdAt), "d MMM yyyy")} ·{" "}
                {document.uploadedBy.fullName}
              </div>
            </div>
            <Status value={document.status} />
            <button
              className="icon-button"
              aria-label={`Download ${document.originalName}`}
              onClick={() => void download(document.id)}
              disabled={document.status !== "AVAILABLE"}
            >
              <Download size={15} />
            </button>
          </div>
        ))}
        {!patient.documents.length && (
          <Empty label="No patient documents uploaded." />
        )}
      </div>
    </Section>
  );
}

function Vitals({ rows }: { rows: Vital[] }) {
  const chart = [...rows]
    .slice(0, 12)
    .reverse()
    .map((row) => ({
      date: format(new Date(row.recordedAt), "d MMM"),
      systolic: row.systolicBp,
      diastolic: row.diastolicBp,
      pulse: row.heartRate,
      weight: Number(row.weightKg || 0) || undefined,
    }));
  return (
    <div className="space-y-5">
      {chart.length > 1 && (
        <Section
          title="Vitals trend"
          subtitle="Recent longitudinal measurements"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <CartesianGrid vertical={false} stroke="#e9eef5" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="pulse"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}
      <RecordGrid empty="No vitals recorded.">
        {rows.map((row) => (
          <RecordCard
            key={row.id}
            icon={HeartPulse}
            title={vitalSummary(row) || "Vitals recorded"}
            date={row.recordedAt}
            author={row.recordedBy.fullName}
          >
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Mini
                label="Oxygen"
                value={row.oxygenSaturation ? `${row.oxygenSaturation}%` : "—"}
              />
              <Mini
                label="Weight"
                value={row.weightKg ? `${row.weightKg} kg` : "—"}
              />
              <Mini label="BMI" value={row.bmi ? String(row.bmi) : "—"} />
              <Mini
                label="Pain"
                value={
                  row.painScore !== undefined ? `${row.painScore}/10` : "—"
                }
              />
            </div>
          </RecordCard>
        ))}
      </RecordGrid>
    </div>
  );
}

function MedicalHistoryList({ rows }: { rows: MedicalHistory[] }) {
  return (
    <RecordGrid empty="No medical history recorded.">
      {rows.map((row) => (
        <RecordCard
          key={row.id}
          icon={Activity}
          title={row.condition}
          status={row.status}
          date={row.diagnosedOn || row.createdAt}
          author={row.recordedBy.fullName}
        >
          <div className="text-xs text-slate-500">
            {[row.category, row.isChronic ? "Chronic" : null]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {row.treatment && (
            <p className="mt-3 text-sm text-slate-600">
              <strong>Treatment:</strong> {row.treatment}
            </p>
          )}
          {row.notes && (
            <p className="mt-2 text-sm leading-6 text-slate-600">{row.notes}</p>
          )}
        </RecordCard>
      ))}
    </RecordGrid>
  );
}

function Allergies({ rows }: { rows: Allergy[] }) {
  return (
    <RecordGrid empty="No allergies recorded.">
      {rows.map((row) => (
        <RecordCard
          key={row.id}
          icon={AlertTriangle}
          title={row.allergen}
          status={`${row.severity} · ${row.status}`}
          date={row.onsetDate || row.createdAt}
          author={row.recordedBy.fullName}
          danger={["SEVERE", "CRITICAL"].includes(row.severity)}
        >
          <div className="text-xs text-slate-500">
            {row.allergyType.replaceAll("_", " ")}
          </div>
          {row.reaction && (
            <p className="mt-3 text-sm text-slate-600">
              <strong>Reaction:</strong> {row.reaction}
            </p>
          )}
        </RecordCard>
      ))}
    </RecordGrid>
  );
}

function Vaccinations({ rows }: { rows: Vaccination[] }) {
  return (
    <RecordGrid empty="No vaccinations recorded.">
      {rows.map((row) => (
        <RecordCard
          key={row.id}
          icon={Syringe}
          title={row.vaccineName}
          date={row.administeredAt}
          author={row.recordedBy.fullName}
        >
          <div className="text-xs text-slate-500">
            {[
              row.disease,
              row.doseNumber ? `Dose ${row.doseNumber}` : null,
              row.manufacturer,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {row.nextDoseAt && (
            <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              Next dose: {format(new Date(row.nextDoseAt), "d MMM yyyy")}
            </div>
          )}
        </RecordCard>
      ))}
    </RecordGrid>
  );
}

function FollowUps({
  patient,
  canWrite,
}: {
  patient: PatientRecord;
  canWrite: boolean;
}) {
  const client = useQueryClient();
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FollowUp["status"] }) =>
      api(`/practice/patients/${patient.id}/follow-ups/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success("Follow-up updated");
      void client.invalidateQueries({
        queryKey: practiceKeys.patientRecord(patient.id),
      });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <RecordGrid empty="No follow-ups recorded.">
      {patient.followUps.map((row) => (
        <RecordCard
          key={row.id}
          icon={Phone}
          title={row.reason}
          status={`${row.priority} · ${row.status}`}
          date={row.dueAt}
          author={row.recordedBy.fullName}
          danger={row.priority === "URGENT" && row.status !== "COMPLETED"}
        >
          <div className="text-xs text-slate-500">
            {row.channel?.replaceAll("_", " ") || "Channel not set"}
          </div>
          {row.outcome && (
            <p className="mt-3 text-sm text-slate-600">
              <strong>Outcome:</strong> {row.outcome}
            </p>
          )}
          {canWrite && !["COMPLETED", "CANCELLED"].includes(row.status) && (
            <button
              className="btn-secondary mt-4 px-3! py-2!"
              onClick={() => update.mutate({ id: row.id, status: "COMPLETED" })}
              disabled={update.isPending}
            >
              <Check size={14} />
              Mark completed
            </button>
          )}
        </RecordCard>
      ))}
    </RecordGrid>
  );
}

function Notes({ patient }: { patient: PatientRecord }) {
  return (
    <Section
      title="Clinical notes"
      subtitle="Consultation, progress and supporting notes"
      flush
    >
      <div className="divide-y divide-line">
        {patient.clinicalNotes.map((note) => (
          <article key={note.id} className="p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Status value={note.noteType} />
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">{note.title}</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {note.summary}
                </p>
                <div className="mt-3 text-xs text-slate-400">
                  {format(new Date(note.recordedAt), "d MMM yyyy, h:mm a")} ·{" "}
                  {note.author.fullName}
                </div>
              </div>
            </div>
          </article>
        ))}
        {!patient.clinicalNotes.length && (
          <Empty label="No clinical notes recorded." />
        )}
      </div>
    </Section>
  );
}

function Timeline({
  rows,
  compact = false,
}: {
  rows: TimelineEvent[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "card p-5"}>
      <div className="relative space-y-0 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-line">
        {rows.map((item) => (
          <article
            key={`${item.type}-${item.id}`}
            className="relative flex gap-4 pb-5 last:pb-0"
          >
            <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full border border-blue-100 bg-blue-50 text-blue-700">
              <TimelineIcon type={item.type} />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                    {item.type.replaceAll("_", " ")}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {format(new Date(item.occurredAt), "d MMM yyyy, h:mm a")}
                </div>
              </div>
              {item.description && (
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                  {item.description}
                </p>
              )}
              {item.status && (
                <div className="mt-2">
                  <Status value={item.status} />
                </div>
              )}
              {item.appointmentId && (
                <Link
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700"
                  to={`/appointments/${item.appointmentId}`}
                >
                  View encounter <ArrowRight size={11} />
                </Link>
              )}
            </div>
          </article>
        ))}
        {!rows.length && <Empty label="Patient timeline is empty." />}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  flush = false,
  children,
}: {
  title: string;
  subtitle?: string;
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

function RecordGrid({
  empty,
  children,
}: {
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {children.length ? (
        children
      ) : (
        <div className="card md:col-span-2">
          <Empty label={empty} />
        </div>
      )}
    </div>
  );
}

function RecordCard({
  icon: Icon,
  title,
  status,
  date,
  author,
  danger,
  children,
}: {
  icon: typeof Activity;
  title: string;
  status?: string;
  date: string;
  author: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article className={`card p-5 ${danger ? "border-rose-200" : ""}`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${danger ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}
        >
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            {status && <Status value={status} />}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {format(new Date(date), "d MMM yyyy")} · {author}
          </div>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function Snapshot({
  icon: Icon,
  tone,
  label,
  value,
  detail,
  action,
}: {
  icon: typeof Activity;
  tone: string;
  label: string;
  value: string | number;
  detail: string;
  action?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={action}
      disabled={!action}
      className="rounded-xl border border-line p-4 text-left disabled:cursor-default"
    >
      <span className={`grid size-9 place-items-center rounded-lg ${tone}`}>
        <Icon size={17} />
      </span>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs font-semibold text-slate-700">{label}</div>
      <div className="mt-2 line-clamp-2 text-[11px] text-slate-400">
        {detail}
      </div>
      {action && (
        <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-blue-700">
          <Plus size={11} />
          Add entry
        </div>
      )}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const tone =
    normalized.includes("CRITICAL") ||
    normalized.includes("ABNORMAL") ||
    normalized.includes("OVERDUE") ||
    normalized.includes("CANCEL")
      ? "bg-rose-50 text-rose-700"
      : normalized.includes("PAID") ||
          normalized.includes("COMPLETED") ||
          normalized.includes("ACTIVE") ||
          normalized.includes("CONFIRMED") ||
          normalized.includes("FINAL")
        ? "bg-emerald-50 text-emerald-700"
        : normalized.includes("PENDING") ||
            normalized.includes("PROVISIONAL") ||
            normalized.includes("WAIT")
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="p-8 text-center text-sm text-slate-400">
      <FileText size={24} className="mx-auto mb-2 opacity-40" />
      {label}
    </div>
  );
}

function vitalSummary(row: Vital) {
  return [
    row.systolicBp && row.diastolicBp
      ? `BP ${row.systolicBp}/${row.diastolicBp}`
      : null,
    row.heartRate ? `Pulse ${row.heartRate}` : null,
    row.temperatureCelsius
      ? `${Number(row.temperatureCelsius).toFixed(1)}°C`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function TimelineIcon({ type }: { type: string }) {
  const icons: Record<string, typeof Activity> = {
    APPOINTMENT: CalendarDays,
    PRESCRIPTION: Pill,
    INVOICE: Coins,
    PAYMENT: CreditCard,
    DIAGNOSIS: Stethoscope,
    LAB_REPORT: FlaskConical,
    VACCINATION: Syringe,
    VITALS: HeartPulse,
    DOCUMENT: FileText,
    INSURANCE: ShieldCheck,
    FOLLOW_UP: Phone,
    MEDICAL_HISTORY: History,
    ALLERGY: AlertTriangle,
    NOTE: FileText,
  };
  const Icon = icons[type] ?? Activity;
  return <Icon size={14} />;
}
