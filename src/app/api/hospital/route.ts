import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/features/hospital/auth";
import {
  actionSchema,
  checkOrigin,
  HospitalError,
  mutateHospital,
  staffSnapshot,
} from "@/features/hospital/server";

function failure(error: unknown) {
  if (error instanceof z.ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || "Check your input." },
      { status: 400 },
    );
  if (error instanceof HospitalError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error("Hospital request failed", error);
  return NextResponse.json(
    { error: "Unable to save right now. Please try again." },
    { status: 500 },
  );
}
export async function GET() {
  try {
    const staff = await requireStaff();
    return NextResponse.json(staffSnapshot(staff), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const staff = await requireStaff();
    const input = actionSchema.parse(await request.json());
    const result = mutateHospital(input, staff);
    const state = staffSnapshot(staff);
    const visibleResult =
      result && "id" in result
        ? state.visits.find((v) => v.id === result.id) ||
          state.invoices.find((i) => i.id === result.id) ||
          state.messages.find((m) => m.id === result.id)
        : undefined;
    return NextResponse.json({ state, result: visibleResult });
  } catch (error) {
    return failure(error);
  }
}
