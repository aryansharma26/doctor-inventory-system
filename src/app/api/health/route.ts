import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "MediStock Next.js Fullstack",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    database: "PostgreSQL Prisma",
  });
}
