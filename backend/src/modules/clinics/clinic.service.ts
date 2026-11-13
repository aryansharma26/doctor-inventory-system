import type { ClinicStatus, Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import { AuditService } from "../audit/audit.service.js";
import { ClinicRepository } from "./clinic.repository.js";

export class ClinicService {
  constructor(
    private readonly repository = new ClinicRepository(),
    private readonly audit = new AuditService()
  ) {}

  async list(page: number, pageSize: number, search?: string) {
    const [data, total] = await this.repository.list(page, pageSize, search);
    return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async get(id: string) {
    const clinic = await this.repository.findById(id);
    if (!clinic) throw new ApiError(404, "CLINIC_NOT_FOUND", "Clinic was not found");
    return clinic;
  }

  async create(data: Prisma.ClinicCreateInput, actorId: string, requestId: string) {
    const clinic = await this.repository.create(data);
    await this.audit.record({ actorId, action: "clinic.created", entityType: "Clinic", entityId: clinic.id, after: clinic, requestId });
    return clinic;
  }

  async update(id: string, data: Prisma.ClinicUpdateInput, actorId: string, requestId: string) {
    const before = await this.get(id);
    const clinic = await this.repository.update(id, data);
    await this.audit.record({ actorId, action: "clinic.updated", entityType: "Clinic", entityId: id, before, after: clinic, requestId });
    return clinic;
  }

  async setStatus(id: string, status: ClinicStatus, actorId: string, requestId: string) {
    const before = await this.get(id);
    const clinic = await this.repository.setStatus(id, status);
    await this.audit.record({ actorId, action: `clinic.${status.toLowerCase()}`, entityType: "Clinic", entityId: id, before, after: clinic, requestId });
    return clinic;
  }

  async remove(id: string, actorId: string, requestId: string) {
    const before = await this.get(id);
    await this.repository.softDelete(id);
    await this.audit.record({ actorId, action: "clinic.archived", entityType: "Clinic", entityId: id, before, requestId });
  }
}

