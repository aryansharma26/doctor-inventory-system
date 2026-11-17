/*
 * DATA SERVICE BOUNDARY
 * ---------------------
 * Every screen in the new UI reads data through the functions in this folder.
 * Patients and appointments come from the database (Supabase, via /api/opd/*).
 * Catalog data (hospital, departments, doctor profiles) and items not yet in
 * the database (consultation notes, staff list, activity feed) are still mock.
 */
import { CONSULTATIONS, HOSPITAL_ACTIVITY, STAFF } from "@/mocks/records";
import { CURRENT_HOSPITAL_ID, DEPARTMENTS, DOCTORS, HOSPITALS } from "@/mocks/catalog";
import type {
  ActivityItem,
  Appointment,
  AppointmentStatus,
  BookingChannel,
  Consultation,
  Department,
  Doctor,
  Gender,
  Hospital,
  Patient,
  StaffMember,
} from "@/mocks/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? "Something went wrong. Please try again.", response.status);
  return data as T;
}

/* ---------------------------------------------------------- Staff side */

export type HospitalSnapshot = {
  hospital: Hospital;
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  staff: StaffMember[];
  activity: ActivityItem[];
};

export function fetchRecords() {
  return api<{ patients: Patient[]; appointments: Appointment[] }>("/api/opd/workspace");
}

export async function fetchHospitalWorkspace(hospitalId = CURRENT_HOSPITAL_ID): Promise<HospitalSnapshot> {
  const records = await fetchRecords();
  return {
    hospital: HOSPITALS.find((h) => h.id === hospitalId)!,
    departments: DEPARTMENTS,
    doctors: DOCTORS.filter((d) => d.hospitalId === hospitalId),
    patients: records.patients,
    appointments: records.appointments,
    consultations: CONSULTATIONS,
    staff: STAFF,
    activity: HOSPITAL_ACTIVITY,
  };
}

export type NewPatientPayload = {
  name: string;
  phone: string;
  gender: Gender;
  dob: string;
  bloodGroup?: string;
  email?: string;
  address?: string;
  abhaId?: string;
  allergies?: string[];
  emergencyContact?: { name: string; relation: string; phone: string };
};

export function apiRegisterPatient(input: NewPatientPayload) {
  return api<{ patient: Patient }>("/api/opd/patients", { method: "POST", body: JSON.stringify(input) }).then((r) => r.patient);
}

export function apiUpdatePatient(
  id: string,
  input: Partial<Pick<Patient, "name" | "phone" | "email" | "address" | "abhaId" | "allergies">>,
) {
  return api<{ patient: Patient }>(`/api/opd/patients/${id}`, { method: "PATCH", body: JSON.stringify(input) }).then((r) => r.patient);
}

export function apiBookAppointment(input: {
  patientId: string;
  doctorId: string;
  date: string;
  start: number;
  channel: Exclude<BookingChannel, "online">;
  reason: string;
  checkInNow?: boolean;
}) {
  return api<{ appointment: Appointment }>("/api/opd/appointments", { method: "POST", body: JSON.stringify(input) }).then(
    (r) => r.appointment,
  );
}

export type AppointmentChange =
  | { action: "status"; status: AppointmentStatus }
  | { action: "reschedule"; date: string; start: number }
  | { action: "pay" };

export function apiChangeAppointment(id: string, change: AppointmentChange) {
  return api<{ appointment: Appointment }>(`/api/opd/appointments/${id}`, { method: "PATCH", body: JSON.stringify(change) }).then(
    (r) => r.appointment,
  );
}

/* -------------------------------------------------------- Patient side */

export type PublicDoctor = Omit<Doctor, "userId" | "membershipId" | "registrationNo">;
export type BookingContext = {
  hospital: Hospital;
  departments: Department[];
  doctors: PublicDoctor[];
  taken: Array<{ doctorId: string; date: string; start: number }>;
};

export function fetchBookingContext() {
  return api<BookingContext>("/api/opd/booking-context");
}

export function lookupPatients(phone: string) {
  return api<{ patients: Array<{ id: string; displayName: string }> }>("/api/opd/patients/lookup", {
    method: "POST",
    body: JSON.stringify({ phone }),
  }).then((r) => r.patients);
}

export function createOnlineBooking(input: {
  doctorId: string;
  date: string;
  start: number;
  reason: string;
  phone: string;
  patientId?: string;
  patient?: { name: string; gender: Gender; dob: string };
}) {
  return api<{ id: string }>("/api/opd/bookings", { method: "POST", body: JSON.stringify(input) }).then((r) => r.id);
}

export type BookingStatus = {
  appointment: Appointment;
  patient: { name: string; phoneMasked: string };
  ahead: number;
};

export function fetchBookingStatus(id: string) {
  return api<BookingStatus>(`/api/opd/bookings/${id}`);
}
