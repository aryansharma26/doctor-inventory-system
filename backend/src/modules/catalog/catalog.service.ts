import { AuditService } from "../audit/audit.service.js";
import { CatalogRepository } from "./catalog.repository.js";

export class CatalogService {
  constructor(private readonly repository = new CatalogRepository(), private readonly audit = new AuditService()) {}
  list(...args: Parameters<CatalogRepository["list"]>) { return this.repository.list(...args); }
  lookups(clinicId: string) { return this.repository.lookups(clinicId); }
  async createMedicine(clinicId: string, userId: string, requestId: string, data: Parameters<CatalogRepository["createMedicine"]>[1]) {
    const result = await this.repository.createMedicine(clinicId, data);
    await this.audit.record({ clinicId, actorId: userId, action: "medicine.created", entityType: "Medicine", entityId: result.medicineId, requestId });
    return result;
  }
  createCategory(clinicId: string, data: Parameters<CatalogRepository["createCategory"]>[1]) { return this.repository.createCategory(clinicId, data); }
  createManufacturer(clinicId: string, data: Parameters<CatalogRepository["createManufacturer"]>[1]) { return this.repository.createManufacturer(clinicId, data); }
}
