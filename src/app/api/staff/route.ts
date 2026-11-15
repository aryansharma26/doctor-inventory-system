import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { checkOrigin, HospitalError, isDemo } from "@/features/hospital/server";
import { getStaffSession, signInStaff } from "@/features/hospital/auth";

const attempts = new Map<string, { count: number; until: number }>();
export async function GET() {
  const staff = await getStaffSession();
  return NextResponse.json(
    { staff, role: staff?.role || null, demo: isDemo() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const attempt = attempts.get(ip);
    if (attempt && attempt.until > Date.now() && attempt.count >= 10)
      throw new HospitalError(
        "Too many attempts. Try again in 15 minutes.",
        429,
      );
    const { username, password } = z
      .object({
        username: z.string().trim().min(1).max(100),
        password: z.string().min(1).max(200),
      })
      .parse(await request.json());
    let staff;
    try {
      staff = await signInStaff(username, password);
    } catch (error) {
      attempts.set(ip, {
        count: attempt && attempt.until > Date.now() ? attempt.count + 1 : 1,
        until: Date.now() + 15 * 60000,
      });
      throw error;
    }
    attempts.delete(ip);
    return NextResponse.json({ staff, role: staff.role, demo: isDemo() });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof HospitalError
            ? error.message
            : "Check your sign-in details.",
      },
      { status: error instanceof HospitalError ? error.status : 400 },
    );
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    (await cookies()).delete("hospital_session");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to sign out." }, { status: 400 });
  }
}
