import { withPlatform, withTenant } from "../../config/database-context.js";

export class DashboardRepository {
  async clinic(
    clinicId: string,
    context: { role?: string; membershipId?: string }
  ) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 86400000);
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday.getTime() + 86400000);
    const doctorScope = context.role === "DOCTOR" && context.membershipId
      ? { doctorMembershipId: context.membershipId }
      : {};
    const [
      medicineCount,
      lowStockRows,
      expiring,
      openOrders,
      revenue,
      movements,
      recentOrders,
      todayAppointments,
      waitingPatients,
      todayRevenue,
      recentAppointments,
      checkIns,
      pendingFollowUps,
      prescriptionsToday,
      outstandingInvoices,
      billingPending
    ] = await withTenant(clinicId, (tx) => Promise.all([
      tx.clinicMedicine.count({ where: { clinicId, isActive: true } }),
      tx.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "ClinicMedicine" cm
        WHERE cm."clinicId" = ${clinicId}::uuid AND cm."isActive" = true
        AND COALESCE((SELECT SUM(il.quantity) FROM "InventoryLot" il
          WHERE il."clinicId" = cm."clinicId" AND il."medicineId" = cm."medicineId"), 0) <= cm."reorderLevel"`,
      tx.inventoryLot.count({ where: { clinicId, quantity: { gt: 0 }, expiryDate: { lte: thirtyDays } } }),
      tx.purchaseOrder.count({ where: { clinicId, status: { in: ["SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED"] } } }),
      tx.invoice.aggregate({ where: { clinicId, status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID"] }, issuedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } }, _sum: { total: true } }),
      tx.stockMovement.groupBy({ by: ["type"], where: { clinicId, occurredAt: { gte: new Date(now.getTime() - 7 * 86400000) } }, _sum: { quantity: true }, orderBy: { type: "asc" } }),
      tx.purchaseOrder.findMany({ where: { clinicId }, take: 5, orderBy: { createdAt: "desc" }, include: { supplier: { select: { name: true } } } }),
      tx.appointment.count({ where: { clinicId, ...doctorScope, startsAt: { gte: startOfToday, lt: endOfToday }, status: { notIn: ["CANCELLED", "NO_SHOW"] } } }),
      tx.appointment.count({ where: { clinicId, ...doctorScope, startsAt: { gte: startOfToday, lt: endOfToday }, status: { in: ["CHECKED_IN", "IN_CONSULTATION"] } } }),
      tx.invoice.aggregate({ where: { clinicId, issuedAt: { gte: startOfToday, lt: endOfToday }, status: { not: "VOID" } }, _sum: { total: true, paid: true } }),
      tx.appointment.findMany({
        where: { clinicId, ...doctorScope, startsAt: { gte: startOfToday, lt: endOfToday }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
        take: 6,
        orderBy: { startsAt: "asc" },
        include: {
          patient: { select: { id: true, patientCode: true, name: true, phone: true } },
          doctor: { include: { user: { select: { id: true, fullName: true } } } }
        }
      }),
      tx.appointment.count({
        where: { clinicId, startsAt: { gte: startOfToday, lt: endOfToday }, checkedInAt: { not: null } }
      }),
      tx.followUp.count({
        where: {
          clinicId,
          status: { in: ["PENDING", "SCHEDULED"] },
          dueAt: { lte: endOfToday },
          ...(context.role === "DOCTOR" && context.membershipId ? { assignedToId: context.membershipId } : {})
        }
      }),
      tx.prescription.count({
        where: {
          clinicId,
          issuedAt: { gte: startOfToday, lt: endOfToday },
          ...(context.role === "DOCTOR" && context.membershipId ? { doctorMembershipId: context.membershipId } : {})
        }
      }),
      tx.invoice.aggregate({
        where: { clinicId, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
        _count: true,
        _sum: { total: true, paid: true }
      }),
      tx.appointment.count({
        where: {
          clinicId,
          status: "COMPLETED",
          startsAt: { gte: startOfToday, lt: endOfToday },
          invoices: { none: { status: { not: "VOID" } } }
        }
      })
    ]));
    return {
      kpis: {
        medicineCount,
        lowStock: Number(lowStockRows[0]?.count ?? 0),
        expiring,
        openOrders,
        monthlyRevenue: Number(revenue._sum.total ?? 0),
        todayAppointments,
        waitingPatients,
        todayRevenue: Number(todayRevenue._sum.total ?? 0),
        todayCollected: Number(todayRevenue._sum.paid ?? 0),
        checkIns,
        pendingFollowUps,
        prescriptionsToday,
        outstandingInvoices: outstandingInvoices._count,
        outstandingAmount: Number(outstandingInvoices._sum.total ?? 0) - Number(outstandingInvoices._sum.paid ?? 0),
        billingPending
      },
      movements,
      recentOrders,
      recentAppointments
    };
  }

  async platform() {
    const [clinics, users, doctors, patients, medicines, revenue, collected, statuses] = await withPlatform((tx) => Promise.all([
      tx.clinic.count({ where: { deletedAt: null } }),
      tx.user.count({ where: { isActive: true } }),
      tx.userClinic.count({ where: { isActive: true, role: "DOCTOR", clinic: { deletedAt: null } } }),
      tx.patient.count({ where: { isActive: true, clinic: { deletedAt: null } } }),
      tx.medicine.count({ where: { status: "ACTIVE" } }),
      tx.invoice.aggregate({ where: { status: { not: "VOID" } }, _sum: { total: true } }),
      tx.invoice.aggregate({ where: { status: { not: "VOID" } }, _sum: { paid: true } }),
      tx.clinic.groupBy({ by: ["status"], _count: true, orderBy: { status: "asc" } })
    ]));
    return {
      kpis: {
        clinics,
        users,
        doctors,
        patients,
        medicines,
        revenue: Number(revenue._sum.total ?? 0),
        collected: Number(collected._sum.paid ?? 0)
      },
      statuses
    };
  }
}
