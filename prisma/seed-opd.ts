/*
 * Seeds the OPD demo data into the database: 1 hospital, 3 doctors,
 * front-desk users, 7 patients and their appointments.
 * Safe to re-run (upserts by fixed ids).
 *
 *   npm run db:seed:opd
 */
import { PrismaClient } from "@prisma/client";
import { CURRENT_CLINIC_UUID, DOCTORS, HOSPITALS } from "../src/mocks/catalog";
import { APPOINTMENTS, PATIENTS } from "../src/mocks/records";

const prisma = new PrismaClient({ datasourceUrl: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL });

const IST = 330;
const at = (date: string, minutes: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!) + (minutes - IST) * 60_000);
};
const day = (date: string) => new Date(`${date}T00:00:00.000Z`);

const RECEPTION = { userId: "00000000-0000-4000-b000-000000000004", membershipId: "00000000-0000-4000-c000-000000000004" };
const ONLINE = { userId: "00000000-0000-4000-b000-000000000005", membershipId: "00000000-0000-4000-c000-000000000005" };

const STATUS = {
  scheduled: "BOOKED",
  waiting: "CHECKED_IN",
  "in-consultation": "IN_CONSULTATION",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  "no-show": "NO_SHOW",
} as const;
const CHANNEL = { "walk-in": "WALK_IN", online: "ONLINE", phone: "PHONE" } as const;

async function main() {
  const h = HOSPITALS[0]!;
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.clinic_id', ${CURRENT_CLINIC_UUID}, true)`;

    await tx.clinic.upsert({
      where: { id: CURRENT_CLINIC_UUID },
      update: { name: h.name, phone: h.phone, email: h.email, status: "ACTIVE" },
      create: {
        id: CURRENT_CLINIC_UUID,
        code: "AAROGYA-PUNE",
        name: h.name,
        email: h.email,
        phone: h.phone,
        address: { line: h.address, area: h.area, city: h.city, pincode: h.pincode },
        timezone: "Asia/Kolkata",
        currency: "INR",
        status: "ACTIVE",
      },
    });

    const users = [
      ...DOCTORS.map((d) => ({ id: d.userId, membershipId: d.membershipId, email: `${d.id.slice(2)}@aarogyahospital.in`, fullName: d.name, role: "DOCTOR" as const })),
      { id: RECEPTION.userId, membershipId: RECEPTION.membershipId, email: "pooja.kale@aarogyahospital.in", fullName: "Pooja Kale", role: "RECEPTIONIST" as const },
      { id: ONLINE.userId, membershipId: ONLINE.membershipId, email: "online-booking@aarogyahospital.in", fullName: "Online booking", role: "STAFF" as const },
    ];
    for (const u of users) {
      await tx.user.upsert({ where: { id: u.id }, update: { fullName: u.fullName }, create: { id: u.id, email: u.email, fullName: u.fullName } });
      await tx.userClinic.upsert({
        where: { id: u.membershipId },
        update: { role: u.role, isActive: true },
        create: { id: u.membershipId, userId: u.id, clinicId: CURRENT_CLINIC_UUID, role: u.role },
      });
    }

    for (const d of DOCTORS) {
      await tx.doctorAvailability.deleteMany({ where: { doctorMembershipId: d.membershipId } });
      for (const [dayOfWeek, sessions] of d.weekly.entries()) {
        for (const s of sessions) {
          await tx.doctorAvailability.create({
            data: { clinicId: CURRENT_CLINIC_UUID, doctorMembershipId: d.membershipId, dayOfWeek, startMinutes: s.start, endMinutes: s.end, slotDurationMinutes: d.slotMinutes },
          });
        }
      }
    }

    const recorder = DOCTORS[0]!.userId;
    for (const p of PATIENTS) {
      const data = {
        clinicId: CURRENT_CLINIC_UUID,
        patientCode: p.uhid,
        name: p.name,
        phone: p.phone,
        email: p.email ?? null,
        gender: p.gender,
        dateOfBirth: day(p.dob),
        bloodGroup: p.bloodGroup,
        address: { line: p.address, city: p.city },
        abhaId: p.abhaId ?? null,
        emergencyContact: p.emergencyContact ?? undefined,
        tags: p.tags,
        createdAt: at(p.registeredOn, 9 * 60),
      };
      await tx.patient.upsert({ where: { id: p.id }, update: data, create: { id: p.id, ...data } });
      await tx.allergy.deleteMany({ where: { patientId: p.id } });
      await tx.medicalHistory.deleteMany({ where: { patientId: p.id } });
      for (const allergen of p.allergies) {
        await tx.allergy.create({ data: { clinicId: CURRENT_CLINIC_UUID, patientId: p.id, recordedById: recorder, allergen, allergyType: "Drug/Food", severity: "MODERATE" } });
      }
      for (const condition of p.conditions) {
        await tx.medicalHistory.create({ data: { clinicId: CURRENT_CLINIC_UUID, patientId: p.id, recordedById: recorder, condition, isChronic: true } });
      }
    }

    for (const a of APPOINTMENTS) {
      const doctor = DOCTORS.find((d) => d.id === a.doctorId)!;
      const data = {
        clinicId: CURRENT_CLINIC_UUID,
        patientId: a.patientId,
        doctorMembershipId: doctor.membershipId,
        createdById: a.channel === "online" ? ONLINE.userId : RECEPTION.userId,
        type: a.visitType === "follow-up" ? ("FOLLOW_UP" as const) : ("CONSULTATION" as const),
        status: STATUS[a.status],
        startsAt: at(a.date, a.start),
        endsAt: at(a.date, a.start + a.duration),
        reason: a.reason,
        checkedInAt: a.checkedInAt !== undefined ? at(a.date, a.checkedInAt) : null,
        consultationStartedAt: a.startedAt !== undefined ? at(a.date, a.startedAt) : null,
        completedAt: a.completedAt !== undefined ? at(a.date, a.completedAt) : null,
        tokenNumber: a.token,
        tokenDate: day(a.date),
        channel: CHANNEL[a.channel],
        fee: a.fee,
        isPaid: a.paid,
      };
      await tx.appointment.upsert({ where: { id: a.id }, update: data, create: { id: a.id, ...data } });
      await tx.vital.deleteMany({ where: { appointmentId: a.id } });
      if (a.vitals) {
        const [sys, dia] = a.vitals.bp.split("/").map(Number);
        await tx.vital.create({
          data: {
            clinicId: CURRENT_CLINIC_UUID,
            patientId: a.patientId,
            appointmentId: a.id,
            recordedById: recorder,
            recordedAt: at(a.date, a.checkedInAt ?? a.start),
            systolicBp: Number.isFinite(sys) ? sys : null,
            diastolicBp: Number.isFinite(dia) ? dia : null,
            heartRate: a.vitals.pulse,
            temperatureCelsius: Math.round(((a.vitals.tempF - 32) * 5) / 9 * 100) / 100,
            oxygenSaturation: a.vitals.spo2,
            weightKg: a.vitals.weightKg,
          },
        });
      }
    }
  }, { timeout: 120_000 });

  const counts = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.clinic_id', ${CURRENT_CLINIC_UUID}, true)`;
    return {
      doctors: await tx.userClinic.count({ where: { clinicId: CURRENT_CLINIC_UUID, role: "DOCTOR" } }),
      patients: await tx.patient.count({ where: { clinicId: CURRENT_CLINIC_UUID } }),
      appointments: await tx.appointment.count({ where: { clinicId: CURRENT_CLINIC_UUID } }),
    };
  });
  console.log("Seeded OPD data:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
