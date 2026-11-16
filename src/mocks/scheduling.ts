import { weekdayOf } from "@/design-system/format";
import { DEMO_NOW, DEMO_TODAY } from "./catalog";
import type { Appointment, Doctor } from "./types";

export type Slot = { start: number; end: number; taken: boolean; past: boolean };

/** All slots a doctor offers on a date, marked taken / past. */
export function slotsFor(doctor: Doctor, date: string, appointments: Appointment[]): Slot[] {
  const sessions = doctor.weekly[weekdayOf(date)] ?? [];
  const booked = new Set(
    appointments
      .filter((a) => a.doctorId === doctor.id && a.date === date && a.status !== "cancelled")
      .map((a) => a.start),
  );
  const slots: Slot[] = [];
  for (const s of sessions) {
    for (let t = s.start; t + doctor.slotMinutes <= s.end; t += doctor.slotMinutes) {
      slots.push({
        start: t,
        end: t + doctor.slotMinutes,
        taken: booked.has(t),
        past: date < DEMO_TODAY || (date === DEMO_TODAY && t < DEMO_NOW),
      });
    }
  }
  return slots;
}

export function openSlots(doctor: Doctor, date: string, appointments: Appointment[]) {
  return slotsFor(doctor, date, appointments).filter((s) => !s.taken && !s.past);
}

export function nextToken(doctorId: string, date: string, appointments: Appointment[]) {
  return (
    appointments
      .filter((a) => a.doctorId === doctorId && a.date === date)
      .reduce((max, a) => Math.max(max, a.token), 0) + 1
  );
}

export function worksOn(doctor: Doctor, date: string) {
  return (doctor.weekly[weekdayOf(date)] ?? []).length > 0;
}

export function sessionLabel(start: number) {
  if (start < 12 * 60) return "Morning";
  if (start < 16 * 60) return "Afternoon";
  return "Evening";
}

/** Token display code, e.g. "AM-07" for Dr. Arjun Mehta's 7th patient. */
export function tokenCode(doctor: Pick<Doctor, "name">, token: number) {
  const letters = doctor.name
    .replace(/^Dr\.?\s+/, "")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return `${letters}-${String(token).padStart(2, "0")}`;
}
