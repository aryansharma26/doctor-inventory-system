"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Maximize2, MoreHorizontal, PhoneCall, UserX, Undo2, X } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  IconButton,
  Menu,
  PageHeader,
  Select,
  formatMinutes,
} from "@/design-system";
import { cn } from "@/lib/utils";
import { DEMO_NOW, DEMO_TODAY } from "@/mocks/catalog";
import { tokenCode } from "@/mocks/scheduling";
import type { Appointment, Doctor } from "@/mocks/types";
import { useWorkspace } from "./store";
import { DoctorStatusBadge, TokenChip } from "./shared";

export function ConsultationQueue() {
  const { state } = useWorkspace();
  const [dept, setDept] = useState("");
  const [display, setDisplay] = useState(false);

  const today = state.appointments.filter((a) => a.date === DEMO_TODAY);
  const doctors = state.doctors
    .filter((d) => !dept || d.departmentId === dept)
    .filter((d) => state.doctorStatus[d.id] !== "on-leave")
    .map((d) => ({
      doctor: d,
      current: today.find((a) => a.doctorId === d.id && a.status === "in-consultation"),
      waiting: today
        .filter((a) => a.doctorId === d.id && a.status === "waiting")
        .sort((a, b) => a.token - b.token),
      done: today.filter((a) => a.doctorId === d.id && a.status === "completed").length,
    }))
    .sort((a, b) => b.waiting.length + (b.current ? 1 : 0) - (a.waiting.length + (a.current ? 1 : 0)));

  const totalWaiting = doctors.reduce((s, d) => s + d.waiting.length, 0);

  return (
    <>
      <PageHeader
        title="Consultation queue"
        description={
          <span className="tnum">
            {totalWaiting} waiting across {doctors.filter((d) => d.waiting.length || d.current).length} doctors · updated {formatMinutes(DEMO_NOW)}
          </span>
        }
        actions={
          <>
            <Select aria-label="Filter by department" value={dept} onChange={(e) => setDept(e.target.value)} className="w-52">
              <option value="">All departments</option>
              {state.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Button variant="secondary" icon={<Maximize2 className="size-4" />} onClick={() => setDisplay(true)}>
              TV display
            </Button>
          </>
        }
      />

      {doctors.length === 0 ? (
        <Card>
          <EmptyState title="No doctors in this department today" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {doctors.map((col) => (
            <QueueColumn key={col.doctor.id} {...col} />
          ))}
        </div>
      )}

      {display && <NowServingBoard onClose={() => setDisplay(false)} />}
    </>
  );
}

function QueueColumn({
  doctor,
  current,
  waiting,
  done,
}: {
  doctor: Doctor;
  current?: Appointment;
  waiting: Appointment[];
  done: number;
}) {
  const { state, setStatus } = useWorkspace();
  const name = (id: string) => state.patients.find((p) => p.id === id)?.name ?? "Patient";
  const status = state.doctorStatus[doctor.id]!;

  function callNext() {
    if (current) setStatus(current.id, "completed");
    const next = waiting[0];
    if (next) {
      setStatus(next.id, "in-consultation");
      toast(`Now calling ${tokenCode(doctor, next.token)}`, { description: `${name(next.patientId)} → ${doctor.room}` });
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar name={doctor.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{doctor.name}</p>
          <p className="truncate text-xs text-ink-muted">
            {doctor.room} · {doctor.specialty}
          </p>
        </div>
        <DoctorStatusBadge status={status} />
      </div>

      <div
        className={cn(
          "mx-4 flex items-center gap-3 rounded-[10px] px-3 py-3",
          current ? "bg-brand-50" : "bg-subtle",
        )}
      >
        {current ? (
          <>
            <TokenChip doctor={doctor} token={current.token} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium tracking-wide text-brand-700 uppercase">In consultation</p>
              <p className="truncate text-sm font-medium">{name(current.patientId)}</p>
            </div>
            <span className="tnum text-xs text-ink-muted">{DEMO_NOW - (current.startedAt ?? DEMO_NOW)} min</span>
          </>
        ) : (
          <p className="text-[13px] text-ink-muted">Room is free</p>
        )}
      </div>

      <div className="flex items-center justify-between px-4 pt-4 pb-1.5 text-xs text-ink-muted">
        <span>
          Waiting <span className="tnum font-medium text-ink">{waiting.length}</span>
        </span>
        <span className="tnum">{done} seen today</span>
      </div>
      <ol className="flex-1 divide-y divide-line border-t border-line">
        {waiting.slice(0, 6).map((a, i) => {
          const wait = DEMO_NOW - (a.checkedInAt ?? DEMO_NOW);
          return (
            <li key={a.id} className="flex items-center gap-3 px-4 py-2">
              <TokenChip doctor={doctor} token={a.token} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{name(a.patientId)}</p>
                <p className={cn("tnum text-[11px]", wait > 30 ? "font-medium text-danger-700" : "text-ink-subtle")}>
                  {i === 0 ? "Next · " : ""}waiting {wait} min{a.vitals ? " · vitals done" : ""}
                </p>
              </div>
              <Menu
                items={[
                  { label: "Call in now", icon: <PhoneCall />, onSelect: () => setStatus(a.id, "in-consultation") },
                  { label: "Send back to expected", icon: <Undo2 />, onSelect: () => setStatus(a.id, "scheduled") },
                  "divider",
                  { label: "Mark no-show", icon: <UserX />, tone: "danger", onSelect: () => setStatus(a.id, "no-show") },
                ]}
                trigger={(p) => (
                  <IconButton label={`Actions for token ${a.token}`} size="sm" {...p}>
                    <MoreHorizontal className="size-4" />
                  </IconButton>
                )}
              />
            </li>
          );
        })}
        {waiting.length > 6 && <li className="px-4 py-2 text-xs text-ink-muted">+{waiting.length - 6} more waiting</li>}
        {waiting.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-ink-subtle">No one waiting</li>}
      </ol>
      <div className="flex gap-2 border-t border-line p-3">
        {current && (
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setStatus(current.id, "completed")}>
            Mark done
          </Button>
        )}
        <Button size="sm" className="flex-1" disabled={!waiting.length} onClick={callNext} icon={<ChevronRight className="size-4" />}>
          {current ? "Done & call next" : "Call next"}
        </Button>
      </div>
    </Card>
  );
}

function NowServingBoard({ onClose }: { onClose: () => void }) {
  const { state } = useWorkspace();
  const today = state.appointments.filter((a) => a.date === DEMO_TODAY);
  const rows = state.doctors
    .map((d) => ({
      d,
      current: today.find((a) => a.doctorId === d.id && a.status === "in-consultation"),
      next: today.filter((a) => a.doctorId === d.id && a.status === "waiting").sort((a, b) => a.token - b.token).slice(0, 3),
    }))
    .filter((r) => r.current || r.next.length);
  return (
    <div className="ds-root fixed inset-0 z-[100] flex flex-col bg-brand-950 text-white">
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <p className="text-sm text-white/60">{state.hospital.name}</p>
          <p className="text-2xl font-semibold">Now serving</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="tnum text-3xl font-light text-white/80">{formatMinutes(DEMO_NOW)}</span>
          <button type="button" onClick={onClose} aria-label="Exit TV display" className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white">
            <X className="size-6" />
          </button>
        </div>
      </div>
      <div className="grid flex-1 auto-rows-min gap-3 overflow-y-auto px-8 pb-8 lg:grid-cols-2">
        {rows.map(({ d, current, next }) => (
          <div key={d.id} className="flex items-center gap-6 rounded-2xl bg-white/[0.06] px-6 py-5">
            <div className="w-40 shrink-0">
              <p className="tnum text-5xl font-semibold tracking-tight">{current ? tokenCode(d, current.token) : "-"}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-medium">{d.name}</p>
              <p className="text-sm text-white/60">{d.room}</p>
            </div>
            <div className="text-right">
              <p className="text-xs tracking-wide text-white/50 uppercase">Next</p>
              <p className="tnum text-lg text-white/80">{next.map((n) => tokenCode(d, n.token)).join("  ") || "-"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
