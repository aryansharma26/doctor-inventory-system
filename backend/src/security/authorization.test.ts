import { describe, expect, it } from "vitest";
import { activeMemberships, resolvePermissions } from "./authorization.js";

describe("tenant authorization", () => {
  it("excludes suspended and deleted clinics", () => {
    const base = { id: "membership", clinicId: "clinic", role: "CLINIC_OWNER" as const, isActive: true };
    const memberships = [
      { ...base, clinic: { id: "1", name: "Active", code: "A", status: "ACTIVE", deletedAt: null } },
      { ...base, clinic: { id: "2", name: "Suspended", code: "S", status: "SUSPENDED", deletedAt: null } },
      { ...base, clinic: { id: "3", name: "Deleted", code: "D", status: "ACTIVE", deletedAt: new Date() } }
    ];
    expect(activeMemberships(memberships).map((item) => item.clinic.id)).toEqual(["1"]);
  });

  it("applies explicit deny overrides after role grants", () => {
    expect(resolvePermissions(
      ["inventory.read", "inventory.adjust"],
      [{ permissionKey: "inventory.adjust", effect: "DENY" }, { permissionKey: "audit.read", effect: "GRANT" }]
    )).toEqual(["audit.read", "inventory.read"]);
  });
});
