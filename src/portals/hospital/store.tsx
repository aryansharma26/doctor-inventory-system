"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import {
  apiBookAppointment,
  apiChangeAppointment,
  apiRegisterPatient,
  apiUpdatePatient,
  fetchHospitalWorkspace,
  fetchRecords,
  type AppointmentChange,
  type HospitalSnapshot,
  type NewPatientPayload,
} from "@/services/mock-api";
import { useMockQuery } from "@/design-system/hooks";
import { DEMO_NOW, DEMO_TODAY } from "@/mocks/catalog";
import { tokenCode } from "@/mocks/scheduling";
import type { Appointment, AppointmentStatus, BookingChannel, DoctorStatus, Patient, StaffMember } from "@/mocks/types";
import { formatMinutes } from "@/design-system/format";

/*
 * Hospital dashboard state. Patients and appointments are loaded from the
 * database and every change is saved through /api/opd/*. The workspace is
 * re-fetched every few seconds so online bookings appear at reception.
 */

const POLL_MS = 3000;

type State = HospitalSnapshot & { doctorStatus: Record<string, DoctorStatus> };

type Action =
  | { type: "load"; snapshot: HospitalSnapshot }
  | { type: "records"; patients: Patient[]; appointments: Appointment[] }
  | { type: "upsertPatient"; patient: Patient }
  | { type: "upsertAppointment"; appointment: Appointment }
  | { type: "patchAppointment"; id: string; patch: Partial<Appointment> }
  | { type: "doctorStatus"; doctorId: string; status: DoctorStatus }
  | { type: "upsertStaff"; staff: StaffMember }
  | { type: "activity"; actor: string; action: string; target: string; kind: State["activity"][number]["kind"] };

function upsert<T extends { id: string }>(list: T[], item: T, prepend = false) {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : prepend ? [item, ...list] : [...list, item];
}

function reducer(state: State | null, action: Action): State | null {
  if (action.type === "load") {
    return { ...action.snapshot, doctorStatus: Object.fromEntries(action.snapshot.doctors.map((d) => [d.id, d.status])) };
  }
  if (!state) return state;
  switch (action.type) {
    case "records":
      return { ...state, patients: action.patients, appointments: action.appointments };
    case "upsertPatient":
      return { ...state, patients: upsert(state.patients, action.patient, true) };
    case "upsertAppointment":
      return { ...state, appointments: upsert(state.appointments, action.appointment) };
    case "patchAppointment":
      return { ...state, appointments: state.appointments.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)) };
    case "doctorStatus":
      return { ...state, doctorStatus: { ...state.doctorStatus, [action.doctorId]: action.status } };
    case "upsertStaff":
      return { ...state, staff: upsert(state.staff, action.staff, true) };
    case "activity":
      return {
        ...state,
        activity: [
          { id: `ac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, actor: action.actor, action: action.action, target: action.target, kind: action.kind, time: "Just now" },
          ...state.activity,
        ].slice(0, 30),
      };
  }
}

export type BookingInput = {
  patientId: string;
  doctorId: string;
  date: string;
  start: number;
  visitType: "new" | "follow-up";
  channel: BookingChannel;
  reason: string;
  checkInNow?: boolean;
};

export type NewPatientInput = NewPatientPayload;

type Ctx = {
  state: State | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  actor: string;
  registerPatient: (input: NewPatientInput) => Promise<Patient>;
  updatePatient: (p: Patient) => Promise<void>;
  book: (input: BookingInput) => Promise<Appointment>;
  setStatus: (id: string, status: AppointmentStatus) => void;
  reschedule: (id: string, date: string, start: number) => Promise<void>;
  markPaid: (id: string) => void;
  setDoctorStatus: (doctorId: string, status: DoctorStatus) => void;
  upsertStaff: (s: StaffMember) => void;
};

const HospitalCtx = createContext<Ctx | null>(null);

const STATUS_VERB: Partial<Record<AppointmentStatus, string>> = {
  waiting: "checked in",
  "in-consultation": "called in",
  completed: "completed consultation for",
  cancelled: "cancelled appointment for",
  "no-show": "marked no-show",
  scheduled: "moved back to scheduled",
};

const message = (e: unknown) => (e instanceof Error ? e.message : "Couldn't save. Please try again.");

export function HospitalStoreProvider({ children, actor = "Pooja Kale" }: { children: ReactNode; actor?: string }) {
  const query = useMockQuery(() => fetchHospitalWorkspace());
  const [state, dispatch] = useReducer(reducer, null);

  useEffect(() => {
    if (query.data) dispatch({ type: "load", snapshot: query.data });
  }, [query.data]);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Saves in progress, and a counter bumped by every save. A poll that overlaps a
  // save is discarded so it can't overwrite the change with older data.
  const writes = useRef({ pending: 0, version: 0 });
  const track = useCallback(async <T,>(work: () => Promise<T>) => {
    writes.current.pending++;
    writes.current.version++;
    try {
      return await work();
    } finally {
      writes.current.pending--;
    }
  }, []);

  /** Re-reads patients and appointments from the database. */
  const sync = useCallback(async (announce: boolean) => {
    const version = writes.current.version;
    const records = await fetchRecords();
    if (writes.current.pending > 0 || writes.current.version !== version) return;
    const current = stateRef.current;
    if (announce && current) {
      const known = new Set(current.appointments.map((a) => a.id));
      for (const a of records.appointments) {
        if (known.has(a.id) || a.channel !== "online") continue;
        const doctor = current.doctors.find((d) => d.id === a.doctorId);
        const patient = records.patients.find((p) => p.id === a.patientId);
        if (!doctor || !patient) continue;
        const code = tokenCode(doctor, a.token);
        const when = `${a.date === DEMO_TODAY ? "today" : a.date}, ${formatMinutes(a.start)}`;
        toast.info(`New online booking · ${code}`, { description: `${patient.name} with ${doctor.name}, ${when}` });
        dispatch({ type: "activity", actor: "Online booking", action: "new appointment", target: `${patient.name} · ${code} · ${when}`, kind: "booking" });
      }
    }
    dispatch({ type: "records", patients: records.patients, appointments: records.appointments });
  }, []);

  // Poll while the tab is visible so new online bookings show up at reception.
  const loaded = state !== null;
  useEffect(() => {
    if (!loaded) return;
    let inFlight = false;
    const tick = () => {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      sync(true)
        .catch(() => {})
        .finally(() => {
          inFlight = false;
        });
    };
    const timer = setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, [loaded, sync]);

  const patientName = useCallback((id: string) => stateRef.current?.patients.find((p) => p.id === id)?.name ?? "Patient", []);

  const registerPatient = useCallback(
    async (input: NewPatientInput) => {
      const patient = await track(() => apiRegisterPatient(input));
      dispatch({ type: "upsertPatient", patient });
      dispatch({ type: "activity", actor, action: "registered patient", target: `${patient.name} · ${patient.uhid}`, kind: "checkin" });
      return patient;
    },
    [actor, track],
  );

  const updatePatient = useCallback(async (p: Patient) => {
    try {
      const saved = await track(() => apiUpdatePatient(p.id, {
        name: p.name,
        phone: p.phone,
        email: p.email ?? "",
        address: p.address,
        abhaId: p.abhaId ?? "",
        allergies: p.allergies,
      }));
      dispatch({ type: "upsertPatient", patient: saved });
      toast.success("Patient details saved");
    } catch (e) {
      toast.error(message(e));
      throw e;
    }
  }, [track]);

  const book = useCallback(
    async (input: BookingInput) => {
      const appointment = await track(() => apiBookAppointment({
        patientId: input.patientId,
        doctorId: input.doctorId,
        date: input.date,
        start: input.start,
        channel: input.channel === "phone" ? "phone" : "walk-in",
        reason: input.reason,
        checkInNow: input.checkInNow,
      }));
      dispatch({ type: "upsertAppointment", appointment });
      const doctor = stateRef.current?.doctors.find((d) => d.id === appointment.doctorId);
      dispatch({
        type: "activity",
        actor,
        action: input.checkInNow ? "booked & checked in" : "booked",
        target: `${patientName(input.patientId)} · token ${doctor ? tokenCode(doctor, appointment.token) : appointment.token} · ${formatMinutes(input.start)}`,
        kind: "booking",
      });
      return appointment;
    },
    [actor, patientName, track],
  );

  /** Shows the change immediately, saves it, and rolls back if saving fails. */
  const change = useCallback(
    async (id: string, optimistic: Partial<Appointment>, request: AppointmentChange) => {
      const before = stateRef.current?.appointments.find((a) => a.id === id);
      if (!before) return null;
      dispatch({ type: "patchAppointment", id, patch: optimistic });
      try {
        const saved = await track(() => apiChangeAppointment(id, request));
        dispatch({ type: "upsertAppointment", appointment: saved });
        return saved;
      } catch (e) {
        dispatch({ type: "upsertAppointment", appointment: before });
        toast.error(message(e));
        return null;
      }
    },
    [track],
  );

  const setStatus = useCallback(
    (id: string, status: AppointmentStatus) => {
      const appt = stateRef.current?.appointments.find((a) => a.id === id);
      if (!appt) return;
      const patch: Partial<Appointment> = { status };
      if (status === "waiting") patch.checkedInAt = DEMO_NOW;
      if (status === "in-consultation") patch.startedAt = DEMO_NOW;
      if (status === "completed") patch.completedAt = DEMO_NOW;
      if (status === "scheduled") Object.assign(patch, { checkedInAt: undefined, startedAt: undefined });
      void change(id, patch, { action: "status", status }).then((saved) => {
        const verb = STATUS_VERB[status];
        if (saved && verb) {
          dispatch({ type: "activity", actor, action: verb, target: `${patientName(appt.patientId)} · token ${appt.token}`, kind: status === "completed" ? "consult" : "checkin" });
        }
      });
    },
    [actor, change, patientName],
  );

  const reschedule = useCallback(
    async (id: string, date: string, start: number) => {
      const appt = stateRef.current?.appointments.find((a) => a.id === id);
      if (!appt) return;
      const saved = await change(id, { date, start, status: "scheduled" }, { action: "reschedule", date, start });
      if (saved) toast.success("Appointment rescheduled", { description: `${patientName(appt.patientId)} · ${formatMinutes(start)}` });
    },
    [change, patientName],
  );

  const markPaid = useCallback(
    (id: string) => {
      void change(id, { paid: true }, { action: "pay" }).then((saved) => saved && toast.success("Payment recorded"));
    },
    [change],
  );

  const setDoctorStatus = useCallback(
    (doctorId: string, status: DoctorStatus) => {
      dispatch({ type: "doctorStatus", doctorId, status });
      const name = stateRef.current?.doctors.find((d) => d.id === doctorId)?.name ?? "Doctor";
      dispatch({ type: "activity", actor, action: "updated availability", target: `${name} → ${status.replace("-", " ")}`, kind: "staff" });
    },
    [actor],
  );

  const upsertStaff = useCallback((s: StaffMember) => dispatch({ type: "upsertStaff", staff: s }), []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      loading: query.loading || (!state && !query.error),
      error: query.error,
      retry: query.retry,
      actor,
      registerPatient,
      updatePatient,
      book,
      setStatus,
      reschedule,
      markPaid,
      setDoctorStatus,
      upsertStaff,
    }),
    [state, query.loading, query.error, query.retry, actor, registerPatient, updatePatient, book, setStatus, reschedule, markPaid, setDoctorStatus, upsertStaff],
  );

  return <HospitalCtx.Provider value={value}>{children}</HospitalCtx.Provider>;
}

export function useHospitalStore() {
  const ctx = useContext(HospitalCtx);
  if (!ctx) throw new Error("useHospitalStore must be used inside HospitalStoreProvider");
  return ctx;
}

/** Convenience: the loaded workspace (only call under <WorkspaceGate>). */
export function useWorkspace() {
  const ctx = useHospitalStore();
  if (!ctx.state) throw new Error("Workspace not loaded");
  return { ...ctx, state: ctx.state };
}
