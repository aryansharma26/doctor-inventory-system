import { z } from "zod";
import { lookupByPhone } from "@/server/opd/repository";
import { assertSameOrigin, fail, ok, phoneSchema } from "@/server/opd/http";

/**
 * Public: returning patients for a mobile number, names shortened.
 * TODO(auth): verify the number with an SMS OTP before revealing anything.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { phone } = z.object({ phone: phoneSchema }).parse(await request.json());
    return ok({ patients: await lookupByPhone(phone) });
  } catch (e) {
    return fail(e);
  }
}
