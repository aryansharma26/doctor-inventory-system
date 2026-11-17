import { registerPatient } from "@/server/opd/repository";
import { assertSameOrigin, fail, newPatientSchema, ok } from "@/server/opd/http";

/** Staff: register a patient at the desk. TODO(auth): require a staff session. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = newPatientSchema.parse(await request.json());
    return ok({ patient: await registerPatient({ ...input, email: input.email || undefined }) }, 201);
  } catch (e) {
    return fail(e);
  }
}
