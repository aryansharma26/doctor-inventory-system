import { z } from "zod";

export const updateOverridesSchema = z.object({
  body: z.object({
    overrides: z.array(z.object({
      permissionKey: z.string().min(3).max(100),
      effect: z.enum(["GRANT", "DENY"])
    })).max(100)
  }),
  query: z.object({}),
  params: z.object({ membershipId: z.string().uuid() })
});

