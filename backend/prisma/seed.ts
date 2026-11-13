import { PrismaClient, type Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    ["inventory.read", "View clinic inventory", "Inventory"],
    ["inventory.manage", "Add and configure medicines", "Inventory"],
    ["inventory.adjust", "Create stock adjustments", "Inventory"],
    ["purchase_order.read", "View purchase orders", "Procurement"],
    ["purchase_order.create", "Create purchase orders", "Procurement"],
    ["purchase_order.approve", "Approve purchase orders", "Procurement"],
    ["supplier.manage", "Manage suppliers", "Procurement"],
    ["invoice.read", "View invoices", "Finance"],
    ["invoice.issue", "Issue and void invoices", "Finance"],
    ["user.manage", "Manage clinic users and roles", "Administration"],
    ["audit.read", "View audit history", "Governance"],
    ["audit.export", "Export audit history", "Governance"],
    ["document.manage", "Upload and manage documents", "Documents"],
    ["appointment.read", "View clinic appointments and daily queue", "Practice"],
    ["appointment.manage", "Create appointments and update queue status", "Practice"],
    ["patient_record.read", "View patient clinical records", "Clinical"],
    ["patient_record.write", "Create and update patient clinical records", "Clinical"],
    ["prescription.read", "View prescriptions", "Clinical"],
    ["prescription.issue", "Issue and manage prescriptions", "Clinical"]
  ] as const;
  for (const [key, description, categoryName] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description, category: categoryName },
      create: { key, description, category: categoryName }
    });
  }
  const roleGrants: Partial<Record<Role, string[]>> = {
    CLINIC_OWNER: permissions.map(([key]) => key),
    INVENTORY_MANAGER: ["inventory.read", "inventory.manage", "inventory.adjust", "purchase_order.read", "purchase_order.create", "supplier.manage", "document.manage"],
    PHARMACIST: ["inventory.read", "inventory.manage", "inventory.adjust", "purchase_order.read", "invoice.read", "invoice.issue", "document.manage", "prescription.read"],
    DOCTOR: ["inventory.read", "invoice.read", "document.manage", "appointment.read", "appointment.manage", "patient_record.read", "patient_record.write", "prescription.read", "prescription.issue"],
    NURSE: ["inventory.read", "appointment.read", "patient_record.read", "patient_record.write"],
    RECEPTIONIST: ["inventory.read", "invoice.read", "invoice.issue", "appointment.read", "appointment.manage", "patient_record.read", "patient_record.write"],
    ACCOUNTANT: ["purchase_order.read", "invoice.read", "invoice.issue", "audit.read"],
    AUDITOR: ["inventory.read", "purchase_order.read", "invoice.read", "audit.read", "audit.export"],
    STAFF: ["inventory.read"]
  };
  for (const [role, grants] of Object.entries(roleGrants) as Array<[Role, string[]]>) {
    for (const permissionKey of grants) {
      await prisma.rolePermission.upsert({
        where: { role_permissionKey: { role, permissionKey } },
        update: {},
        create: { role, permissionKey }
      });
    }
  }

  const category = await prisma.medicineCategory.upsert({
    where: { name: "Analgesics" },
    update: {},
    create: { name: "Analgesics", description: "Pain relief medicines" }
  });
  const manufacturer = await prisma.manufacturer.upsert({
    where: { name: "Cipla" },
    update: {},
    create: { name: "Cipla", country: "IN" }
  });
  await prisma.medicine.upsert({
    where: { sku: "PCM-500-TAB" },
    update: {},
    create: {
      genericName: "Paracetamol", brandName: "Paracip", sku: "PCM-500-TAB",
      form: "Tablet", strength: "500 mg", unit: "tablet", taxRate: 5,
      categoryId: category.id, manufacturerId: manufacturer.id
    }
  });
}

main().finally(() => prisma.$disconnect());
