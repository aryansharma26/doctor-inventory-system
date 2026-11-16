"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CalendarPlus, HeartPulse, IndianRupee, Pencil, Phone, Pill, ShieldCheck } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  DescriptionList,
  Drawer,
  EmptyState,
  Field,
  Input,
  KeyValue,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  Tabs,
  ageFrom,
  formatDate,
  formatDateShort,
  formatINR,
  formatMinutes,
  formatPhone,
} from "@/design-system";
import { DEMO_TODAY } from "@/mocks/catalog";
import type { Patient } from "@/mocks/types";
import { useWorkspace } from "./store";
import { AppointmentStatusBadge, BookAppointmentModal, ChannelTag, TokenChip } from "./shared";

type Tab = "overview" | "visits" | "consultations" | "billing";

export function PatientDetail({ id }: { id: string }) {
  const { state, markPaid } = useWorkspace();
  const [tab, setTab] = useState<Tab>("overview");
  const [bookOpen, setBookOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const patient = state.patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <Card>
        <EmptyState
          title="Patient not found"
          description="This record may have been merged or removed."
          action={
            <Link href="/hospital/patients" className="text-sm font-medium text-brand-700">
              Back to patients
            </Link>
          }
        />
      </Card>
    );
  }

  const appts = state.appointments.filter((a) => a.patientId === id).sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start);
  const upcoming = appts.filter((a) => a.date >= DEMO_TODAY && ["scheduled", "waiting", "in-consultation"].includes(a.status)).reverse();
  const consults = state.consultations.filter((c) => c.patientId === id).sort((a, b) => b.date.localeCompare(a.date));
  const lastVitals = appts.find((a) => a.vitals)?.vitals;
  const unpaid = appts.filter((a) => !a.paid && ["completed", "waiting", "in-consultation"].includes(a.status));
  const doctor = (did: string) => state.doctors.find((d) => d.id === did)!;
  const age = ageFrom(patient.dob, DEMO_TODAY);

  return (
    <>
      <Link href="/hospital/patients" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Patients
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={patient.name} size="xl" />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold sm:text-2xl">{patient.name}</h1>
              <p className="mt-1 text-sm text-ink-muted">
                {patient.gender}, {age} years · {patient.uhid}
                {patient.abhaId && <> · ABHA {patient.abhaId}</>}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge>Blood {patient.bloodGroup}</Badge>
                {patient.allergies.map((a) => (
                  <Badge key={a} tone="danger">
                    <AlertTriangle className="size-3" /> Allergic to {a}
                  </Badge>
                ))}
                {patient.conditions.map((c) => (
                  <Badge key={c} tone="warning">
                    {c}
                  </Badge>
                ))}
                {patient.tags.filter((t) => t !== "Chronic care").map((t) => (
                  <Badge key={t} tone="teal">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button icon={<CalendarPlus className="size-4" />} onClick={() => setBookOpen(true)}>
              Book appointment
            </Button>
          </div>
        </div>
      </Card>

      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "visits", label: "Visits", count: appts.length },
          { value: "consultations", label: "Consultations", count: consults.length },
          { value: "billing", label: "Billing", count: unpaid.length || undefined },
        ]}
      />

      <div className="mt-5">
        {tab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Contact & identity" />
              <div className="px-5 pb-5">
                <DescriptionList
                  items={[
                    { label: "Mobile", value: formatPhone(patient.phone) },
                    { label: "Email", value: patient.email ?? "-" },
                    { label: "Date of birth", value: formatDate(patient.dob) },
                    { label: "Registered", value: formatDate(patient.registeredOn) },
                    { label: "Address", value: patient.address || "-" },
                    { label: "City", value: patient.city },
                    {
                      label: "Emergency contact",
                      value: patient.emergencyContact ? `${patient.emergencyContact.name} (${patient.emergencyContact.relation}) · ${formatPhone(patient.emergencyContact.phone)}` : "-",
                    },
                    { label: "ABHA ID", value: patient.abhaId ?? "Not linked" },
                  ]}
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Upcoming" />
              <div className="px-5 pb-5">
                {upcoming.length === 0 ? (
                  <p className="text-[13px] text-ink-muted">No upcoming appointments.</p>
                ) : (
                  <ul className="space-y-3">
                    {upcoming.slice(0, 3).map((a) => (
                      <li key={a.id} className="flex items-center gap-3">
                        <TokenChip doctor={doctor(a.doctorId)} token={a.token} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{doctor(a.doctorId).name}</p>
                          <p className="text-xs text-ink-muted">
                            {a.date === DEMO_TODAY ? "Today" : formatDateShort(a.date)}, {formatMinutes(a.start)}
                          </p>
                        </div>
                        <AppointmentStatusBadge status={a.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-line px-5 py-4">
                <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium">
                  <HeartPulse className="size-4 text-ink-subtle" /> Latest vitals
                </p>
                {lastVitals ? (
                  <div className="divide-y divide-line">
                    <KeyValue label="Blood pressure" value={`${lastVitals.bp} mmHg`} />
                    <KeyValue label="Pulse" value={`${lastVitals.pulse} bpm`} />
                    <KeyValue label="SpO₂" value={`${lastVitals.spo2}%`} />
                    <KeyValue label="Weight" value={`${lastVitals.weightKg} kg`} />
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-muted">Not recorded yet.</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {tab === "visits" && (
          <Card>
            {appts.length === 0 ? (
              <EmptyState title="No visits yet" action={<Button size="sm" onClick={() => setBookOpen(true)}>Book first visit</Button>} />
            ) : (
              <Table>
                <THead>
                  <Th>Date</Th>
                  <Th>Token</Th>
                  <Th>Doctor</Th>
                  <Th>Reason</Th>
                  <Th>Channel</Th>
                  <Th>Status</Th>
                </THead>
                <TBody>
                  {appts.map((a) => (
                    <Tr key={a.id}>
                      <Td className="tnum whitespace-nowrap">
                        {formatDateShort(a.date)}
                        <p className="text-xs text-ink-muted">{formatMinutes(a.start)}</p>
                      </Td>
                      <Td>
                        <TokenChip doctor={doctor(a.doctorId)} token={a.token} />
                      </Td>
                      <Td className="whitespace-nowrap">{doctor(a.doctorId).name}</Td>
                      <Td className="min-w-48 text-ink-muted">{a.reason}</Td>
                      <Td>
                        <ChannelTag channel={a.channel} />
                      </Td>
                      <Td>
                        <AppointmentStatusBadge status={a.status} />
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        )}

        {tab === "consultations" && (
          <div className="space-y-3">
            {consults.length === 0 && (
              <Card>
                <EmptyState title="No consultation notes yet" description="Notes appear here after a doctor completes a visit." />
              </Card>
            )}
            {consults.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{c.diagnosis}</p>
                    <p className="text-[13px] text-ink-muted">
                      {formatDate(c.date)} · {doctor(c.doctorId).name} · Complaint: {c.complaint}
                    </p>
                  </div>
                  {c.followUp && <Badge tone="brand">Follow-up {formatDateShort(c.followUp)}</Badge>}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {c.prescriptions.map((m) => (
                    <li key={m.medicine} className="flex items-start gap-2 text-[13px]">
                      <Pill className="mt-0.5 size-3.5 text-ink-subtle" />
                      <span>
                        <span className="font-medium">{m.medicine}</span>
                        <span className="text-ink-muted">
                          {" "}
                          · {m.dosage} · {m.frequency} · {m.duration}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}

        {tab === "billing" && (
          <Card>
            <CardHeader
              title="Consultation fees"
              description={unpaid.length ? `${formatINR(unpaid.reduce((s, a) => s + a.fee, 0))} outstanding` : "No outstanding dues"}
            />
            <Table>
              <THead>
                <Th>Date</Th>
                <Th>Doctor</Th>
                <Th>Visit</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Status</Th>
              </THead>
              <TBody>
                {appts
                  .filter((a) => a.status !== "cancelled" && a.status !== "scheduled")
                  .map((a) => (
                    <Tr key={a.id}>
                      <Td className="tnum">{formatDateShort(a.date)}</Td>
                      <Td>{doctor(a.doctorId).name}</Td>
                      <Td>{a.visitType === "follow-up" ? "Follow-up" : "New"}</Td>
                      <Td className="tnum text-right">{formatINR(a.fee)}</Td>
                      <Td className="text-right">
                        {a.paid ? (
                          <Badge tone="success">Paid</Badge>
                        ) : a.status === "no-show" ? (
                          <Badge>Waived</Badge>
                        ) : (
                          <Button size="sm" variant="secondary" icon={<IndianRupee className="size-3.5" />} onClick={() => markPaid(a.id)}>
                            Record payment
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>

      {bookOpen && <BookAppointmentModal open initialPatient={patient} onClose={() => setBookOpen(false)} />}
      {editOpen && <EditPatientDrawer patient={patient} onClose={() => setEditOpen(false)} />}
    </>
  );
}

function EditPatientDrawer({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { updatePatient } = useWorkspace();
  const [draft, setDraft] = useState(patient);
  const set = (k: keyof Patient) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  return (
    <Drawer
      open
      onClose={onClose}
      title="Edit patient"
      description={patient.uhid}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              updatePatient(draft);
              onClose();
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name">{(id) => <Input id={id} value={draft.name} onChange={set("name")} />}</Field>
        <Field label="Mobile">
          {(id) => (
            <div className="relative">
              <Phone className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-subtle" />
              <Input id={id} value={draft.phone} onChange={set("phone")} className="pl-8" />
            </div>
          )}
        </Field>
        <Field label="Email">{(id) => <Input id={id} value={draft.email ?? ""} onChange={set("email")} />}</Field>
        <Field label="Address">{(id) => <Input id={id} value={draft.address} onChange={set("address")} />}</Field>
        <Field label="ABHA ID" hint="Linking ABHA lets records sync across hospitals">
          {(id) => (
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-subtle" />
              <Input id={id} value={draft.abhaId ?? ""} onChange={set("abhaId")} className="pl-8" />
            </div>
          )}
        </Field>
        <Field label="Allergies" hint="Separate with commas">
          {(id) => (
            <Input
              id={id}
              value={draft.allergies.join(", ")}
              onChange={(e) => setDraft((d) => ({ ...d, allergies: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) }))}
            />
          )}
        </Field>
      </div>
    </Drawer>
  );
}
