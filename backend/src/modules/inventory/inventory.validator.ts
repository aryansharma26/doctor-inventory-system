import { z } from "zod";

export const createMedicineSchema = z.object({
  body: z.object({
    medicineId: z.string().uuid(),
    reorderLevel: z.coerce.number().min(0),
    reorderQuantity: z.coerce.number().min(0),
    salePrice: z.coerce.number().positive()
  }),
  query: z.object({}),
  params: z.object({})
});

export const adjustStockSchema = z.object({
  body: z.object({
    locationId: z.string().uuid(),
    medicineId: z.string().uuid(),
    lotId: z.string().uuid(),
    quantity: z.union([z.string(), z.number()]).transform(String).pipe(
      z.string().regex(/^-?\d{1,11}(\.\d{1,3})?$/, "Use at most 11 digits and 3 decimal places")
    ).refine((value) => !/^[-]?0+(\.0+)?$/.test(value), "Quantity cannot be zero"),
    reason: z.string().trim().min(5).max(300)
  }),
  query: z.object({}),
  params: z.object({})
});
