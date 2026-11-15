import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkOrigin,
  HospitalError,
  manageBooking,
  manageBookingSchema,
} from "@/features/hospital/server";
const requests = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const limit = requests.get(ip);
    if (limit && limit.until > Date.now() && limit.count >= 40)
      throw new HospitalError(
        "Too many requests. Try again in a few minutes.",
        429,
      );
    requests.set(ip, {
      count: limit && limit.until > Date.now() ? limit.count + 1 : 1,
      until: Date.now() + 60000,
    });
    const booking = manageBooking(
      manageBookingSchema.parse(await request.json()),
    );
    return NextResponse.json(
      { booking },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof HospitalError
            ? e.message
            : e instanceof z.ZodError
              ? e.issues[0]?.message
              : "Unable to check the booking.",
      },
      { status: e instanceof HospitalError ? e.status : 400 },
    );
  }
}
