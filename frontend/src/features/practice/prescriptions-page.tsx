import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FilePlus2,
  Pill,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import {
  cloneElement,
  type ReactElement,
  useEffect,
  useId,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { EmptyRows, PageHeader } from "@/components/ui/page";
import { api, apiEnvelope } from "@/lib/api";
import { practiceKeys, usePracticeOptions } from "./practice-queries";
import type { Prescription, PrescriptionItem } from "./types";

type DraftItem = Omit<PrescriptionItem, "id"> & { draftId: string };
const emptyItem = (): DraftItem => ({
  draftId: crypto.randomUUID(),
  medicineName: "",
  dosage: "",
  frequency: "",
  durationDays: 5,
  quantity: 1,
  instructions: "",
});

export function PrescriptionsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [doctorMembershipId, setDoctorMembershipId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const options = usePracticeOptions();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: practiceKeys.prescriptions(search),
    queryFn: () =>
      apiEnvelope<Prescription[]>(
        `/practice/prescriptions?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
      ),
  });
  useEffect(() => {
    const nextPatientId = searchParams.get("patientId");
    const nextAppointmentId = searchParams.get("appointmentId");
    const nextDoctorId = searchParams.get("doctorId");
    if (!nextPatientId) return;
    setPatientId(nextPatientId);
    setAppointmentId(nextAppointmentId ?? "");
    setDoctorMembershipId(nextDoctorId ?? "");
    setOpen(true);
  }, [searchParams]);
  const create = useMutation({
    mutationFn: () =>
      api<Prescription>("/practice/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          doctorMembershipId,
          appointmentId: appointmentId || undefined,
          diagnosis: diagnosis || undefined,
          notes: notes || undefined,
          items: items.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            medicineId: item.medicineId || undefined,
            durationDays: item.durationDays || undefined,
            quantity: item.quantity || undefined,
            instructions: item.instructions || undefined,
          })),
        }),
      }),
    onSuccess: () => {
      toast.success("Prescription issued");
      setOpen(false);
      reset();
      void client.invalidateQueries({ queryKey: practiceKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "COMPLETED" | "CANCELLED";
    }) =>
      api(`/practice/prescriptions/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: practiceKeys.all }),
    onError: (error) => toast.error(error.message),
  });

  const reset = () => {
    setPatientId("");
    setDoctorMembershipId("");
    setAppointmentId("");
    setDiagnosis("");
    setNotes("");
    setItems([emptyItem()]);
  };
  const updateItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  const valid =
    patientId &&
    doctorMembershipId &&
    items.every(
      (item) =>
        item.medicineName.trim().length > 1 &&
        item.dosage.trim() &&
        item.frequency.trim(),
    );

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        description="Create structured prescriptions, review medicine instructions and print patient copies."
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <FilePlus2 size={16} />
            New prescription
          </button>
        }
      />
      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-line px-3 sm:max-w-sm">
            <Search size={16} className="text-slate-400" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient, RX number or diagnosis..."
            />
          </label>
          <span className="ml-auto text-xs text-slate-500">
            {query.data?.meta?.total ?? 0} prescriptions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Prescription</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Issued</th>
                <th>Medicines</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data?.data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold text-blue-700">
                      {row.prescriptionNumber}
                    </div>
                    <div className="mt-1 max-w-52 truncate text-xs text-slate-400">
                      {row.diagnosis || "No diagnosis recorded"}
                    </div>
                  </td>
                  <td>
                    <Link
                      to={`/patients/${row.patient.id}`}
                      className="font-medium text-slate-900 hover:text-blue-700"
                    >
                      {row.patient.name}
                    </Link>
                    <div className="text-xs text-slate-400">
                      {row.patient.patientCode}
                    </div>
                  </td>
                  <td>Dr. {row.doctor.user.fullName}</td>
                  <td>{new Date(row.issuedAt).toLocaleDateString("en-PH")}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {row.items.slice(0, 2).map((item) => (
                        <span
                          key={item.id}
                          className="rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-700"
                        >
                          {item.medicineName}
                        </span>
                      ))}
                      {row.items.length > 2 && (
                        <span className="text-xs text-slate-400">
                          +{row.items.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Status value={row.status} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => window.print()}
                        className="icon-button"
                        aria-label="Print prescription"
                      >
                        <Printer size={15} />
                      </button>
                      {row.status === "ACTIVE" && (
                        <button
                          onClick={() =>
                            updateStatus.mutate({
                              id: row.id,
                              status: "COMPLETED",
                            })
                          }
                          className="icon-button text-emerald-600"
                          aria-label="Mark completed"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!query.data?.data.length && (
                <EmptyRows
                  columns={7}
                  loading={query.isLoading}
                  label="No prescriptions found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Issue prescription"
        description="Create a clear, printable medicine plan for the patient."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select
              className="field"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
            >
              <option value="">Select patient</option>
              {options.patients.data?.data.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} · {patient.patientCode}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prescribing doctor">
            <select
              className="field"
              value={doctorMembershipId}
              onChange={(event) => setDoctorMembershipId(event.target.value)}
            >
              <option value="">Select doctor</option>
              {options.doctors.data?.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.user.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Diagnosis">
            <input
              className="field"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="Clinical diagnosis"
            />
          </Field>
          <Field label="Notes">
            <input
              className="field"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Advice or follow-up"
            />
          </Field>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
          <div>
            <h3 className="font-semibold text-slate-900">Medicines</h3>
            <p className="text-xs text-slate-500">
              Add dosage, frequency and duration.
            </p>
          </div>
          <button
            className="btn-secondary px-3! py-2!"
            onClick={() => setItems((rows) => [...rows, emptyItem()])}
          >
            <Plus size={14} />
            Add medicine
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <article
              key={item.draftId}
              className="rounded-xl border border-line bg-slate-50/60 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
                  <Pill size={15} />
                </span>
                <span className="text-sm font-semibold">
                  Medicine {index + 1}
                </span>
                {items.length > 1 && (
                  <button
                    onClick={() =>
                      setItems((rows) =>
                        rows.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                    className="ml-auto text-rose-500"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Medicine">
                  <select
                    className="field bg-white!"
                    value={item.medicineId ?? ""}
                    onChange={(event) => {
                      const selected = options.medicines.data?.data.find(
                        (row) => row.medicine.id === event.target.value,
                      );
                      updateItem(index, {
                        medicineId: event.target.value || undefined,
                        medicineName: selected
                          ? `${selected.medicine.brandName} ${selected.medicine.strength}`
                          : item.medicineName,
                      });
                    }}
                  >
                    <option value="">Custom medicine</option>
                    {options.medicines.data?.data.map((row) => (
                      <option key={row.id} value={row.medicine.id}>
                        {row.medicine.brandName} · {row.medicine.strength}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Medicine name">
                  <input
                    className="field bg-white!"
                    value={item.medicineName}
                    onChange={(event) =>
                      updateItem(index, { medicineName: event.target.value })
                    }
                  />
                </Field>
                <Field label="Dosage">
                  <input
                    className="field bg-white!"
                    value={item.dosage}
                    onChange={(event) =>
                      updateItem(index, { dosage: event.target.value })
                    }
                    placeholder="1 tablet"
                  />
                </Field>
                <Field label="Frequency">
                  <input
                    className="field bg-white!"
                    value={item.frequency}
                    onChange={(event) =>
                      updateItem(index, { frequency: event.target.value })
                    }
                    placeholder="Twice daily after meals"
                  />
                </Field>
                <Field label="Duration (days)">
                  <input
                    type="number"
                    min={1}
                    className="field bg-white!"
                    value={item.durationDays ?? ""}
                    onChange={(event) =>
                      updateItem(index, {
                        durationDays: Number(event.target.value) || undefined,
                      })
                    }
                  />
                </Field>
                <Field label="Quantity">
                  <input
                    type="number"
                    min={1}
                    className="field bg-white!"
                    value={item.quantity ?? ""}
                    onChange={(event) =>
                      updateItem(index, {
                        quantity: Number(event.target.value) || undefined,
                      })
                    }
                  />
                </Field>
                <label className="sm:col-span-2">
                  <span className="field-label">Instructions</span>
                  <input
                    className="field bg-white!"
                    value={item.instructions ?? ""}
                    onChange={(event) =>
                      updateItem(index, { instructions: event.target.value })
                    }
                    placeholder="Avoid driving, complete the full course..."
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
          <button className="btn-secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!valid || create.isPending}
            onClick={() => create.mutate()}
          >
            <FilePlus2 size={16} />
            {create.isPending ? "Issuing..." : "Issue prescription"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
}) {
  const id = useId();
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}

function Status({ value }: { value: Prescription["status"] }) {
  const style =
    value === "ACTIVE"
      ? "bg-blue-50 text-blue-700"
      : value === "COMPLETED"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-rose-50 text-rose-700";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {value}
    </span>
  );
}
