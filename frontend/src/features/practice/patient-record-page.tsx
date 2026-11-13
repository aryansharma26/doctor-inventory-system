import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileClock,
  FileText,
  FlaskConical,
  HeartPulse,
  History,
  Mail,
  NotebookPen,
  Phone,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import { PatientRecordForm, type PatientResource } from "./patient-record-form";
import { PatientRecordContent } from "./patient-record-sections";
import { practiceKeys } from "./practice-queries";
import type { PatientRecord } from "./types";

const tabs = [
  { key: "overview", label: "Overview", icon: UserRound },
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "doctors", label: "Doctors consulted", icon: UsersRound },
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "diagnoses", label: "Diagnoses", icon: Stethoscope },
  { key: "labs", label: "Lab reports", icon: FlaskConical },
  { key: "billing", label: "Invoices & payments", icon: CreditCard },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "vitals", label: "Vitals", icon: HeartPulse },
  { key: "history", label: "Medical history", icon: ClipboardList },
  { key: "allergies", label: "Allergies", icon: AlertTriangle },
  { key: "vaccinations", label: "Vaccinations", icon: Syringe },
  { key: "followups", label: "Follow-ups", icon: FileClock },
  { key: "notes", label: "Notes", icon: NotebookPen },
  { key: "timeline", label: "Timeline", icon: History },
] as const;

export type PatientTab = (typeof tabs)[number]["key"];

const tabResource: Partial<Record<PatientTab, PatientResource>> = {
  diagnoses: "diagnosis",
  labs: "lab-report",
  billing: "payment",
  vitals: "vital",
  history: "medical-history",
  allergies: "allergy",
  vaccinations: "vaccination",
  followups: "follow-up",
  notes: "note",
};

const resourceLabel: Record<PatientResource, string> = {
  "medical-history": "medical history",
  allergy: "allergy",
  vital: "vitals",
  diagnosis: "diagnosis",
  "lab-report": "lab report",
  vaccination: "vaccination",
  insurance: "insurance policy",
  "follow-up": "follow-up",
  note: "clinical note",
  payment: "payment",
};

export function PatientRecordPage() {
  const { patientId = "" } = useParams();
  const { identity } = useAuth();
  const [tab, setTab] = useState<PatientTab>("overview");
  const [resource, setResource] = useState<PatientResource | null>(null);
  const query = useQuery({
    queryKey: practiceKeys.patientRecord(patientId),
    queryFn: () => api<PatientRecord>(`/practice/patients/${patientId}/record`),
    enabled: Boolean(patientId),
  });
  const canWrite = Boolean(
    identity?.user.isPlatformAdmin ||
    identity?.permissions.includes("patient_record.write"),
  );
  const patient = query.data;
  const age = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    const birth = new Date(patient.dateOfBirth);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() &&
        today.getDate() < birth.getDate())
    )
      years -= 1;
    return years;
  }, [patient?.dateOfBirth]);

  if (query.isLoading) {
    return (
      <div className="card grid min-h-80 place-items-center text-sm text-slate-500">
        Loading complete patient history...
      </div>
    );
  }
  if (!patient) {
    return (
      <div className="card p-10 text-center">
        <h2 className="font-semibold">Patient record unavailable</h2>
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-blue-700"
          to="/patients"
        >
          Back to patients
        </Link>
      </div>
    );
  }
  const activeAllergies = patient.allergies.filter(
    (item) => item.status === "ACTIVE",
  );
  const openFollowUps = patient.followUps.filter((item) =>
    ["PENDING", "SCHEDULED"].includes(item.status),
  );
  const addResource = tabResource[tab];

  return (
    <div>
      <Link
        to="/patients"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Back to patients
      </Link>

      <section className="overflow-hidden rounded-2xl bg-[#071b4a] text-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl font-bold">
            {patient.name
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{patient.name}</h1>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                Active patient
              </span>
              {activeAllergies.some((item) =>
                ["SEVERE", "CRITICAL"].includes(item.severity),
              ) && (
                <span className="rounded-full bg-rose-400/20 px-2.5 py-1 text-[11px] font-semibold text-rose-100">
                  Critical allergy
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/65">
              <span className="flex items-center gap-1.5">
                <UserRound size={13} />
                {patient.patientCode}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={13} />
                {patient.phone || "No phone"}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail size={13} />
                {patient.email || "No email"}
              </span>
              <span className="flex items-center gap-1.5">
                <Activity size={13} />
                {[
                  age !== null ? `${age} years` : null,
                  patient.gender,
                  patient.bloodGroup,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Demographics incomplete"}
              </span>
            </div>
          </div>
          <div className="grid min-w-72 grid-cols-3 gap-2">
            <HeaderMetric label="Visits" value={patient.appointments.length} />
            <HeaderMetric
              label="Due"
              value={`₱${Number(patient.accountBalance).toLocaleString("en-PH")}`}
            />
            <HeaderMetric label="Follow-ups" value={openFollowUps.length} />
          </div>
        </div>
        <div className="flex overflow-x-auto border-t border-white/10 px-3 sm:px-5">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition",
                tab === key
                  ? "border-orange-400 text-white"
                  : "border-transparent text-white/50 hover:text-white",
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {tabs.find((item) => item.key === tab)?.label}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            All records are clinic-isolated and included in the longitudinal
            timeline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === "overview" && canWrite && (
            <button
              className="btn-secondary"
              onClick={() => setResource("insurance")}
            >
              <ShieldCheck size={15} />
              Add insurance
            </button>
          )}
          {tab === "documents" && (
            <Link
              className="btn-primary"
              to={`/documents?patientId=${patient.id}`}
            >
              <Plus size={15} />
              Upload document
            </Link>
          )}
          {addResource && canWrite && (
            <button
              className="btn-primary"
              onClick={() => setResource(addResource)}
            >
              <Plus size={15} />
              Add {resourceLabel[addResource]}
            </button>
          )}
          {tab === "appointments" && (
            <Link
              className="btn-primary"
              to={`/appointments?patientId=${patient.id}`}
            >
              <CalendarDays size={15} />
              Book appointment
            </Link>
          )}
          {tab === "prescriptions" && (
            <Link
              className="btn-primary"
              to={`/prescriptions?patientId=${patient.id}`}
            >
              <Pill size={15} />
              New prescription
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4">
        <PatientRecordContent
          tab={tab}
          patient={patient}
          canWrite={canWrite}
          onAdd={setResource}
        />
      </div>

      <Modal
        open={Boolean(resource)}
        onClose={() => setResource(null)}
        title={
          resource ? `Add ${resourceLabel[resource]}` : "Add patient record"
        }
        description="This entry becomes part of the patient's permanent longitudinal record."
      >
        {resource && (
          <PatientRecordForm
            resource={resource}
            patient={patient}
            onSaved={() => setResource(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function HeaderMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white/[.07] p-3">
      <div className="text-[9px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-bold">{value}</div>
    </div>
  );
}
