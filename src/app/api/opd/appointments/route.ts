import { z } from "zod";
import { createAppointment, RECEPTION_USER_ID } from "@/server/opd/repository";
import { assertSameOrigin, dateSchema, fail, ok } from "@/server/opd/http";

const schema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().min(1),
  date: dateSchema,
  start: z.number().int().min(0).max(1439),
  channel: z.enum(["walk-in", "phone"]),
  reason: z.string().max(300).default(""),
  checkInNow: z.boolean().optional(),
});

/** Staff: reception books an appointment. TODO(auth): require a staff session. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    const result = await createAppointment({ ...input, createdById: RECEPTION_USER_ID });
    return ok({ appointment: result.appointment }, 201);
  } catch (e) {
    return fail(e);
  }
}
