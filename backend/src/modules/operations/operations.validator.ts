import { z } from "zod";

const empty = z.object({});
const uuidParams = z.object({ id: z.string().uuid() });
const money = z.coerce.number().min(0).max(99_999_999_999.99);
const quantity = z.coerce.number().positive().max(99_999_999_999.999);

export const createSupplierSchema = z.object({
  body: z.object({
    code: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
    name: z.string().trim().min(2).max(160),
    email: z.string().email().max(254).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional(),
    taxId: z.string().trim().max(40).optional(),
    paymentTerms: z.coerce.number().int().min(0).max(365).default(30)
  }),
  query: empty,
  params: empty
});

export const updateSupplierSchema = createSupplierSchema.extend({ params: uuidParams });

export const createPatientSchema = z.object({
  body: z.object({
    patientCode: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
    name: z.string().trim().min(2).max(160),
    phone: z.string().trim().max(30).optional(),
    email: z.string().email().max(254).optional().or(z.literal("")),
    dateOfBirth: z.coerce.date().max(new Date()).optional(),
    gender: z.string().trim().max(30).optional(),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
    maritalStatus: z.string().trim().max(30).optional(),
    occupation: z.string().trim().max(120).optional(),
    preferredLanguage: z.string().trim().max(60).optional(),
    address: z.record(z.unknown()).optional(),
    emergencyContact: z.object({
      name: z.string().trim().min(2).max(160),
      relationship: z.string().trim().max(60).optional(),
      phone: z.string().trim().min(5).max(30)
    }).optional(),
    communicationPreferences: z.object({
      sms: z.boolean().default(true),
      email: z.boolean().default(false),
      whatsapp: z.boolean().default(false)
    }).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    consentAt: z.coerce.date().optional(),
    notes: z.string().trim().max(2000).optional()
  }),
  query: empty,
  params: empty
});

export const updatePatientSchema = createPatientSchema.extend({ params: uuidParams });

export const createExpenseSchema = z.object({
  body: z.object({
    expenseDate: z.coerce.date().optional(),
    category: z.string().trim().min(2).max(80),
    description: z.string().trim().min(2).max(300),
    amount: money.refine((value) => value > 0),
    paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CREDIT", "SPLIT"]).default("CASH"),
    reference: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(1000).optional()
  }),
  query: empty,
  params: empty
});

export const updateExpenseSchema = createExpenseSchema.extend({ params: uuidParams });

export const createPurchaseSchema = z.object({
  body: z.object({
    supplierId: z.string().uuid(),
    expectedDate: z.coerce.date().optional(),
    notes: z.string().trim().max(1000).optional(),
    items: z.array(z.object({
      medicineId: z.string().uuid(),
      quantity,
      unitPrice: money,
      taxRate: z.coerce.number().min(0).max(100).default(0)
    })).min(1).max(100)
  }),
  query: empty,
  params: empty
});

export const receivePurchaseSchema = z.object({
  body: z.object({
    locationId: z.string().uuid(),
    items: z.array(z.object({
      itemId: z.string().uuid(),
      quantity,
      batchNumber: z.string().trim().min(1).max(80),
      expiryDate: z.coerce.date().min(new Date())
    })).min(1).max(100)
  }),
  query: empty,
  params: uuidParams
});

export const createInvoiceSchema = z.object({
  body: z.object({
    patientId: z.string().uuid().optional(),
    patientName: z.string().trim().min(2).max(160),
    doctorId: z.string().uuid().optional(),
    discount: money.default(0),
    paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CREDIT", "SPLIT"]).default("CASH"),
    paid: money.default(0),
    notes: z.string().trim().max(1000).optional(),
    items: z.array(z.object({
      medicineId: z.string().uuid(),
      quantity,
      unitPrice: money,
      taxRate: z.coerce.number().min(0).max(100).default(0)
    })).min(1).max(100)
  }),
  query: empty,
  params: empty
});

export const idSchema = z.object({ body: empty, query: empty, params: uuidParams });
