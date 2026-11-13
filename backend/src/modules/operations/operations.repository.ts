import { randomUUID } from "node:crypto";
import { type PaymentMethod, Prisma } from "@prisma/client";
import { withTenant } from "../../config/database-context.js";
import { ApiError } from "../../utils/api-error.js";

type ListOptions = { search?: string | undefined; page: number; pageSize: number };

export class OperationsRepository {
  listSuppliers(clinicId: string, options: ListOptions) {
    const where: Prisma.SupplierWhereInput = {
      clinicId,
      ...(options.search ? { OR: [
        { name: { contains: options.search, mode: "insensitive" } },
        { code: { contains: options.search, mode: "insensitive" } },
        { phone: { contains: options.search, mode: "insensitive" } }
      ] } : {})
    };
    return withTenant(clinicId, async (tx) => {
      const [rows, total] = await Promise.all([
        tx.supplier.findMany({ where, skip: (options.page - 1) * options.pageSize, take: options.pageSize, orderBy: { name: "asc" } }),
        tx.supplier.count({ where })
      ]);
      return { rows, total };
    });
  }

  createSupplier(clinicId: string, data: Prisma.SupplierUncheckedCreateInput) {
    return withTenant(clinicId, (tx) => tx.supplier.create({ data: { ...data, clinicId } }));
  }

  updateSupplier(clinicId: string, id: string, data: Prisma.SupplierUpdateInput) {
    return withTenant(clinicId, async (tx) => {
      const existing = await tx.supplier.findFirst({ where: { id, clinicId } });
      if (!existing) throw new ApiError(404, "SUPPLIER_NOT_FOUND", "Supplier was not found");
      return tx.supplier.update({ where: { id }, data });
    });
  }

  archiveSupplier(clinicId: string, id: string) {
    return this.updateSupplier(clinicId, id, { isActive: false });
  }

  listPatients(clinicId: string, options: ListOptions) {
    const where: Prisma.PatientWhereInput = {
      clinicId,
      ...(options.search ? { OR: [
        { name: { contains: options.search, mode: "insensitive" } },
        { patientCode: { contains: options.search, mode: "insensitive" } },
        { phone: { contains: options.search, mode: "insensitive" } }
      ] } : {})
    };
    return withTenant(clinicId, async (tx) => {
      const [rows, total] = await Promise.all([
        tx.patient.findMany({ where, skip: (options.page - 1) * options.pageSize, take: options.pageSize, orderBy: { createdAt: "desc" } }),
        tx.patient.count({ where })
      ]);
      return { rows, total };
    });
  }

  createPatient(clinicId: string, data: Prisma.PatientUncheckedCreateInput) {
    return withTenant(clinicId, (tx) => tx.patient.create({ data: { ...data, clinicId } }));
  }

  updatePatient(clinicId: string, id: string, data: Prisma.PatientUpdateInput) {
    return withTenant(clinicId, async (tx) => {
      const existing = await tx.patient.findFirst({ where: { id, clinicId } });
      if (!existing) throw new ApiError(404, "PATIENT_NOT_FOUND", "Patient was not found");
      return tx.patient.update({ where: { id }, data });
    });
  }

  archivePatient(clinicId: string, id: string) {
    return this.updatePatient(clinicId, id, { isActive: false });
  }

  listExpenses(clinicId: string, options: ListOptions) {
    const where: Prisma.ExpenseWhereInput = {
      clinicId,
      ...(options.search ? { OR: [
        { description: { contains: options.search, mode: "insensitive" } },
        { category: { contains: options.search, mode: "insensitive" } },
        { reference: { contains: options.search, mode: "insensitive" } }
      ] } : {})
    };
    return withTenant(clinicId, async (tx) => {
      const [rows, total, aggregate] = await Promise.all([
        tx.expense.findMany({ where, skip: (options.page - 1) * options.pageSize, take: options.pageSize, orderBy: { expenseDate: "desc" } }),
        tx.expense.count({ where }),
        tx.expense.aggregate({ where, _sum: { amount: true } })
      ]);
      return { rows, total, totalAmount: aggregate._sum.amount ?? new Prisma.Decimal(0) };
    });
  }

  createExpense(clinicId: string, userId: string, data: Omit<Prisma.ExpenseUncheckedCreateInput, "clinicId" | "createdById">) {
    return withTenant(clinicId, (tx) => tx.expense.create({ data: { ...data, clinicId, createdById: userId } }));
  }

  updateExpense(clinicId: string, id: string, data: Prisma.ExpenseUpdateInput) {
    return withTenant(clinicId, async (tx) => {
      const existing = await tx.expense.findFirst({ where: { id, clinicId } });
      if (!existing) throw new ApiError(404, "EXPENSE_NOT_FOUND", "Expense was not found");
      return tx.expense.update({ where: { id }, data });
    });
  }

  deleteExpense(clinicId: string, id: string) {
    return withTenant(clinicId, async (tx) => {
      const existing = await tx.expense.findFirst({ where: { id, clinicId } });
      if (!existing) throw new ApiError(404, "EXPENSE_NOT_FOUND", "Expense was not found");
      return tx.expense.delete({ where: { id } });
    });
  }

  listPurchases(clinicId: string, options: ListOptions) {
    const where: Prisma.PurchaseOrderWhereInput = {
      clinicId,
      ...(options.search ? { OR: [
        { orderNumber: { contains: options.search, mode: "insensitive" } },
        { supplier: { name: { contains: options.search, mode: "insensitive" } } }
      ] } : {})
    };
    return withTenant(clinicId, async (tx) => {
      const [rows, total] = await Promise.all([
        tx.purchaseOrder.findMany({ where, include: { supplier: true, items: { include: { medicine: true } } }, skip: (options.page - 1) * options.pageSize, take: options.pageSize, orderBy: { createdAt: "desc" } }),
        tx.purchaseOrder.count({ where })
      ]);
      return { rows, total };
    });
  }

  createPurchase(clinicId: string, data: {
    supplierId: string; expectedDate?: Date; notes?: string;
    items: Array<{ medicineId: string; quantity: number; unitPrice: number; taxRate: number }>;
  }) {
    return withTenant(clinicId, async (tx) => {
      const supplier = await tx.supplier.findFirst({ where: { id: data.supplierId, clinicId, isActive: true } });
      if (!supplier) throw new ApiError(422, "INVALID_SUPPLIER", "Select an active supplier from this clinic");
      const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const tax = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.taxRate / 100, 0);
      return tx.purchaseOrder.create({
        data: {
          clinicId, supplierId: data.supplierId,
          ...(data.expectedDate ? { expectedDate: data.expectedDate } : {}),
          ...(data.notes ? { notes: data.notes } : {}),
          orderNumber: `PO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`,
          status: "SUBMITTED", subtotal, tax, total: subtotal + tax,
          items: { create: data.items }
        },
        include: { supplier: true, items: { include: { medicine: true } } }
      });
    });
  }

  receivePurchase(clinicId: string, userId: string, id: string, locationId: string, receipts: Array<{ itemId: string; quantity: number; batchNumber: string; expiryDate: Date }>) {
    return withTenant(clinicId, async (tx) => {
      const order = await tx.purchaseOrder.findFirst({ where: { id, clinicId }, include: { items: true } });
      if (!order || ["CANCELLED", "RECEIVED"].includes(order.status)) throw new ApiError(409, "ORDER_NOT_RECEIVABLE", "Purchase order cannot be received");
      const location = await tx.location.findFirst({ where: { id: locationId, clinicId, isActive: true } });
      if (!location) throw new ApiError(422, "INVALID_LOCATION", "Select an active clinic location");
      for (const receipt of receipts) {
        const item = order.items.find((candidate) => candidate.id === receipt.itemId);
        if (!item || item.received.add(receipt.quantity).greaterThan(item.quantity)) throw new ApiError(422, "INVALID_RECEIPT_QUANTITY", "Received quantity exceeds the ordered quantity");
        const lot = await tx.inventoryLot.upsert({
          where: { clinicId_locationId_medicineId_batchNumber: { clinicId, locationId, medicineId: item.medicineId, batchNumber: receipt.batchNumber } },
          update: { quantity: { increment: receipt.quantity }, expiryDate: receipt.expiryDate, purchasePrice: item.unitPrice },
          create: { clinicId, locationId, medicineId: item.medicineId, batchNumber: receipt.batchNumber, expiryDate: receipt.expiryDate, quantity: receipt.quantity, purchasePrice: item.unitPrice }
        });
        await tx.purchaseOrderItem.update({ where: { id: item.id }, data: { received: { increment: receipt.quantity } } });
        await tx.stockMovement.create({ data: { clinicId, locationId, medicineId: item.medicineId, lotId: lot.id, performedById: userId, type: "PURCHASE", quantity: receipt.quantity, balanceAfter: lot.quantity, referenceType: "PurchaseOrder", referenceId: id } });
      }
      const refreshed = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
      const complete = refreshed.every((item) => item.received.greaterThanOrEqualTo(item.quantity));
      return tx.purchaseOrder.update({ where: { id }, data: { status: complete ? "RECEIVED" : "PARTIALLY_RECEIVED" }, include: { supplier: true, items: { include: { medicine: true } } } });
    }, { isolationLevel: "Serializable" });
  }

  listInvoices(clinicId: string, options: ListOptions) {
    const where: Prisma.InvoiceWhereInput = {
      clinicId,
      ...(options.search ? { OR: [
        { invoiceNumber: { contains: options.search, mode: "insensitive" } },
        { patientName: { contains: options.search, mode: "insensitive" } }
      ] } : {})
    };
    return withTenant(clinicId, async (tx) => {
      const [rows, total] = await Promise.all([
        tx.invoice.findMany({ where, include: { patient: true, payments: true, items: { include: { medicine: true } } }, skip: (options.page - 1) * options.pageSize, take: options.pageSize, orderBy: { createdAt: "desc" } }),
        tx.invoice.count({ where })
      ]);
      return { rows, total };
    });
  }

  createInvoice(clinicId: string, userId: string, data: {
    patientId?: string; patientName: string; doctorId?: string; discount: number; paid: number;
    paymentMethod: PaymentMethod; notes?: string;
    items: Array<{ medicineId: string; quantity: number; unitPrice: number; taxRate: number }>;
  }) {
    return withTenant(clinicId, async (tx) => {
      const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const tax = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.taxRate / 100, 0);
      const total = Math.max(0, subtotal + tax - data.discount);
      if (data.paid > total) throw new ApiError(422, "OVERPAYMENT", "Paid amount cannot exceed invoice total");
      for (const item of data.items) {
        let remaining = new Prisma.Decimal(item.quantity);
        const lots = await tx.inventoryLot.findMany({ where: { clinicId, medicineId: item.medicineId, quantity: { gt: 0 }, expiryDate: { gt: new Date() } }, orderBy: { expiryDate: "asc" } });
        for (const lot of lots) {
          if (remaining.lessThanOrEqualTo(0)) break;
          const available = lot.quantity.sub(lot.reserved);
          const used = Prisma.Decimal.min(available, remaining);
          if (used.lessThanOrEqualTo(0)) continue;
          const updated = await tx.inventoryLot.update({ where: { id: lot.id }, data: { quantity: { decrement: used } } });
          await tx.stockMovement.create({ data: { clinicId, locationId: lot.locationId, medicineId: item.medicineId, lotId: lot.id, performedById: userId, type: "SALE", quantity: used, balanceAfter: updated.quantity, referenceType: "Invoice" } });
          remaining = remaining.sub(used);
        }
        if (remaining.greaterThan(0)) throw new ApiError(409, "INSUFFICIENT_STOCK", "One or more medicines do not have enough available stock");
      }
      const status = data.paid >= total ? "PAID" : data.paid > 0 ? "PARTIALLY_PAID" : "ISSUED";
      const invoice = await tx.invoice.create({
        data: {
          clinicId, patientName: data.patientName,
          ...(data.patientId ? { patientId: data.patientId } : {}),
          ...(data.doctorId ? { doctorId: data.doctorId } : {}),
          invoiceNumber: `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`,
          subtotal, tax, discount: data.discount, total, paid: data.paid, paymentMethod: data.paymentMethod,
          status, ...(data.notes ? { notes: data.notes } : {}), issuedAt: new Date(),
          items: { create: data.items.map((item) => ({ ...item, description: "" })) }
        },
        include: { patient: true, items: { include: { medicine: true } } }
      });
      if (data.paid > 0) {
        await tx.payment.create({
          data: {
            clinicId,
            invoiceId: invoice.id,
            recordedById: userId,
            receiptNumber: `RCT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`,
            amount: data.paid,
            method: data.paymentMethod,
            ...(data.patientId ? { patientId: data.patientId } : {})
          }
        });
      }
      return tx.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        include: { patient: true, payments: true, items: { include: { medicine: true } } }
      });
    }, { isolationLevel: "Serializable" });
  }

  reportSummary(clinicId: string) {
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    return withTenant(clinicId, async (tx) => {
      const [sales, purchases, expenses, topMedicines] = await Promise.all([
        tx.invoice.aggregate({ where: { clinicId, issuedAt: { gte: monthStart }, status: { not: "VOID" } }, _sum: { total: true, paid: true }, _count: true }),
        tx.purchaseOrder.aggregate({ where: { clinicId, orderDate: { gte: monthStart }, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),
        tx.expense.aggregate({ where: { clinicId, expenseDate: { gte: monthStart } }, _sum: { amount: true }, _count: true }),
        tx.invoiceItem.groupBy({ by: ["medicineId"], where: { invoice: { clinicId, issuedAt: { gte: monthStart }, status: { not: "VOID" } } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 })
      ]);
      const medicineIds = topMedicines
        .map((item) => item.medicineId)
        .filter((medicineId): medicineId is string => Boolean(medicineId));
      const medicineNames = await tx.medicine.findMany({ where: { id: { in: medicineIds } }, select: { id: true, brandName: true, genericName: true } });
      return { sales, purchases, expenses, topMedicines: topMedicines.map((item) => ({ ...item, medicine: medicineNames.find((medicine) => medicine.id === item.medicineId) })) };
    });
  }
}
