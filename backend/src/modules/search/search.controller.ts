import type { RequestHandler } from "express";
import { type TransactionClient, withPlatform, withTenant } from "../../config/database-context.js";

export const globalSearch: RequestHandler = async (req, res) => {
  const query = String(req.query.q ?? "").trim().slice(0, 100);
  if (query.length < 2) return res.json({ success: true, data: [] });
  const clinicScope = req.auth!.isPlatformAdmin && !req.auth!.clinicId ? {} : { clinicId: req.auth!.clinicId! };
  const search = async (tx: TransactionClient) => Promise.all([
    tx.clinicMedicine.findMany({
      where: {
        ...clinicScope,
        medicine: {
          OR: [
            { brandName: { contains: query, mode: "insensitive" } },
            { genericName: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } }
          ]
        }
      },
      take: 8,
      include: { medicine: true, clinic: { select: { name: true } } }
    }),
    tx.supplier.findMany({
      where: { ...clinicScope, name: { contains: query, mode: "insensitive" } },
      take: 5,
      include: { clinic: { select: { name: true } } }
    }),
    tx.purchaseOrder.findMany({
      where: { ...clinicScope, orderNumber: { contains: query, mode: "insensitive" } },
      take: 5,
      include: { clinic: { select: { name: true } } }
    }),
    tx.patient.findMany({
      where: {
        ...clinicScope,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { patientCode: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } }
        ]
      },
      take: 6,
      include: { clinic: { select: { name: true } } }
    }),
    tx.invoice.findMany({
      where: {
        ...clinicScope,
        OR: [
          { invoiceNumber: { contains: query, mode: "insensitive" } },
          { patientName: { contains: query, mode: "insensitive" } }
        ]
      },
      take: 5,
      include: { clinic: { select: { name: true } } }
    }),
    tx.appointment.findMany({
      where: {
        ...clinicScope,
        OR: [
          { patient: { name: { contains: query, mode: "insensitive" } } },
          { patient: { patientCode: { contains: query, mode: "insensitive" } } },
          { reason: { contains: query, mode: "insensitive" } }
        ]
      },
      take: 5,
      include: {
        clinic: { select: { name: true } },
        patient: { select: { name: true } }
      },
      orderBy: { startsAt: "desc" }
    })
  ]);
  const [medicines, suppliers, orders, patients, invoices, appointments] =
    req.auth!.isPlatformAdmin && !req.auth!.clinicId
      ? await withPlatform(search)
      : await withTenant(req.auth!.clinicId!, search);
  return res.json({
    success: true,
    data: [
      ...medicines.map((item) => ({
        type: "medicine",
        id: item.medicineId,
        title: item.medicine.brandName,
        subtitle: `${item.medicine.genericName} · ${item.clinic.name}`,
        path: "/products"
      })),
      ...patients.map((item) => ({
        type: "patient",
        id: item.id,
        title: item.name,
        subtitle: `${item.patientCode} · ${item.clinic.name}`,
        path: `/patients/${item.id}`
      })),
      ...appointments.map((item) => ({
        type: "appointment",
        id: item.id,
        title: item.patient.name,
        subtitle: `${item.reason || "Appointment"} · ${item.clinic.name}`,
        path: `/appointments/${item.id}`
      })),
      ...invoices.map((item) => ({
        type: "invoice",
        id: item.id,
        title: item.invoiceNumber,
        subtitle: `${item.patientName} · ${item.clinic.name}`,
        path: "/sales"
      })),
      ...suppliers.map((item) => ({
        type: "supplier",
        id: item.id,
        title: item.name,
        subtitle: item.clinic.name,
        path: "/suppliers"
      })),
      ...orders.map((item) => ({
        type: "purchase-order",
        id: item.id,
        title: item.orderNumber,
        subtitle: item.clinic.name,
        path: "/purchases"
      }))
    ]
  });
};
