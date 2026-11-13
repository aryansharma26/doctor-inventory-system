import { z } from "zod";

const address = z.object({
  line1: z.string().min(2).max(160),
  line2: z.string().max(160).optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  postalCode: z.string().min(3).max(20),
  country: z.string().length(2).default("IN")
});

export const createClinicSchema = z.object({
  body: z.object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,24}$/),
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    timezone: z.string().min(3).max(60).default("Asia/Kolkata"),
    currency: z.string().length(3).default("INR"),
    address: address.optional()
  }),
  query: z.object({}),
  params: z.object({})
});

export const updateClinicSchema = z.object({
  body: createClinicSchema.shape.body.omit({ code: true }).partial(),
  query: z.object({}),
  params: z.object({ id: z.string().uuid() })
});

export const clinicStatusSchema = z.object({
  body: z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }),
  query: z.object({}),
  params: z.object({ id: z.string().uuid() })
});

