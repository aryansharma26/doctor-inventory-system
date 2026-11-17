import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { OpdError } from "./repository";

const NO_STORE = { "Cache-Control": "no-store" };

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function fail(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Check your input." }, { status: 400, headers: NO_STORE });
  }
  if (error instanceof OpdError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
  }
  console.error("OPD request failed", error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500, headers: NO_STORE });
}

/** Rejects cross-site writes (a basic CSRF guard for cookie-less JSON endpoints). */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host || new URL(origin).host !== host) throw new OpdError("Cross-site request blocked.", 403);
}

export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, "").slice(-10))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
export const genderSchema = z.enum(["Female", "Male", "Other"]);
export const newPatientSchema = z.object({
  name: z.string().trim().min(2, "Enter the patient's full name").max(120),
  phone: phoneSchema,
  gender: genderSchema,
  dob: dateSchema,
  bloodGroup: z.string().max(10).optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  abhaId: z.string().max(40).optional(),
  allergies: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  emergencyContact: z
    .object({ name: z.string().max(120), relation: z.string().max(40), phone: z.string().max(20) })
    .optional(),
});
