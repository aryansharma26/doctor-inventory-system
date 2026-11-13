import { z } from "zod";

export const startImpersonationSchema = z.object({
  body: z.object({
    clinicId: z.string().uuid(),
    reason: z.string().trim().min(15).max(500)
  }),
  query: z.object({}),
  params: z.object({})
});

export const stopImpersonationSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({ id: z.string().uuid() })
});

