import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default("clinic-documents"),
  FRONTEND_URL: z.string().url(),
  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0)
});

export const env = schema.parse(process.env);

