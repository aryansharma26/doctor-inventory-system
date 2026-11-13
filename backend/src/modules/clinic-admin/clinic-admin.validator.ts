import { z } from "zod";

const empty = z.object({});
export const updateSettingsSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().email().max(254),
    phone: z.string().trim().max(30).optional(),
    timezone: z.string().trim().min(2).max(80),
    currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
    settings: z.object({
      lowStockAlerts: z.boolean().default(true),
      expiryAlertDays: z.coerce.number().int().min(1).max(365).default(30),
      invoicePrefix: z.string().trim().min(1).max(12).default("INV"),
      purchasePrefix: z.string().trim().min(1).max(12).default("PO")
    })
  }),
  query: empty,
  params: empty
});

export const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().email().max(254),
    fullName: z.string().trim().min(2).max(160),
    role: z.enum(["DOCTOR", "RECEPTIONIST", "INVENTORY_MANAGER", "PHARMACIST", "NURSE", "ACCOUNTANT", "STAFF", "AUDITOR"])
  }),
  query: empty,
  params: empty
});

export const membershipSchema = z.object({
  body: z.object({ isActive: z.boolean() }),
  query: empty,
  params: z.object({ id: z.string().uuid() })
});
