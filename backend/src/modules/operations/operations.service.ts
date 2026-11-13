import type { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service.js";
import { OperationsRepository } from "./operations.repository.js";

type Actor = { clinicId: string; userId: string; requestId: string };

export class OperationsService {
  constructor(private readonly repository = new OperationsRepository(), private readonly audit = new AuditService()) {}

  listSuppliers(clinicId: string, options: { search?: string | undefined; page: number; pageSize: number }) { return this.repository.listSuppliers(clinicId, options); }
  listPatients(clinicId: string, options: { search?: string | undefined; page: number; pageSize: number }) { return this.repository.listPatients(clinicId, options); }
  listExpenses(clinicId: string, options: { search?: string | undefined; page: number; pageSize: number }) { return this.repository.listExpenses(clinicId, options); }
  listPurchases(clinicId: string, options: { search?: string | undefined; page: number; pageSize: number }) { return this.repository.listPurchases(clinicId, options); }
  listInvoices(clinicId: string, options: { search?: string | undefined; page: number; pageSize: number }) { return this.repository.listInvoices(clinicId, options); }
  reportSummary(clinicId: string) { return this.repository.reportSummary(clinicId); }

  async createSupplier(actor: Actor, data: Prisma.SupplierUncheckedCreateInput) {
    const result = await this.repository.createSupplier(actor.clinicId, data);
    await this.record(actor, "supplier.created", "Supplier", result.id);
    return result;
  }

  async updateSupplier(actor: Actor, id: string, data: Prisma.SupplierUpdateInput) {
    const result = await this.repository.updateSupplier(actor.clinicId, id, data);
    await this.record(actor, "supplier.updated", "Supplier", id);
    return result;
  }

  async archiveSupplier(actor: Actor, id: string) {
    const result = await this.repository.archiveSupplier(actor.clinicId, id);
    await this.record(actor, "supplier.archived", "Supplier", id);
    return result;
  }

  async createPatient(actor: Actor, data: Prisma.PatientUncheckedCreateInput) {
    const result = await this.repository.createPatient(actor.clinicId, data);
    await this.record(actor, "patient.created", "Patient", result.id);
    return result;
  }

  async updatePatient(actor: Actor, id: string, data: Prisma.PatientUpdateInput) {
    const result = await this.repository.updatePatient(actor.clinicId, id, data);
    await this.record(actor, "patient.updated", "Patient", id);
    return result;
  }

  async archivePatient(actor: Actor, id: string) {
    const result = await this.repository.archivePatient(actor.clinicId, id);
    await this.record(actor, "patient.archived", "Patient", id);
    return result;
  }

  async createExpense(actor: Actor, data: Parameters<OperationsRepository["createExpense"]>[2]) {
    const result = await this.repository.createExpense(actor.clinicId, actor.userId, data);
    await this.record(actor, "expense.created", "Expense", result.id);
    return result;
  }

  async updateExpense(actor: Actor, id: string, data: Prisma.ExpenseUpdateInput) {
    const result = await this.repository.updateExpense(actor.clinicId, id, data);
    await this.record(actor, "expense.updated", "Expense", id);
    return result;
  }

  async deleteExpense(actor: Actor, id: string) {
    const result = await this.repository.deleteExpense(actor.clinicId, id);
    await this.record(actor, "expense.deleted", "Expense", id);
    return result;
  }

  async createPurchase(actor: Actor, data: Parameters<OperationsRepository["createPurchase"]>[1]) {
    const result = await this.repository.createPurchase(actor.clinicId, data);
    await this.record(actor, "purchase_order.created", "PurchaseOrder", result.id);
    return result;
  }

  async receivePurchase(actor: Actor, id: string, locationId: string, items: Parameters<OperationsRepository["receivePurchase"]>[4]) {
    const result = await this.repository.receivePurchase(actor.clinicId, actor.userId, id, locationId, items);
    await this.record(actor, "purchase_order.received", "PurchaseOrder", id);
    return result;
  }

  async createInvoice(actor: Actor, data: Parameters<OperationsRepository["createInvoice"]>[2]) {
    const result = await this.repository.createInvoice(actor.clinicId, actor.userId, data);
    await this.record(actor, "invoice.issued", "Invoice", result.id);
    return result;
  }

  private record(actor: Actor, action: string, entityType: string, entityId: string) {
    return this.audit.record({ clinicId: actor.clinicId, actorId: actor.userId, action, entityType, entityId, requestId: actor.requestId });
  }
}
