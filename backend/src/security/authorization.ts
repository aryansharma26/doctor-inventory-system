import type { PermissionEffect, Role } from "@prisma/client";

export type ClinicMembershipView = {
  id: string;
  clinicId: string;
  role: Role;
  isActive: boolean;
  clinic: { id: string; name: string; code: string; status: string; deletedAt: Date | null };
};

export function activeMemberships<T extends ClinicMembershipView>(memberships: T[]): T[] {
  return memberships.filter((item) =>
    item.isActive && item.clinic.status === "ACTIVE" && item.clinic.deletedAt === null
  );
}

export function resolvePermissions(
  rolePermissions: string[],
  overrides: Array<{ permissionKey: string; effect: PermissionEffect }>
): string[] {
  const effective = new Set(rolePermissions);
  for (const override of overrides) {
    if (override.effect === "GRANT") effective.add(override.permissionKey);
    else effective.delete(override.permissionKey);
  }
  return [...effective].sort();
}

