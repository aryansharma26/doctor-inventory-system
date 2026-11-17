import "server-only";
import {
  type AppointmentStatus as DbStatus,
  type BookingChannel as DbChannel,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CURRENT_CLINIC_UUID, CURRENT_HOSPITAL_ID, DEMO_NOW, DEMO_TODAY, DOCTORS } from "@/mocks/catalog";
import { slotsFor } from "@/mocks/scheduling";
import type { Appointment, AppointmentStatus, BookingChannel, Doctor, Gender, Patient } from "@/mocks/types";

/*
 * OPD data access (Supabase Postgres via Prisma).
 * Converts between database rows and the UI types in src/mocks/types.ts.
 *
 * Clock: the UI still runs on the fixed demo day (DEMO_TODAY / DEMO_NOW in
 * src/mocks/catalog.ts); check-in and consultation times use that clock too.
 */

/** Front-desk user that reception actions are recorded against. */
export const RECEPTION_USER_ID = "00000000-0000-4000-b000-000000000004";
/** System user that online bookings are recorded against. */
export const ONLINE_BOOKING_USER_ID = "00000000-0000-4000-b000-000000000005";

const IST_OFFSET_MIN = 330; // Asia/Kolkata, no daylight saving

export class OpdError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------ Time helpers */

export function toInstant(date: string, minutes: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!) + (minutes - IST_OFFSET_MIN) * 60_000);
}
function localMinutes(instant: Date) {
  const total = Math.round(instant.getTime() / 60_000) + IST_OFFSET_MIN;
  return ((total % 1440) + 1440) % 1440;
}
function localDate(instant: Date) {
  return new Date(instant.getTime() + IST_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}
function dateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

/* -------------------------------------------------------------- Enum maps */

const STATUS_TO_UI: Record<DbStatus, AppointmentStatus> = {
  BOOKED: "scheduled",
  CONFIRMED: "scheduled",
  CHECKED_IN: "waiting",
  IN_CONSULTATION: "in-consultation",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
};
const STATUS_TO_DB: Record<AppointmentStatus, DbStatus> = {
  scheduled: "BOOKED",
  waiting: "CHECKED_IN",
  "in-consultation": "IN_CONSULTATION",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  "no-show": "NO_SHOW",
};
const CHANNEL_TO_UI: Record<DbChannel, BookingChannel> = { WALK_IN: "walk-in", ONLINE: "online", PHONE: "phone" };
const CHANNEL_TO_DB: Record<BookingChannel, DbChannel> = { "walk-in": "WALK_IN", online: "ONLINE", phone: "PHONE" };

/* ------------------------------------------------------------ Doctor maps */

const doctorByMembership = new Map(DOCTORS.map((d) => [d.membershipId, d]));
export function doctorFor(id: string): Doctor {
  const d = DOCTORS.find((x) => x.id === id && x.hospitalId === CURRENT_HOSPITAL_ID);
  if (!d) throw new OpdError("Unknown doctor.", 404);
  return d;
}

/* --------------------------------------------------- Clinic-scoped access */

type Tx = Prisma.TransactionClient;

/** Runs `fn` in a transaction with the clinic context the row-level security policies read. */
export function inClinic<T>(fn: (tx: Tx) => Promise<T>) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.clinic_id', ${CURRENT_CLINIC_UUID}, true)`;
      return fn(tx);
    },
    { maxWait: 15_000, timeout: 30_000 },
  );
}

/* --------------------------------------------------------------- Mapping */

const patientInclude = {
  allergies: { where: { status: "ACTIVE" as const }, select: { allergen: true } },
  medicalHistories: { where: { status: "ACTIVE" as const, isChronic: true }, select: { condition: true } },
} satisfies Prisma.PatientInclude;
type PatientRow = Prisma.PatientGetPayload<{ include: typeof patientInclude }>;

type Address = { line?: string; city?: string };
type Emergency = { name: string; relation: string; phone: string };

function toPatient(row: PatientRow): Patient {
  const address = (row.address ?? {}) as Address;
  return {
    id: row.id,
    uhid: row.patientCode,
    name: row.name,
    gender: (row.gender as Gender) ?? "Other",
    dob: row.dateOfBirth ? row.dateOfBirth.toISOString().slice(0, 10) : "",
    phone: row.phone ?? "",
    email: row.email ?? undefined,
    bloodGroup: row.bloodGroup ?? "Unknown",
    city: address.city ?? "Pune",
    address: address.line ?? "",
    abhaId: row.abhaId ?? undefined,
    allergies: row.allergies.map((a) => a.allergen),
    conditions: row.medicalHistories.map((m) => m.condition),
    emergencyContact: (row.emergencyContact as Emergency | null) ?? undefined,
    registeredOn: localDate(row.createdAt),
    tags: row.tags,
  };
}

const appointmentInclude = {
  vitals: { orderBy: { recordedAt: "desc" as const }, take: 1 },
} satisfies Prisma.AppointmentInclude;
type AppointmentRow = Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;

function toAppointment(row: AppointmentRow): Appointment | null {
  const doctor = doctorByMembership.get(row.doctorMembershipId);
  if (!doctor) return null;
  const v = row.vitals[0];
  const date = row.tokenDate ? row.tokenDate.toISOString().slice(0, 10) : localDate(row.startsAt);
  return {
    id: row.id,
    token: row.tokenNumber ?? 0,
    patientId: row.patientId,
    doctorId: doctor.id,
    departmentId: doctor.departmentId,
    hospitalId: CURRENT_HOSPITAL_ID,
    date,
    start: localMinutes(row.startsAt),
    duration: Math.round((row.endsAt.getTime() - row.startsAt.getTime()) / 60_000),
    visitType: row.type === "FOLLOW_UP" ? "follow-up" : "new",
    channel: CHANNEL_TO_UI[row.channel],
    status: STATUS_TO_UI[row.status],
    reason: row.reason ?? "Consultation",
    checkedInAt: row.checkedInAt ? localMinutes(row.checkedInAt) : undefined,
    startedAt: row.consultationStartedAt ? localMinutes(row.consultationStartedAt) : undefined,
    completedAt: row.completedAt ? localMinutes(row.completedAt) : undefined,
    fee: row.fee ? Number(row.fee) : 0,
    paid: row.isPaid,
    vitals: v
      ? {
          bp: v.systolicBp && v.diastolicBp ? `${v.systolicBp}/${v.diastolicBp}` : "-",
          pulse: v.heartRate ?? 0,
          tempF: v.temperatureCelsius ? Math.round((Number(v.temperatureCelsius) * 9) / 5 * 10 + 320) / 10 : 0,
          spo2: v.oxygenSaturation ? Number(v.oxygenSaturation) : 0,
          weightKg: v.weightKg ? Number(v.weightKg) : 0,
        }
      : undefined,
  };
}

/* ----------------------------------------------------------------- Reads */

/**
 * All patients and appointments: two queries run in parallel, each loading its
 * relations with a single JOIN. Filtered by clinic explicitly.
 * TODO(rls): under the restricted runtime role (prisma/runtime-role.sql), reads
 * must run through inClinic() so the row-level security policies see the clinic.
 */
export async function workspace() {
  const [patients, appointments] = await Promise.all([
    prisma.patient.findMany({
      relationLoadStrategy: "join",
      where: { clinicId: CURRENT_CLINIC_UUID, isActive: true },
      include: patientInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.appointment.findMany({
      relationLoadStrategy: "join",
      where: { clinicId: CURRENT_CLINIC_UUID },
      include: appointmentInclude,
      orderBy: { startsAt: "asc" },
    }),
  ]);
  return {
    patients: patients.map(toPatient),
    appointments: appointments.map(toAppointment).filter((a): a is Appointment => a !== null),
  };
}

/** Booked slots for the public booking page. No patient data. */
export async function takenSlots(fromDate: string, toDate: string) {
  const rows = await prisma.appointment.findMany({
    where: {
      clinicId: CURRENT_CLINIC_UUID,
      status: { not: "CANCELLED" },
      tokenDate: { gte: dateOnly(fromDate), lte: dateOnly(toDate) },
    },
    select: { doctorMembershipId: true, startsAt: true, tokenDate: true },
  });
  return rows.flatMap((r) => {
    const doctor = doctorByMembership.get(r.doctorMembershipId);
    return doctor ? [{ doctorId: doctor.id, date: r.tokenDate!.toISOString().slice(0, 10), start: localMinutes(r.startsAt) }] : [];
  });
}

/** Returning patients for a mobile number, with names shortened (e.g. "Sneha P."). */
export async function lookupByPhone(phone: string) {
  const rows = await prisma.patient.findMany({
    where: { clinicId: CURRENT_CLINIC_UUID, phone, isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => {
    const [first, ...rest] = r.name.split(/\s+/);
    return { id: r.id, displayName: rest.length ? `${first} ${rest[rest.length - 1]![0]}.` : first! };
  });
}

/** Public status of one booking (looked up by its unguessable id). */
export async function bookingStatus(id: string) {
  const row = await prisma.appointment.findFirst({
    relationLoadStrategy: "join",
    where: { id, clinicId: CURRENT_CLINIC_UUID },
    include: { ...appointmentInclude, patient: { select: { name: true, phone: true } } },
  });
  const appointment = row && toAppointment(row);
  if (!row || !appointment) throw new OpdError("Booking not found.", 404);
  const ahead = await prisma.appointment.count({
    where: {
      clinicId: CURRENT_CLINIC_UUID,
      doctorMembershipId: row.doctorMembershipId,
      tokenDate: row.tokenDate,
      status: { in: ["BOOKED", "CONFIRMED", "CHECKED_IN", "IN_CONSULTATION"] },
      startsAt: { lt: row.startsAt },
      id: { not: row.id },
    },
  });
  const phone = row.patient.phone ?? "";
  return {
    appointment,
    patient: { name: row.patient.name, phoneMasked: phone ? `${phone.slice(0, 2)}xxxxx${phone.slice(-3)}` : "" },
    ahead,
  };
}

/* ---------------------------------------------------------------- Writes */

export type NewPatient = {
  name: string;
  phone: string;
  gender: Gender;
  dob: string;
  bloodGroup?: string;
  email?: string;
  address?: string;
  abhaId?: string;
  allergies?: string[];
  emergencyContact?: Emergency;
  tags?: string[];
};

async function nextPatientCode(tx: Tx) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('patient-code'))`;
  const rows = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING("patientCode" FROM 5) AS INTEGER)) AS max
    FROM "Patient" WHERE "clinicId" = ${CURRENT_CLINIC_UUID}::uuid AND "patientCode" ~ '^AMH-[0-9]+$'`;
  return `AMH-${String((rows[0]?.max ?? 240100) + 1).padStart(6, "0")}`;
}

async function insertPatient(tx: Tx, input: NewPatient, recordedById: string) {
  const patient = await tx.patient.create({
    data: {
      clinicId: CURRENT_CLINIC_UUID,
      patientCode: await nextPatientCode(tx),
      name: input.name.trim(),
      phone: input.phone,
      email: input.email || null,
      gender: input.gender,
      dateOfBirth: dateOnly(input.dob),
      bloodGroup: input.bloodGroup || "Unknown",
      address: { line: input.address ?? "", city: "Pune" },
      abhaId: input.abhaId || null,
      emergencyContact: input.emergencyContact ?? Prisma.JsonNull,
      tags: input.tags ?? ["New"],
    },
  });
  for (const allergen of input.allergies ?? []) {
    await tx.allergy.create({
      data: { clinicId: CURRENT_CLINIC_UUID, patientId: patient.id, recordedById, allergen, allergyType: "Reported by patient" },
    });
  }
  return tx.patient.findUniqueOrThrow({ where: { id: patient.id }, include: patientInclude });
}

export async function registerPatient(input: NewPatient) {
  return inClinic(async (tx) => toPatient(await insertPatient(tx, input, RECEPTION_USER_ID)));
}

export async function updatePatient(
  id: string,
  input: Partial<Pick<NewPatient, "name" | "phone" | "email" | "address" | "abhaId" | "allergies">>,
) {
  return inClinic(async (tx) => {
    const existing = await tx.patient.findFirst({ where: { id, clinicId: CURRENT_CLINIC_UUID } });
    if (!existing) throw new OpdError("Patient not found.", 404);
    const address = (existing.address ?? {}) as Address;
    await tx.patient.update({
      where: { id },
      data: {
        name: input.name?.trim() ?? undefined,
        phone: input.phone ?? undefined,
        email: input.email === undefined ? undefined : input.email || null,
        abhaId: input.abhaId === undefined ? undefined : input.abhaId || null,
        address: input.address === undefined ? undefined : { ...address, line: input.address },
      },
    });
    if (input.allergies) {
      await tx.allergy.updateMany({
        where: { patientId: id, status: "ACTIVE", allergen: { notIn: input.allergies } },
        data: { status: "INACTIVE" },
      });
      const current = await tx.allergy.findMany({ where: { patientId: id, status: "ACTIVE" }, select: { allergen: true } });
      const have = new Set(current.map((a) => a.allergen));
      for (const allergen of input.allergies.filter((a) => !have.has(a))) {
        await tx.allergy.create({
          data: { clinicId: CURRENT_CLINIC_UUID, patientId: id, recordedById: RECEPTION_USER_ID, allergen, allergyType: "Reported by patient" },
        });
      }
    }
    return toPatient(await tx.patient.findUniqueOrThrow({ where: { id }, include: patientInclude }));
  });
}

type BookingRequest = {
  doctorId: string;
  date: string;
  start: number;
  reason: string;
  channel: BookingChannel;
  createdById: string;
  checkInNow?: boolean;
  /** Use this existing patient (must belong to the clinic). */
  patientId?: string;
  /** Or create this new patient. */
  newPatient?: NewPatient;
  /** When set, an existing patientId must have this mobile number. */
  requirePhone?: string;
};

/**
 * Books a slot and assigns the next token for that doctor and day.
 * Serialised per doctor-day with an advisory lock; unique indexes back it up.
 */
export async function createAppointment(req: BookingRequest) {
  const doctor = doctorFor(req.doctorId);
  const slot = slotsFor(doctor, req.date, []).find((s) => s.start === req.start);
  if (!slot) throw new OpdError(`${doctor.name} has no slot at that time.`);
  if (req.date < DEMO_TODAY || (req.date === DEMO_TODAY && req.start < DEMO_NOW)) throw new OpdError("That time has already passed.");

  try {
    return await inClinic(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${doctor.membershipId}|${req.date}`}))`;

      const startsAt = toInstant(req.date, req.start);
      const clash = await tx.appointment.findFirst({
        where: { clinicId: CURRENT_CLINIC_UUID, doctorMembershipId: doctor.membershipId, startsAt, status: { not: "CANCELLED" } },
        select: { id: true },
      });
      if (clash) throw new OpdError("That time was just booked by someone else. Please pick another slot.", 409);

      let patientId = req.patientId;
      let patientRow: PatientRow;
      if (patientId) {
        const found = await tx.patient.findFirst({ where: { id: patientId, clinicId: CURRENT_CLINIC_UUID }, include: patientInclude });
        if (!found || (req.requirePhone && found.phone !== req.requirePhone)) throw new OpdError("Patient not found.", 404);
        patientRow = found;
      } else if (req.newPatient) {
        patientRow = await insertPatient(tx, req.newPatient, req.createdById);
        patientId = patientRow.id;
      } else {
        throw new OpdError("Patient details are required.");
      }

      const last = await tx.appointment.aggregate({
        where: { clinicId: CURRENT_CLINIC_UUID, doctorMembershipId: doctor.membershipId, tokenDate: dateOnly(req.date) },
        _max: { tokenNumber: true },
      });
      const previousVisit = await tx.appointment.count({
        where: { clinicId: CURRENT_CLINIC_UUID, patientId, doctorMembershipId: doctor.membershipId, status: "COMPLETED" },
      });
      const followUp = previousVisit > 0;
      const checkIn = req.checkInNow && req.date === DEMO_TODAY;

      const row = await tx.appointment.create({
        data: {
          clinicId: CURRENT_CLINIC_UUID,
          patientId: patientId!,
          doctorMembershipId: doctor.membershipId,
          createdById: req.createdById,
          type: followUp ? "FOLLOW_UP" : "CONSULTATION",
          status: checkIn ? "CHECKED_IN" : "BOOKED",
          startsAt,
          endsAt: toInstant(req.date, req.start + doctor.slotMinutes),
          reason: req.reason.trim() || "Consultation",
          checkedInAt: checkIn ? toInstant(DEMO_TODAY, DEMO_NOW) : null,
          tokenNumber: (last._max.tokenNumber ?? 0) + 1,
          tokenDate: dateOnly(req.date),
          channel: CHANNEL_TO_DB[req.channel],
          fee: followUp ? doctor.followUpFee : doctor.fee,
        },
        include: appointmentInclude,
      });
      return { appointment: toAppointment(row)!, patient: toPatient(patientRow) };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new OpdError("That time was just booked by someone else. Please pick another slot.", 409);
    }
    throw e;
  }
}

export type AppointmentChange =
  | { action: "status"; status: AppointmentStatus }
  | { action: "reschedule"; date: string; start: number }
  | { action: "pay" };

export async function changeAppointment(id: string, change: AppointmentChange) {
  return inClinic(async (tx) => {
    const row = await tx.appointment.findFirst({ where: { id, clinicId: CURRENT_CLINIC_UUID } });
    if (!row) throw new OpdError("Appointment not found.", 404);
    const now = toInstant(DEMO_TODAY, DEMO_NOW);

    if (change.action === "pay") {
      await tx.appointment.update({ where: { id }, data: { isPaid: true } });
    } else if (change.action === "status") {
      const s = change.status;
      await tx.appointment.update({
        where: { id },
        data: {
          status: STATUS_TO_DB[s],
          checkedInAt: s === "waiting" ? now : s === "scheduled" ? null : undefined,
          consultationStartedAt: s === "in-consultation" ? now : s === "scheduled" ? null : undefined,
          completedAt: s === "completed" ? now : undefined,
        },
      });
    } else {
      const doctor = doctorByMembership.get(row.doctorMembershipId);
      if (!doctor) throw new OpdError("Unknown doctor.", 404);
      if (!slotsFor(doctor, change.date, []).some((sl) => sl.start === change.start)) throw new OpdError(`${doctor.name} has no slot at that time.`);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${doctor.membershipId}|${change.date}`}))`;
      const startsAt = toInstant(change.date, change.start);
      const clash = await tx.appointment.findFirst({
        where: { clinicId: CURRENT_CLINIC_UUID, doctorMembershipId: row.doctorMembershipId, startsAt, status: { not: "CANCELLED" }, id: { not: id } },
        select: { id: true },
      });
      if (clash) throw new OpdError("That slot is already booked.", 409);
      const sameDay = row.tokenDate?.toISOString().slice(0, 10) === change.date;
      const last = sameDay
        ? null
        : await tx.appointment.aggregate({
            where: { clinicId: CURRENT_CLINIC_UUID, doctorMembershipId: row.doctorMembershipId, tokenDate: dateOnly(change.date) },
            _max: { tokenNumber: true },
          });
      await tx.appointment.update({
        where: { id },
        data: {
          startsAt,
          endsAt: toInstant(change.date, change.start + doctor.slotMinutes),
          status: "BOOKED",
          checkedInAt: null,
          consultationStartedAt: null,
          tokenDate: dateOnly(change.date),
          tokenNumber: sameDay ? row.tokenNumber : (last?._max.tokenNumber ?? 0) + 1,
        },
      });
    }
    const updated = await tx.appointment.findUniqueOrThrow({ where: { id }, include: appointmentInclude });
    return toAppointment(updated)!;
  });
}
