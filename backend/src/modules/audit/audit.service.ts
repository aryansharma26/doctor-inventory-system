import type { Prisma } from "@prisma/client";
import { withPlatform, withTenant } from "../../config/database-context.js";

type AuditInput = {
  clinicId?: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};

export class AuditService {
  record(input: AuditInput) {
    if (input.clinicId) return withTenant(input.clinicId, (tx) => tx.auditLog.create({ data: input }));
    return withPlatform((tx) => tx.auditLog.create({ data: input }));
  }
}
