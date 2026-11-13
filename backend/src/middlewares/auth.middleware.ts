import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { supabaseAdmin } from "../config/supabase.js";
import { activeMemberships as filterActiveMemberships, resolvePermissions } from "../security/authorization.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

type VerifiedClaims = { aal?: "aal1" | "aal2" };

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) throw new ApiError(401, "UNAUTHENTICATED", "A valid access token is required");
  const token = header.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) throw new ApiError(401, "INVALID_TOKEN", "The access token is invalid or expired");
  const claims = jwt.decode(token) as VerifiedClaims | null;

  const user = await prisma.user.findUnique({
    where: { id: data.user.id },
    include: {
      clinics: {
        where: { isActive: true },
        include: { clinic: true, overrides: true }
      }
    }
  });
  if (!user?.isActive) throw new ApiError(403, "ACCOUNT_DISABLED", "This account is disabled");

  const requestedImpersonation = req.header("x-impersonation-id");
  let requestedClinic = req.header("x-clinic-id");
  let impersonationId: string | undefined;
  if (requestedImpersonation) {
    if (!user.isPlatformAdmin) throw new ApiError(403, "IMPERSONATION_DENIED", "Only platform administrators can impersonate clinics");
    const session = await prisma.impersonationSession.findFirst({
      where: {
        id: requestedImpersonation,
        impersonatorId: user.id,
        endedAt: null,
        startedAt: { gte: new Date(Date.now() - 30 * 60_000) }
      }
    });
    if (!session) throw new ApiError(403, "IMPERSONATION_EXPIRED", "The support session is invalid or expired");
    requestedClinic = session.clinicId;
    impersonationId = session.id;
  }
  const activeMemberships = filterActiveMemberships(user.clinics);
  const allowsUnselectedClinic = req.method === "GET" && req.path === "/auth/me";
  if (!requestedClinic && activeMemberships.length > 1 && !user.isPlatformAdmin && !allowsUnselectedClinic) {
    throw new ApiError(400, "CLINIC_SELECTION_REQUIRED", "Select a clinic to continue");
  }
  const membership = requestedClinic
    ? activeMemberships.find((item) => item.clinicId === requestedClinic)
    : activeMemberships.length === 1 && !user.isPlatformAdmin ? activeMemberships[0] : undefined;
  if (requestedClinic && !membership && !user.isPlatformAdmin) {
    throw new ApiError(403, "TENANT_ACCESS_DENIED", "You do not have access to this clinic");
  }
  if (requestedClinic && !membership && user.isPlatformAdmin) {
    const clinic = await prisma.clinic.findFirst({ where: { id: requestedClinic, deletedAt: null } });
    if (!clinic) throw new ApiError(404, "CLINIC_NOT_FOUND", "Clinic was not found");
    if (clinic.status !== "ACTIVE") throw new ApiError(403, "CLINIC_NOT_ACTIVE", "This clinic is not active");
  }

  const rolePermissions = membership
    ? await prisma.rolePermission.findMany({ where: { role: membership.role }, select: { permissionKey: true } })
    : [];
  const effectivePermissions = resolvePermissions(
    rolePermissions.map((item) => item.permissionKey),
    membership?.overrides ?? []
  );

  req.auth = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    isPlatformAdmin: user.isPlatformAdmin,
    assuranceLevel: claims?.aal === "aal2" ? "aal2" : "aal1",
    ...(membership ? { clinicId: membership.clinicId, membershipId: membership.id, role: membership.role } : requestedClinic ? { clinicId: requestedClinic } : {}),
    permissions: effectivePermissions,
    ...(impersonationId ? { impersonationId } : {}),
    availableClinics: activeMemberships.map((item) => ({
      id: item.clinic.id,
      name: item.clinic.name,
      code: item.clinic.code,
      role: item.role
    }))
  };
  next();
});
