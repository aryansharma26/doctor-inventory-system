import { z } from "zod";
import { changeAppointment } from "@/server/opd/repository";
import { assertSameOrigin, dateSchema, fail, ok } from "@/server/opd/http";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    status: z.enum(["scheduled", "waiting", "in-consultation", "completed", "cancelled", "no-show"]),
  }),
  z.object({ action: z.literal("reschedule"), date: dateSchema, start: z.number().int().min(0).max(1439) }),
  z.object({ action: z.literal("pay") }),
]);

/** Staff: check in, call in, complete, cancel, reschedule or record payment. TODO(auth): require a staff session. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const appointment = await changeAppointment(z.string().uuid().parse(id), schema.parse(await request.json()));
    return ok({ appointment });
  } catch (e) {
    return fail(e);
  }
}
