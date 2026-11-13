import type { RequestHandler } from "express";
import { type TransactionClient, withPlatform, withTenant } from "../../config/database-context.js";
import { paginationSchema } from "../../utils/pagination.js";

const safeCsv = (value: unknown) => {
  const text = value == null ? "" : String(value);
  const neutralized = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${neutralized.replaceAll('"', '""')}"`;
};

export const listAuditLogs: RequestHandler = async (req, res) => {
  const { page, pageSize, search } = paginationSchema.parse(req.query);
  const run = (tx: TransactionClient) => tx.auditLog.findMany({
    where: {
      ...(req.auth!.clinicId ? { clinicId: req.auth!.clinicId } : {}),
      ...(search ? { OR: [
        { action: { contains: search, mode: "insensitive" as const } },
        { entityType: { contains: search, mode: "insensitive" as const } }
      ] } : {})
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { actor: { select: { fullName: true, email: true } }, clinic: { select: { name: true } } }
  });
  const data = req.auth!.clinicId ? await withTenant(req.auth!.clinicId, run) : await withPlatform(run);
  res.json({ success: true, data, meta: { page, pageSize, total: data.length, totalPages: data.length < pageSize ? page : page + 1 } });
};

export const exportAuditLogs: RequestHandler = async (req, res) => {
  const run = (tx: TransactionClient) => tx.auditLog.findMany({
    where: req.auth!.clinicId ? { clinicId: req.auth!.clinicId } : {},
    orderBy: { createdAt: "desc" },
    take: 10_000,
    include: { actor: { select: { email: true } }, clinic: { select: { name: true } } }
  });
  const rows = req.auth!.clinicId ? await withTenant(req.auth!.clinicId, run) : await withPlatform(run);
  const csv = [
    ["Timestamp", "Clinic", "Actor", "Action", "Entity", "Entity ID", "Request ID"].map(safeCsv).join(","),
    ...rows.map((row) => [row.createdAt.toISOString(), row.clinic?.name, row.actor?.email, row.action, row.entityType, row.entityId, row.requestId].map(safeCsv).join(","))
  ].join("\r\n");
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename="medistock-audit-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
};
