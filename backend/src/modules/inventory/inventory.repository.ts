import { Prisma, type StockMovementType } from "@prisma/client";
import { withTenant } from "../../config/database-context.js";
import { ApiError } from "../../utils/api-error.js";
import { pagination } from "../../utils/pagination.js";

export class InventoryRepository {
  async list(clinicId: string, page: number, pageSize: number, search?: string) {
    const where: Prisma.ClinicMedicineWhereInput = {
      clinicId,
      isActive: true,
      ...(search ? { medicine: { OR: [
        { brandName: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } }
      ] } } : {})
    };
    const [rows, total] = await withTenant(clinicId, (tx) => Promise.all([
      tx.clinicMedicine.findMany({
        where,
        ...pagination(page, pageSize),
        include: {
          medicine: { include: { category: true, manufacturer: true, lots: { where: { clinicId }, select: { quantity: true, reserved: true, expiryDate: true } } } }
        },
        orderBy: { medicine: { brandName: "asc" } }
      }),
      tx.clinicMedicine.count({ where })
    ]));
    return { rows, total };
  }

  addMedicine(clinicId: string, data: { medicineId: string; reorderLevel: number; reorderQuantity: number; salePrice: number }) {
    return withTenant(clinicId, (tx) => tx.clinicMedicine.create({ data: { clinicId, ...data } }));
  }

  async adjustStock(input: {
    clinicId: string; locationId: string; medicineId: string; lotId: string;
    quantity: string; reason: string; userId: string; idempotencyKey: string; requestHash: string;
  }) {
    return withTenant(input.clinicId, async (tx) => {
      const existing = await tx.idempotencyKey.findUnique({
        where: { clinicId_key: { clinicId: input.clinicId, key: input.idempotencyKey } }
      });
      if (existing) {
        if (existing.requestHash !== input.requestHash) {
          throw new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "The idempotency key was already used for a different request");
        }
        if (existing.response) return existing.response as never;
        throw new ApiError(409, "REQUEST_IN_PROGRESS", "An identical stock adjustment is already being processed");
      }
      await tx.idempotencyKey.create({
        data: {
          clinicId: input.clinicId,
          key: input.idempotencyKey,
          operation: "inventory.adjust",
          requestHash: input.requestHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60_000)
        }
      });
      const lot = await tx.inventoryLot.findFirst({
        where: { id: input.lotId, clinicId: input.clinicId, locationId: input.locationId, medicineId: input.medicineId }
      });
      if (!lot) throw new ApiError(404, "LOT_NOT_FOUND", "Inventory lot was not found");
      const adjustment = new Prisma.Decimal(input.quantity);
      const next = lot.quantity.add(adjustment);
      if (next.lessThan(lot.reserved)) throw new ApiError(409, "INSUFFICIENT_AVAILABLE_STOCK", "Adjustment would reduce stock below the reserved quantity");
      const updated = await tx.inventoryLot.update({ where: { id: lot.id }, data: { quantity: next } });
      const type: StockMovementType = adjustment.isPositive() ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
      const movement = await tx.stockMovement.create({
        data: {
          clinicId: input.clinicId,
          locationId: input.locationId,
          medicineId: input.medicineId,
          lotId: input.lotId,
          performedById: input.userId,
          type,
          quantity: adjustment.abs(),
          balanceAfter: next,
          reason: input.reason
        }
      });
      const result = { lot: updated, movement };
      await tx.idempotencyKey.update({
        where: { clinicId_key: { clinicId: input.clinicId, key: input.idempotencyKey } },
        data: { responseCode: 200, response: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue }
      });
      return result;
    }, { isolationLevel: "Serializable" });
  }
}
