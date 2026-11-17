import { z } from "zod";
import { createAppointment, ONLINE_BOOKING_USER_ID, OpdError } from "@/server/opd/repository";
import { assertSameOrigin, dateSchema, fail, newPatientSchema, ok, phoneSchema } from "@/server/opd/http";

const bookingSchema = z.object({
  doctorId: z.string().min(1),
  date: dateSchema,
  start: z.number().int().min(0).max(1439),
  reason: z.string().max(300).default(""),
  phone: phoneSchema,
  /** A returning patient chosen from /api/opd/patients/lookup. */
  patientId: z.string().uuid().optional(),
  /** Or a new patient. */
  patient: newPatientSchema.omit({ phone: true }).optional(),
});

/** Public: a patient books an appointment online. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = bookingSchema.parse(await request.json());
    if (!input.patientId && !input.patient) throw new OpdError("Enter the patient's details.");
    const result = await createAppointment({
      doctorId: input.doctorId,
      date: input.date,
      start: input.start,
      reason: input.reason,
      channel: "online",
      createdById: ONLINE_BOOKING_USER_ID,
      patientId: input.patientId,
      requirePhone: input.patientId ? input.phone : undefined,
      newPatient: input.patient
        ? { ...input.patient, email: input.patient.email || undefined, phone: input.phone, tags: ["New", "Online"] }
        : undefined,
    });
    return ok({ id: result.appointment.id }, 201);
  } catch (e) {
    return fail(e);
  }
}
