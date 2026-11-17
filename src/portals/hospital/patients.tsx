"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CalendarPlus, UserPlus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  formatDate,
  formatPhone,
} from "@/design-system";
import { DEMO_TODAY } from "@/mocks/catalog";
import type { Patient } from "@/mocks/types";
import { useWorkspace } from "./store";
import { BookAppointmentModal, PatientCell, RegisterPatientModal } from "./shared";

const PAGE = 15;

/** Reads ?q= from the header search and remounts the list when it changes. */
export function PatientsPage() {
  const initial = useSearchParams().get("q") ?? "";
  return <PatientsList key={initial} initialQuery={initial} />;
}

function PatientsList({ initialQuery }: { initialQuery: string }) {
  const { state } = useWorkspace();
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [gender, setGender] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<"recent" | "name" | "visits">("recent");
  const [page, setPage] = useState(1);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [bookFor, setBookFor] = useState<Patient | null>(null);

  const stats = useMemo(() => {
    const m = new Map<string, { visits: number; last?: string; next?: string }>();
    for (const a of state.appointments) {
      const s = m.get(a.patientId) ?? { visits: 0 };
      if (a.status === "completed") {
        s.visits++;
        if (!s.last || a.date > s.last) s.last = a.date;
      }
      if (a.status === "scheduled" && a.date >= DEMO_TODAY && (!s.next || a.date < s.next)) s.next = a.date;
      m.set(a.patientId, s);
    }
    return m;
  }, [state.appointments]);

  const term = q.trim().toLowerCase();
  const rows = state.patients
    .filter((p) => !term || p.name.toLowerCase().includes(term) || p.phone.includes(term) || p.uhid.toLowerCase().includes(term) || (p.abhaId ?? "").includes(term))
    .filter((p) => !gender || p.gender === gender)
    .filter((p) => !tag || p.tags.includes(tag) || (tag === "Allergies" && p.allergies.length > 0))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "visits") return (stats.get(b.id)?.visits ?? 0) - (stats.get(a.id)?.visits ?? 0);
      return b.registeredOn.localeCompare(a.registeredOn);
    });
  const paged = rows.slice((page - 1) * PAGE, page * PAGE);

  return (
    <>
      <PageHeader
        title="Patients"
        description={`${state.patients.length} patients in this workspace`}
        actions={
          <Button icon={<UserPlus className="size-4" />} onClick={() => setRegisterOpen(true)}>
            Register patient
          </Button>
        }
      />
      <Card>
        <FilterBar className="border-b border-line">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Name, mobile, UHID or ABHA"
            className="sm:w-80"
          />
          <Select aria-label="Gender" value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }} className="sm:w-36">
            <option value="">Any gender</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </Select>
          <Select aria-label="Segment" value={tag} onChange={(e) => { setTag(e.target.value); setPage(1); }} className="sm:w-44">
            <option value="">All patients</option>
            <option value="Chronic care">Chronic care</option>
            <option value="Senior citizen">Senior citizens</option>
            <option value="Insurance">Insured</option>
            <option value="Allergies">Has allergies</option>
            <option value="New">Registered today</option>
          </Select>
          <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="sm:ml-auto sm:w-44">
            <option value="recent">Newest first</option>
            <option value="name">Name A-Z</option>
            <option value="visits">Most visits</option>
          </Select>
        </FilterBar>
        {rows.length === 0 ? (
          <EmptyState
            title={term ? `No patients match "${q}"` : "No patients in this segment"}
            description="Check the spelling or search by mobile number."
            action={
              <Button size="sm" icon={<UserPlus className="size-3.5" />} onClick={() => setRegisterOpen(true)}>
                Register new patient
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Patient</Th>
                <Th>Mobile</Th>
                <Th>Blood</Th>
                <Th>Clinical flags</Th>
                <Th>Last visit</Th>
                <Th>Next visit</Th>
                <Th className="w-28">
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {paged.map((p) => {
                  const s = stats.get(p.id);
                  return (
                    <Tr key={p.id} onClick={() => router.push(`/hospital/patients/${p.id}`)}>
                      <Td className="min-w-60">
                        <Link href={`/hospital/patients/${p.id}`} onClick={(e) => e.stopPropagation()}>
                          <PatientCell patient={p} />
                        </Link>
                      </Td>
                      <Td className="tnum whitespace-nowrap text-ink-muted">{formatPhone(p.phone)}</Td>
                      <Td>{p.bloodGroup}</Td>
                      <Td className="min-w-48">
                        <div className="flex flex-wrap gap-1">
                          {p.allergies.length > 0 && (
                            <Badge tone="danger">
                              <AlertTriangle className="size-3" /> Allergy
                            </Badge>
                          )}
                          {p.conditions.slice(0, 1).map((c) => (
                            <Badge key={c}>{c}</Badge>
                          ))}
                          {p.tags.includes("New") && <Badge tone="teal">New</Badge>}
                          {!p.allergies.length && !p.conditions.length && !p.tags.includes("New") && <span className="text-ink-subtle">-</span>}
                        </div>
                      </Td>
                      <Td className="tnum whitespace-nowrap text-ink-muted">{s?.last ? formatDate(s.last) : "-"}</Td>
                      <Td className="tnum whitespace-nowrap">{s?.next ? formatDate(s.next) : <span className="text-ink-subtle">-</span>}</Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<CalendarPlus className="size-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookFor(p);
                          }}
                        >
                          Book
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={PAGE} total={rows.length} onPage={setPage} />
          </>
        )}
      </Card>
      {registerOpen && (
        <RegisterPatientModal
          open
          initialName={/\d/.test(q) ? "" : q}
          onClose={() => setRegisterOpen(false)}
          onRegistered={(p) => router.push(`/hospital/patients/${p.id}`)}
        />
      )}
      {bookFor && <BookAppointmentModal open initialPatient={bookFor} onClose={() => setBookFor(null)} />}
    </>
  );
}
