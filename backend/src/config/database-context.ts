import type { Prisma } from "@prisma/client";
import { prisma } from "./database.js";

export type TransactionClient = Prisma.TransactionClient;

export async function withTenant<T>(
  clinicId: string,
  operation: (tx: TransactionClient) => Promise<T>,
  options?: { isolationLevel?: Prisma.TransactionIsolationLevel }
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.clinic_id', ${clinicId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.is_platform_admin', 'false', true)`;
    return operation(tx);
  }, options);
}

export async function withPlatform<T>(operation: (tx: TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.is_platform_admin', 'true', true)`;
    return operation(tx);
  });
}

