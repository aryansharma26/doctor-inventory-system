import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { ApiError } from "../../utils/api-error.js";
import { AuditService } from "../audit/audit.service.js";
import { DocumentRepository } from "./document.repository.js";

const safeFileName = (value: string) => value.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);

export class DocumentService {
  constructor(private readonly repository = new DocumentRepository(), private readonly audit = new AuditService()) {}

  async createUpload(clinicId: string, userId: string, input: {
    fileName: string;
    contentType: string;
    category: string;
    patientId?: string;
    appointmentId?: string;
  }) {
    const objectPath = `${clinicId}/${randomUUID()}/${safeFileName(input.fileName) || "document"}`;
    const document = await this.repository.create(clinicId, {
      uploadedById: userId,
      objectPath,
      originalName: input.fileName,
      contentType: input.contentType,
      category: input.category,
      status: "PENDING_UPLOAD",
      ...(input.patientId ? { patientId: input.patientId } : {}),
      ...(input.appointmentId ? { appointmentId: input.appointmentId } : {})
    });
    const { data, error } = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).createSignedUploadUrl(objectPath, { upsert: false });
    if (error) throw new ApiError(502, "STORAGE_UNAVAILABLE", "Could not create a secure upload URL");
    return { document, upload: { path: data.path, token: data.token, signedUrl: data.signedUrl } };
  }

  async finalize(clinicId: string, id: string, input: { sizeBytes: number; checksum: string }, actorId: string, requestId: string) {
    const document = await this.repository.findById(clinicId, id);
    if (!document) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found");
    if (document.status !== "PENDING_UPLOAD") throw new ApiError(409, "DOCUMENT_ALREADY_FINALIZED", "Document upload was already finalized");
    const updated = await this.repository.update(clinicId, id, {
      sizeBytes: BigInt(input.sizeBytes),
      checksum: input.checksum.toLowerCase(),
      status: "QUARANTINED"
    });
    await this.audit.record({ clinicId, actorId, action: "document.uploaded", entityType: "Document", entityId: id, requestId });
    return updated;
  }

  async download(clinicId: string, id: string) {
    const document = await this.repository.findById(clinicId, id);
    if (!document) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document was not found");
    if (document.status !== "AVAILABLE") throw new ApiError(409, "DOCUMENT_NOT_AVAILABLE", "Document has not passed security scanning");
    const { data, error } = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).createSignedUrl(document.objectPath, 60);
    if (error) throw new ApiError(502, "STORAGE_UNAVAILABLE", "Could not create a secure download URL");
    return { url: data.signedUrl, expiresIn: 60 };
  }

  list(clinicId: string) {
    return this.repository.list(clinicId);
  }
}
