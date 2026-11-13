import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service.js";
import { InventoryRepository } from "./inventory.repository.js";

export class InventoryService {
  constructor(private readonly repository = new InventoryRepository(), private readonly audit = new AuditService()) {}

  async list(clinicId: string, page: number, pageSize: number, search?: string) {
    const { rows, total } = await this.repository.list(clinicId, page, pageSize, search);
    const data = rows.map(({ medicine, ...configuration }) => {
      const onHand = medicine.lots.reduce((sum, lot) => sum + Number(lot.quantity), 0);
      const reserved = medicine.lots.reduce((sum, lot) => sum + Number(lot.reserved), 0);
      const nearestExpiry = medicine.lots.reduce<Date | null>((nearest, lot) =>
        !nearest || lot.expiryDate < nearest ? lot.expiryDate : nearest, null);
      return { ...configuration, medicine: { ...medicine, lots: undefined }, onHand, available: onHand - reserved, nearestExpiry };
    });
    return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  addMedicine(clinicId: string, data: Parameters<InventoryRepository["addMedicine"]>[1]) {
    return this.repository.addMedicine(clinicId, data);
  }

  async adjustStock(input: Parameters<InventoryRepository["adjustStock"]>[0], requestId: string) {
    let result: Awaited<ReturnType<InventoryRepository["adjustStock"]>> | undefined;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        result = await this.repository.adjustStock(input);
        break;
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt === 3) throw error;
      }
    }
    if (!result) throw new Error("Stock adjustment did not complete");
    await this.audit.record({
      clinicId: input.clinicId, actorId: input.userId, action: "inventory.adjusted",
      entityType: "InventoryLot", entityId: input.lotId, after: result.lot, requestId
    });
    return result;
  }
}
