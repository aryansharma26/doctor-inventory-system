import { connection } from "next/server";
import { workspace } from "@/server/opd/repository";
import { fail, ok } from "@/server/opd/http";

/** Staff: all patients and appointments for the hospital. TODO(auth): require a staff session. */
export async function GET() {
  await connection();
  try {
    return ok(await workspace());
  } catch (e) {
    return fail(e);
  }
}
