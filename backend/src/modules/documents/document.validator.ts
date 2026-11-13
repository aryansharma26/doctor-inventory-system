import { z } from "zod";

const allowedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

export const createUploadSchema = z.object({
  body: z.object({
    fileName: z.string().trim().min(1).max(180),
    contentType: z.enum(allowedTypes),
    category: z.enum([
      "invoice",
      "supplier-certificate",
      "prescription",
      "inventory-evidence",
      "lab-report",
      "medical-record",
      "vaccination",
      "insurance",
      "other"
    ]),
    patientId: z.string().uuid().optional(),
    appointmentId: z.string().uuid().optional()
  }),
  query: z.object({}),
  params: z.object({})
});

export const documentIdSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({ id: z.string().uuid() })
});

export const finalizeDocumentSchema = z.object({
  body: z.object({
    sizeBytes: z.coerce.number().int().positive().max(25 * 1024 * 1024),
    checksum: z.string().regex(/^[a-f0-9]{64}$/i)
  }),
  query: z.object({}),
  params: z.object({ id: z.string().uuid() })
});
