import { connection } from "next/server";
import { z } from "zod";
import { bookingStatus } from "@/server/opd/repository";
import { fail, ok } from "@/server/opd/http";

/** Public: live status of one booking, by its unguessable id. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    const { id } = await params;
    return ok(await bookingStatus(z.string().uuid().parse(id)));
  } catch (e) {
    return fail(e);
  }
}
