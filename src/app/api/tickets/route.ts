import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      {
        id: "ticket-101",
        tokenNo: "OPD-101",
        patientName: "Maria Santos",
        status: "IN_CONSULTATION",
        feePhp: 600,
        paymentMethod: "GCASH",
      },
      {
        id: "ticket-102",
        tokenNo: "OPD-102",
        patientName: "Juan Dela Cruz",
        status: "WAITING",
        feePhp: 600,
        paymentMethod: "MAYA",
      },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: "Ticket created successfully",
      ticket: body,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid payload" },
      { status: 400 }
    );
  }
}
