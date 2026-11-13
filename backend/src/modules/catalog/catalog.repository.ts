import type { Prisma } from "@prisma/client";
import { withTenant } from "../../config/database-context.js";
import { pagination } from "../../utils/pagination.js";

export class CatalogRepository {
  list(clinicId: string, page: number, pageSize: number, search?: string) {
    const where: Prisma.ClinicMedicineWhereInput = {
      clinicId,
      ...(search ? { medicine: { OR: [
        { brandName: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } }
      ] } } : {})
    };
    return withTenant(clinicId, async (tx) => {
      const [rows, total] = await Promise.all([
        tx.clinicMedicine.findMany({ where, ...pagination(page, pageSize), include: { medicine: { include: { category: true, manufacturer: true } } }, orderBy: { medicine: { brandName: "asc" } } }),
        tx.clinicMedicine.count({ where })
      ]);
      return { rows, total };
    });
  }

  lookups(clinicId: string) {
    return withTenant(clinicId, async (tx) => {
      const [categories, manufacturers, locations] = await Promise.all([
        tx.medicineCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        tx.manufacturer.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        tx.location.findMany({ where: { clinicId, isActive: true }, orderBy: { name: "asc" } })
      ]);
      return { categories, manufacturers, locations };
    });
  }

  createMedicine(clinicId: string, data: {
    genericName: string; brandName: string; sku: string; barcode?: string; form: string; strength: string; unit: string;
    taxRate: number; categoryId?: string; manufacturerId?: string; reorderLevel: number; reorderQuantity: number; salePrice: number;
  }) {
    const { reorderLevel, reorderQuantity, salePrice, ...medicine } = data;
    return withTenant(clinicId, async (tx) => {
      const created = await tx.medicine.create({ data: medicine });
      return tx.clinicMedicine.create({
        data: { clinicId, medicineId: created.id, reorderLevel, reorderQuantity, salePrice },
        include: { medicine: { include: { category: true, manufacturer: true } } }
      });
    });
  }

  createCategory(clinicId: string, data: { name: string; description?: string }) {
    return withTenant(clinicId, (tx) => tx.medicineCategory.create({ data }));
  }

  createManufacturer(clinicId: string, data: { name: string; country?: string }) {
    return withTenant(clinicId, (tx) => tx.manufacturer.create({ data }));
  }
}
