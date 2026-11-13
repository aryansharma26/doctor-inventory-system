import { useQuery } from "@tanstack/react-query";
import { api, apiEnvelope } from "@/lib/api";
import type {
  Appointment,
  DoctorOption,
  MedicineOption,
  PatientOption,
} from "./types";

export const practiceKeys = {
  all: ["practice"] as const,
  doctors: ["practice", "doctors"] as const,
  patients: ["practice", "patients"] as const,
  medicines: ["practice", "medicines"] as const,
  appointments: (from: string, to: string) =>
    ["practice", "appointments", from, to] as const,
  prescriptions: (search: string) =>
    ["practice", "prescriptions", search] as const,
  patientRecord: (patientId: string) =>
    ["practice", "patient-record", patientId] as const,
};

export function usePracticeOptions() {
  const patients = useQuery({
    queryKey: practiceKeys.patients,
    queryFn: () =>
      apiEnvelope<PatientOption[]>("/patients?page=1&pageSize=100"),
  });
  const doctors = useQuery({
    queryKey: practiceKeys.doctors,
    queryFn: () => api<DoctorOption[]>("/practice/doctors"),
  });
  const medicines = useQuery({
    queryKey: practiceKeys.medicines,
    queryFn: () =>
      apiEnvelope<MedicineOption[]>("/medicines?page=1&pageSize=100"),
  });
  return { patients, doctors, medicines };
}

export function useAppointments(from: Date, to: Date) {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return useQuery({
    queryKey: practiceKeys.appointments(fromIso, toIso),
    queryFn: () =>
      api<Appointment[]>(
        `/practice/appointments?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
      ),
  });
}
