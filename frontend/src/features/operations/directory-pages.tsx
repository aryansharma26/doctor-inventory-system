import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileHeart, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { EmptyRows, PageHeader, TableToolbar } from "@/components/ui/page";
import { api, apiEnvelope } from "@/lib/api";

type Supplier = {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  paymentTerms: number;
  isActive: boolean;
};
type Patient = {
  id: string;
  patientCode: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  occupation?: string;
  preferredLanguage?: string;
  address?: { formatted?: string };
  emergencyContact?: { name: string; relationship?: string; phone: string };
  isActive: boolean;
};
type Expense = {
  id: string;
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
};

const supplierSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email().or(z.literal("")),
  phone: z.string(),
  taxId: z.string(),
  paymentTerms: z.coerce.number().min(0),
});
const patientSchema = z.object({
  patientCode: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email().or(z.literal("")),
  phone: z.string(),
  dateOfBirth: z.string(),
  gender: z.string(),
  bloodGroup: z.string(),
  maritalStatus: z.string(),
  occupation: z.string(),
  preferredLanguage: z.string(),
  address: z.string(),
  emergencyName: z.string(),
  emergencyRelationship: z.string(),
  emergencyPhone: z.string(),
  notes: z.string(),
});
const expenseSchema = z.object({
  expenseDate: z.string(),
  category: z.string().min(2),
  description: z.string().min(2),
  amount: z.coerce.number().positive(),
  paymentMethod: z.string(),
  reference: z.string(),
  notes: z.string(),
});

function useDirectory<T>(path: string, search: string) {
  return useQuery({
    queryKey: [path, search],
    queryFn: () =>
      apiEnvelope<T[]>(
        `${path}?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
      ),
  });
}

export function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const query = useDirectory<Supplier>("/suppliers", search);
  const client = useQueryClient();
  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: "",
      name: "",
      email: "",
      phone: "",
      taxId: "",
      paymentTerms: 30,
    },
  });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof supplierSchema>) =>
      api<Supplier>(editing ? `/suppliers/${editing.id}` : "/suppliers", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success(editing ? "Supplier updated" : "Supplier added");
      setOpen(false);
      setEditing(null);
      form.reset();
      void client.invalidateQueries({ queryKey: ["/suppliers"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ["/suppliers"] }),
  });
  const edit = (row: Supplier) => {
    setEditing(row);
    form.reset({
      code: row.code,
      name: row.name,
      email: row.email ?? "",
      phone: row.phone ?? "",
      taxId: "",
      paymentTerms: row.paymentTerms,
    });
    setOpen(true);
  };
  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Manage vendors, contacts and payment terms."
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              form.reset();
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Add supplier
          </button>
        }
      />
      <section className="card mt-6 overflow-hidden">
        <TableToolbar
          search={search}
          onSearch={setSearch}
          count={query.data?.meta?.total}
        />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Code</th>
                <th>Contact</th>
                <th>Terms</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data?.data.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold! text-slate-900!">{row.name}</td>
                  <td>{row.code}</td>
                  <td>
                    <div>{row.phone || "—"}</div>
                    <div className="text-xs text-slate-400">{row.email}</div>
                  </td>
                  <td>{row.paymentTerms} days</td>
                  <td>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {row.isActive ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => edit(row)}
                        className="grid size-8 place-items-center rounded-lg hover:bg-slate-100"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => remove.mutate(row.id)}
                        className="grid size-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!query.data?.data.length && (
                <EmptyRows
                  columns={6}
                  loading={query.isLoading}
                  label="No suppliers found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit supplier" : "Add supplier"}
      >
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field
            label="Supplier code"
            error={form.formState.errors.code?.message}
          >
            <input className="field" {...form.register("code")} />
          </Field>
          <Field
            label="Supplier name"
            error={form.formState.errors.name?.message}
          >
            <input className="field" {...form.register("name")} />
          </Field>
          <Field label="Phone">
            <input className="field" {...form.register("phone")} />
          </Field>
          <Field label="Email">
            <input type="email" className="field" {...form.register("email")} />
          </Field>
          <Field label="TIN / Tax ID">
            <input className="field" {...form.register("taxId")} />
          </Field>
          <Field label="Payment terms (days)">
            <input
              type="number"
              className="field"
              {...form.register("paymentTerms")}
            />
          </Field>
          <Actions
            pending={mutation.isPending}
            onCancel={() => setOpen(false)}
          />
        </form>
      </Modal>
    </>
  );
}

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const query = useDirectory<Patient>("/patients", search);
  const client = useQueryClient();
  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      patientCode: "",
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "",
      maritalStatus: "",
      occupation: "",
      preferredLanguage: "English",
      address: "",
      emergencyName: "",
      emergencyRelationship: "",
      emergencyPhone: "",
      notes: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof patientSchema>) => {
      const {
        address,
        emergencyName,
        emergencyRelationship,
        emergencyPhone,
        ...profile
      } = values;
      return api(editing ? `/patients/${editing.id}` : "/patients", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...profile,
          dateOfBirth: values.dateOfBirth || undefined,
          bloodGroup: values.bloodGroup || undefined,
          maritalStatus: values.maritalStatus || undefined,
          occupation: values.occupation || undefined,
          preferredLanguage: values.preferredLanguage || undefined,
          address: address ? { formatted: address } : undefined,
          emergencyContact:
            emergencyName && emergencyPhone
              ? {
                  name: emergencyName,
                  relationship: emergencyRelationship || undefined,
                  phone: emergencyPhone,
                }
              : undefined,
        }),
      });
    },
    onSuccess: () => {
      toast.success(editing ? "Patient updated" : "Patient added");
      setOpen(false);
      setEditing(null);
      form.reset();
      void client.invalidateQueries({ queryKey: ["/patients"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const edit = (row: Patient) => {
    setEditing(row);
    form.reset({
      patientCode: row.patientCode,
      name: row.name,
      email: row.email ?? "",
      phone: row.phone ?? "",
      dateOfBirth: row.dateOfBirth?.slice(0, 10) ?? "",
      gender: row.gender ?? "",
      bloodGroup: row.bloodGroup ?? "",
      maritalStatus: row.maritalStatus ?? "",
      occupation: row.occupation ?? "",
      preferredLanguage: row.preferredLanguage ?? "English",
      address: row.address?.formatted ?? "",
      emergencyName: row.emergencyContact?.name ?? "",
      emergencyRelationship: row.emergencyContact?.relationship ?? "",
      emergencyPhone: row.emergencyContact?.phone ?? "",
      notes: "",
    });
    setOpen(true);
  };
  return (
    <>
      <PageHeader
        title="Patients"
        description="Patient profiles, contact details and longitudinal clinical records."
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              form.reset();
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Add patient
          </button>
        }
      />
      <section className="card mt-6 overflow-hidden">
        <TableToolbar
          search={search}
          onSearch={setSearch}
          count={query.data?.meta?.total}
        />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>ID</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Gender</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data?.data.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold! text-slate-900!">{row.name}</td>
                  <td>{row.patientCode}</td>
                  <td>{row.phone || "—"}</td>
                  <td>{row.email || "—"}</td>
                  <td>{row.gender || "—"}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/patients/${row.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <FileHeart size={14} />
                        Open record
                      </Link>
                      <button
                        onClick={() => edit(row)}
                        className="grid size-8 place-items-center rounded-lg hover:bg-slate-100"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!query.data?.data.length && (
                <EmptyRows
                  columns={6}
                  loading={query.isLoading}
                  label="No patients found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit patient" : "Add patient"}
      >
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Patient ID">
            <input className="field" {...form.register("patientCode")} />
          </Field>
          <Field label="Full name">
            <input className="field" {...form.register("name")} />
          </Field>
          <Field label="Phone">
            <input className="field" {...form.register("phone")} />
          </Field>
          <Field label="Email">
            <input className="field" {...form.register("email")} />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              className="field"
              {...form.register("dateOfBirth")}
            />
          </Field>
          <Field label="Gender">
            <select className="field" {...form.register("gender")}>
              <option value="">Select</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Blood group">
            <select className="field" {...form.register("bloodGroup")}>
              <option value="">Select</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Marital status">
            <input className="field" {...form.register("maritalStatus")} />
          </Field>
          <Field label="Occupation">
            <input className="field" {...form.register("occupation")} />
          </Field>
          <Field label="Preferred language">
            <input className="field" {...form.register("preferredLanguage")} />
          </Field>
          <label className="sm:col-span-2">
            <span className="field-label">Address</span>
            <textarea
              className="field min-h-20 py-3"
              {...form.register("address")}
            />
          </label>
          <div className="sm:col-span-2 grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-3">
            <Field label="Emergency contact">
              <input className="field" {...form.register("emergencyName")} />
            </Field>
            <Field label="Relationship">
              <input
                className="field"
                {...form.register("emergencyRelationship")}
              />
            </Field>
            <Field label="Emergency phone">
              <input className="field" {...form.register("emergencyPhone")} />
            </Field>
          </div>
          <label className="sm:col-span-2">
            <span className="field-label">Medical / registration notes</span>
            <textarea
              className="field min-h-24 py-3"
              {...form.register("notes")}
            />
          </label>
          <Actions
            pending={mutation.isPending}
            onCancel={() => setOpen(false)}
          />
        </form>
      </Modal>
    </>
  );
}

export function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const query = useDirectory<Expense>("/expenses", search);
  const client = useQueryClient();
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: new Date().toISOString().slice(0, 10),
      category: "",
      description: "",
      amount: 0,
      paymentMethod: "CASH",
      reference: "",
      notes: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof expenseSchema>) =>
      api("/expenses", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      toast.success("Expense recorded");
      setOpen(false);
      form.reset();
      void client.invalidateQueries({ queryKey: ["/expenses"] });
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <>
      <PageHeader
        title="Expenses"
        description="Track operational expenses and payment channels."
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Add expense
          </button>
        }
      />
      <section className="card mt-6 overflow-hidden">
        <TableToolbar
          search={search}
          onSearch={setSearch}
          count={query.data?.meta?.total}
        />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment</th>
                <th>Reference</th>
                <th className="text-right!">Amount</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.data.map((row) => (
                <tr key={row.id}>
                  <td>
                    {new Date(row.expenseDate).toLocaleDateString("en-PH")}
                  </td>
                  <td>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                      {row.category}
                    </span>
                  </td>
                  <td>{row.description}</td>
                  <td>{row.paymentMethod.replaceAll("_", " ")}</td>
                  <td>{row.reference || "—"}</td>
                  <td className="text-right! font-semibold!">
                    ₱{Number(row.amount).toLocaleString("en-PH")}
                  </td>
                </tr>
              ))}
              {!query.data?.data.length && (
                <EmptyRows
                  columns={6}
                  loading={query.isLoading}
                  label="No expenses found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title="Record expense">
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Date">
            <input
              type="date"
              className="field"
              {...form.register("expenseDate")}
            />
          </Field>
          <Field label="Category">
            <input
              className="field"
              placeholder="Rent, utilities, salary…"
              {...form.register("category")}
            />
          </Field>
          <Field label="Description">
            <input className="field" {...form.register("description")} />
          </Field>
          <Field label="Amount">
            <input
              type="number"
              step=".01"
              className="field"
              {...form.register("amount")}
            />
          </Field>
          <Field label="Payment method">
            <select className="field" {...form.register("paymentMethod")}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="GCASH">GCash</option>
              <option value="MAYA">Maya</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
            </select>
          </Field>
          <Field label="Reference">
            <input className="field" {...form.register("reference")} />
          </Field>
          <Actions
            pending={mutation.isPending}
            onCancel={() => setOpen(false)}
          />
        </form>
      </Modal>
    </>
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
    <div>
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="mt-1 text-xs text-rose-600">{error}</span>}
    </div>
  );
}
function Actions({
  pending,
  onCancel,
}: {
  pending: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="col-span-full mt-2 flex justify-end gap-2 border-t border-line pt-4">
      <button type="button" className="btn-secondary" onClick={onCancel}>
        Cancel
      </button>
      <button className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
