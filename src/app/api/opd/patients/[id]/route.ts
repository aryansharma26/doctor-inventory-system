import { z } from "zod";
import { updatePatient } from "@/server/opd/repository";
import { assertSameOrigin, fail, ok, phoneSchema } from "@/server/opd/http";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: phoneSchema.optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  abhaId: z.string().max(40).optional(),
  allergies: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
});

/** Staff: edit patient details. TODO(auth): require a staff session. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const patient = await updatePatient(z.string().uuid().parse(id), patchSchema.parse(await request.json()));
    return ok({ patient });
  } catch (e) {
    return fail(e);
  }
}
