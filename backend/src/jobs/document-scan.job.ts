import { withPlatform } from "../config/database-context.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { supabaseAdmin } from "../config/supabase.js";

export type MalwareScanner = (file: ArrayBuffer, contentType: string) => Promise<{ clean: boolean; engine: string }>;

export async function scanPendingDocuments(scanner: MalwareScanner) {
  const documents = await withPlatform((tx) => tx.document.findMany({
    where: { status: "QUARANTINED", deletedAt: null },
    take: 25,
    orderBy: { createdAt: "asc" }
  }));
  for (const document of documents) {
    const { data, error } = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).download(document.objectPath);
    if (error) {
      logger.warn({ documentId: document.id }, "document scan download failed");
      continue;
    }
    const verdict = await scanner(await data.arrayBuffer(), document.contentType);
    await withPlatform((tx) => Promise.all([
      tx.document.update({
        where: { id: document.id },
        data: {
          status: verdict.clean ? "AVAILABLE" : "REJECTED",
          metadata: { scanner: verdict.engine, scannedAt: new Date().toISOString() }
        }
      }),
      tx.auditLog.create({
        data: {
          clinicId: document.clinicId,
          action: verdict.clean ? "document.scan.passed" : "document.scan.rejected",
          entityType: "Document",
          entityId: document.id,
          after: { scanner: verdict.engine }
        }
      })
    ]));
  }
  return documents.length;
}
