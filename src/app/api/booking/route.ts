import { NextResponse } from "next/server";
import { z } from "zod";
import {
  availableSlots,
  bookingSchema,
  checkOrigin,
  createBooking,
  HospitalError,
} from "@/features/hospital/server";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return NextResponse.json(
      {
        slots: availableSlots(
          params.get("doctor") || "",
          params.get("date") || "",
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof HospitalError
            ? error.message
            : "Unable to load available times.",
      },
      { status: error instanceof HospitalError ? error.status : 400 },
    );
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const booking = createBooking(bookingSchema.parse(await request.json()));
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message
        : error instanceof HospitalError
          ? error.message
          : "We couldn't book your appointment. Please try again.";
    return NextResponse.json(
      { error: message },
      { status: error instanceof HospitalError ? error.status : 400 },
    );
  }
}
