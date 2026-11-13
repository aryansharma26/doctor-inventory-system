import type { ClinicStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { withPlatform } from "../../config/database-context.js";
import { pagination } from "../../utils/pagination.js";

export class ClinicRepository {
  list(page: number, pageSize: number, search?: string) {
    const where: Prisma.ClinicWhereInput = {
      deletedAt: null,
      ...(search ? { OR: [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ] } : {})
    };
    return withPlatform((tx) => Promise.all([
      tx.clinic.findMany({
        where,
        ...pagination(page, pageSize),
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { users: true, medicines: true, suppliers: true } },
          subscription: { select: { plan: true, status: true, currentPeriodEnd: true } }
        }
      }),
      tx.clinic.count({ where })
    ]));
  }

  findById(id: string) {
    return withPlatform((tx) => tx.clinic.findFirst({
      where: { id, deletedAt: null },
      include: { subscription: true, _count: { select: { users: true, medicines: true, suppliers: true } } }
    }));
  }

  create(data: Prisma.ClinicCreateInput) {
    return prisma.clinic.create({ data });
  }

  update(id: string, data: Prisma.ClinicUpdateInput) {
    return prisma.clinic.update({ where: { id }, data });
  }

  setStatus(id: string, status: ClinicStatus) {
    return prisma.clinic.update({ where: { id }, data: { status } });
  }

  softDelete(id: string) {
    return prisma.clinic.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  }
}
