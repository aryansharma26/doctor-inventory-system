/*
 * MOCK API BOUNDARY
 * -----------------
 * Every screen in the new UI reads data through the functions in this folder.
 * Today they resolve in-memory mock data after a short simulated latency.
 * To integrate a backend, replace each function body with a fetch() to the
 * endpoint noted in its comment; the return types stay the same.
 */
import { APPOINTMENTS, CONSULTATIONS, HOSPITAL_ACTIVITY, PATIENTS, STAFF } from "@/mocks/records";
import { CURRENT_HOSPITAL_ID, DEPARTMENTS, DOCTORS, HOSPITALS } from "@/mocks/catalog";
import type {
  ActivityItem,
  Appointment,
  Consultation,
  Department,
  Doctor,
  Hospital,
  Patient,
  StaffMember,
} from "@/mocks/types";

const LATENCY_MS = 350;

function respond<T>(value: T, ms = LATENCY_MS): Promise<T> {
  // structuredClone keeps callers from mutating the shared seed data.
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

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

/** TODO(api): GET /api/hospitals/:id/workspace */
export function fetchHospitalWorkspace(hospitalId = CURRENT_HOSPITAL_ID): Promise<HospitalSnapshot> {
  return respond({
    hospital: HOSPITALS.find((h) => h.id === hospitalId)!,
    departments: DEPARTMENTS,
    doctors: DOCTORS.filter((d) => d.hospitalId === hospitalId),
    patients: PATIENTS,
    appointments: APPOINTMENTS.filter((a) => a.hospitalId === hospitalId),
    consultations: CONSULTATIONS,
    staff: STAFF,
    activity: HOSPITAL_ACTIVITY,
  });
}

/** TODO(api): GET /api/public/hospitals */
export function fetchPublicHospitals(): Promise<Hospital[]> {
  return respond(HOSPITALS);
}

/** TODO(api): GET /api/public/doctors */
export function fetchPublicDoctors(): Promise<Doctor[]> {
  return respond(DOCTORS);
}
