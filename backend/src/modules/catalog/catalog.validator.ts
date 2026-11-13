import { z } from "zod";

const empty = z.object({});
export const createMedicineSchema = z.object({
  body: z.object({
    genericName: z.string().trim().min(2).max(160),
    brandName: z.string().trim().min(2).max(160),
    sku: z.string().trim().min(2).max(60).transform((value) => value.toUpperCase()),
    barcode: z.string().trim().min(4).max(80).optional(),
    form: z.string().trim().min(2).max(60),
    strength: z.string().trim().min(1).max(60),
    unit: z.string().trim().min(1).max(30),
    taxRate: z.coerce.number().min(0).max(100).default(0),
    categoryId: z.string().uuid().optional(),
    manufacturerId: z.string().uuid().optional(),
    reorderLevel: z.coerce.number().min(0).default(0),
    reorderQuantity: z.coerce.number().min(0).default(0),
    salePrice: z.coerce.number().positive()
  }),
  query: empty,
  params: empty
});

export const createLookupSchema = z.object({
  body: z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().max(500).optional(), country: z.string().trim().max(80).optional() }),
  query: empty,
  params: empty
});
