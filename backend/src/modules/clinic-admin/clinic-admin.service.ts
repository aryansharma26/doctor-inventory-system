import type { Prisma, Role } from "@prisma/client";
import { supabaseAdmin } from "../../config/supabase.js";
import { ApiError } from "../../utils/api-error.js";
import { AuditService } from "../audit/audit.service.js";
import { ClinicAdminRepository } from "./clinic-admin.repository.js";

export class ClinicAdminService {
  constructor(private readonly repository = new ClinicAdminRepository(), private readonly audit = new AuditService()) {}
  getSettings(clinicId: string) { return this.repository.getSettings(clinicId); }
  listUsers(clinicId: string) { return this.repository.listUsers(clinicId); }
  async updateSettings(clinicId: string, userId: string, requestId: string, data: Parameters<ClinicAdminRepository["updateSettings"]>[1]) {
    const result = await this.repository.updateSettings(clinicId, data);
    await this.audit.record({ clinicId, actorId: userId, action: "clinic.settings.updated", entityType: "Clinic", entityId: clinicId, requestId });
    return result;
  }
  async invite(clinicId: string, actorId: string, requestId: string, data: { email: string; fullName: string; role: Role }) {
    const { data: invitation, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { data: { full_name: data.fullName } });
    if (error || !invitation.user) throw new ApiError(502, "INVITATION_FAILED", error?.message ?? "Supabase did not create the invitation");
    const result = await this.repository.addMembership(clinicId, { id: invitation.user.id, email: data.email, fullName: data.fullName }, data.role);
    await this.audit.record({ clinicId, actorId, action: "membership.invited", entityType: "UserClinic", entityId: result.id, requestId });
    return result;
  }
  async updateMembership(clinicId: string, actorId: string, requestId: string, id: string, isActive: boolean) {
    const result = await this.repository.updateMembership(clinicId, id, isActive);
    await this.audit.record({ clinicId, actorId, action: isActive ? "membership.activated" : "membership.deactivated", entityType: "UserClinic", entityId: id, requestId, after: { isActive } as Prisma.InputJsonValue });
    return result;
  }
}
