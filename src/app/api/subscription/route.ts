import { NextResponse } from "next/server";
import { SAAS_PLANS } from "@/features/subscription/saas-subscription-store";

export async function GET() {
  return NextResponse.json({
    success: true,
    plans: SAAS_PLANS,
    currency: "PHP",
  });
}
