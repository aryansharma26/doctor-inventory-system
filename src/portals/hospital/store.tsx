"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { fetchHospitalWorkspace, type HospitalSnapshot } from "@/services/mock-api";
import { useMockQuery } from "@/design-system/hooks";
import { DEMO_NOW, DEMO_TODAY } from "@/mocks/catalog";
import { nextToken, tokenCode } from "@/mocks/scheduling";
import type {
  Appointment,
  AppointmentStatus,
  BookingChannel,
  DoctorStatus,
  Patient,
  StaffMember,
} from "@/mocks/types";
import { formatMinutes } from "@/design-system/format";

/*
 * Local frontend state for the Hospital dashboard. Seeded from the mock API,
 * mutated in memory. Each action maps 1:1 to a future API mutation.
 */

type State = HospitalSnapshot & { doctorStatus: Record<string, DoctorStatus> };

type Action =
  | { type: "load"; snapshot: HospitalSnapshot }
  | { type: "addPatient"; patient: Patient }
  | { type: "updatePatient"; patient: Patient }
  | { type: "addAppointment"; appointment: Appointment }
  | { type: "patchAppointment"; id: string; patch: Partial<Appointment> }
  | { type: "doctorStatus"; doctorId: string; status: DoctorStatus }
  | { type: "upsertStaff"; staff: StaffMember }
  | { type: "activity"; actor: string; action: string; target: string; kind: State["activity"][number]["kind"] };

function reducer(state: State | null, action: Action): State | null {
  if (action.type === "load") {
    return {
      ...action.snapshot,
      doctorStatus: Object.fromEntries(action.snapshot.doctors.map((d) => [d.id, d.status])),
    };
  }
  if (!state) return state;
  switch (action.type) {
    case "addPatient":
      return { ...state, patients: [action.patient, ...state.patients] };
    case "updatePatient":
      return { ...state, patients: state.patients.map((p) => (p.id === action.patient.id ? action.patient : p)) };
    case "addAppointment":
      return { ...state, appointments: [...state.appointments, action.appointment] };
    case "patchAppointment":
      return {
        ...state,
        appointments: state.appointments.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)),
      };
    case "doctorStatus":
      return { ...state, doctorStatus: { ...state.doctorStatus, [action.doctorId]: action.status } };
    case "upsertStaff": {
      const exists = state.staff.some((s) => s.id === action.staff.id);
      return {
        ...state,
        staff: exists ? state.staff.map((s) => (s.id === action.staff.id ? action.staff : s)) : [action.staff, ...state.staff],
      };
    }
    case "activity":
      return {
        ...state,
        activity: [
          { id: `ac-${Date.now()}`, actor: action.actor, action: action.action, target: action.target, kind: action.kind, time: "Just now" },
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

export type NewPatientInput = Omit<Patient, "id" | "uhid" | "registeredOn" | "tags" | "city"> & { city?: string };

type Ctx = {
  state: State | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  actor: string;
  registerPatient: (input: NewPatientInput) => Patient;
  updatePatient: (p: Patient) => void;
  book: (input: BookingInput) => Appointment;
  setStatus: (id: string, status: AppointmentStatus) => void;
  reschedule: (id: string, date: string, start: number) => void;
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

export function HospitalStoreProvider({ children, actor = "Pooja Kale" }: { children: ReactNode; actor?: string }) {
  const query = useMockQuery(() => fetchHospitalWorkspace());
  const [state, dispatch] = useReducer(reducer, null);

  useEffect(() => {
    if (query.data) dispatch({ type: "load", snapshot: query.data });
  }, [query.data]);

  const patientName = useCallback(
    (id: string) => state?.patients.find((p) => p.id === id)?.name ?? "Patient",
    [state?.patients],
  );

  const registerPatient = useCallback(
    (input: NewPatientInput): Patient => {
      const count = state?.patients.length ?? 0;
      const patient: Patient = {
        ...input,
        city: input.city ?? "Pune",
        id: `p-new-${Date.now()}`,
        uhid: `AMH-${String(400000 + count).padStart(6, "0")}`,
        registeredOn: DEMO_TODAY,
        tags: ["New"],
      };
      dispatch({ type: "addPatient", patient });
      dispatch({ type: "activity", actor, action: "registered patient", target: `${patient.name} · ${patient.uhid}`, kind: "checkin" });
      return patient;
    },
    [state?.patients.length, actor],
  );

  const book = useCallback(
    (input: BookingInput): Appointment => {
      if (!state) throw new Error("Workspace not loaded");
      const doctor = state.doctors.find((d) => d.id === input.doctorId)!;
      const token = nextToken(doctor.id, input.date, state.appointments);
      const appointment: Appointment = {
        id: `a-new-${Date.now()}`,
        token,
        patientId: input.patientId,
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        hospitalId: doctor.hospitalId,
        date: input.date,
        start: input.start,
        duration: doctor.slotMinutes,
        visitType: input.visitType,
        channel: input.channel,
        status: input.checkInNow ? "waiting" : "scheduled",
        reason: input.reason || "Consultation",
        checkedInAt: input.checkInNow ? DEMO_NOW : undefined,
        fee: input.visitType === "follow-up" ? doctor.followUpFee : doctor.fee,
        paid: false,
      };
      dispatch({ type: "addAppointment", appointment });
      dispatch({
        type: "activity",
        actor,
        action: input.checkInNow ? "booked & checked in" : "booked",
        target: `${patientName(input.patientId)} · token ${tokenCode(doctor, token)} · ${formatMinutes(input.start)}`,
        kind: "booking",
      });
      return appointment;
    },
    [state, actor, patientName],
  );

  const setStatus = useCallback(
    (id: string, status: AppointmentStatus) => {
      const appt = state?.appointments.find((a) => a.id === id);
      if (!appt) return;
      const patch: Partial<Appointment> = { status };
      if (status === "waiting") patch.checkedInAt = DEMO_NOW;
      if (status === "in-consultation") patch.startedAt = DEMO_NOW;
      if (status === "completed") patch.completedAt = DEMO_NOW;
      if (status === "scheduled") Object.assign(patch, { checkedInAt: undefined, startedAt: undefined });
      dispatch({ type: "patchAppointment", id, patch });
      const verb = STATUS_VERB[status];
      if (verb) {
        dispatch({
          type: "activity",
          actor,
          action: verb,
          target: `${patientName(appt.patientId)} · token ${appt.token}`,
          kind: status === "completed" ? "consult" : "checkin",
        });
      }
    },
    [state?.appointments, actor, patientName],
  );

  const reschedule = useCallback(
    (id: string, date: string, start: number) => {
      if (!state) return;
      const appt = state.appointments.find((a) => a.id === id)!;
      const token = date === appt.date ? appt.token : nextToken(appt.doctorId, date, state.appointments);
      dispatch({ type: "patchAppointment", id, patch: { date, start, token, status: "scheduled" } });
      toast.success("Appointment rescheduled", { description: `${patientName(appt.patientId)} · ${formatMinutes(start)}` });
    },
    [state, patientName],
  );

  const markPaid = useCallback((id: string) => {
    dispatch({ type: "patchAppointment", id, patch: { paid: true } });
    toast.success("Payment recorded");
  }, []);

  const setDoctorStatus = useCallback(
    (doctorId: string, status: DoctorStatus) => {
      dispatch({ type: "doctorStatus", doctorId, status });
      const name = state?.doctors.find((d) => d.id === doctorId)?.name ?? "Doctor";
      dispatch({ type: "activity", actor, action: "updated availability", target: `${name} → ${status.replace("-", " ")}`, kind: "staff" });
    },
    [state?.doctors, actor],
  );

  const upsertStaff = useCallback((s: StaffMember) => dispatch({ type: "upsertStaff", staff: s }), []);
  const updatePatient = useCallback((p: Patient) => {
    dispatch({ type: "updatePatient", patient: p });
    toast.success("Patient details saved");
  }, []);

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
