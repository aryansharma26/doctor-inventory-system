import { beforeEach, describe, expect, it } from "vitest";
import {
  extendTrialDays,
  getClinicSubscription,
  getDaysLeftInTrial,
  getDefaultSubscription,
  SAAS_PLANS,
  upgradePlan,
} from "./saas-subscription-store";

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

(globalThis as any).localStorage = storageMock;
(globalThis as any).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

describe("SaaS Multi-Tenant Subscription Engine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defines 3 standard SaaS tiers with accurate PHP pricing and limits", () => {
    expect(SAAS_PLANS).toHaveLength(3);

    const starter = SAAS_PLANS.find((p) => p.id === "starter");
    const growth = SAAS_PLANS.find((p) => p.id === "growth");
    const enterprise = SAAS_PLANS.find((p) => p.id === "enterprise");

    expect(starter).toBeDefined();
    expect(starter?.monthlyPricePhp).toBe(1499);
    expect(starter?.doctorSeats).toBe(1);
    expect(starter?.monthlyPatientsLimit).toBe(500);

    expect(growth).toBeDefined();
    expect(growth?.monthlyPricePhp).toBe(3499);
    expect(growth?.popular).toBe(true);
    expect(growth?.doctorSeats).toBe(5);
    expect(growth?.monthlyPatientsLimit).toBe("unlimited");

    expect(enterprise).toBeDefined();
    expect(enterprise?.monthlyPricePhp).toBe(7999);
    expect(enterprise?.doctorSeats).toBe(999);
    expect(enterprise?.monthlyPatientsLimit).toBe("unlimited");

    // Verify annual discount (~20% savings)
    expect(starter!.yearlyPricePhp).toBeLessThan(starter!.monthlyPricePhp * 12);
    expect(growth!.yearlyPricePhp).toBeLessThan(growth!.monthlyPricePhp * 12);
    expect(enterprise!.yearlyPricePhp).toBeLessThan(enterprise!.monthlyPricePhp * 12);
  });

  it("initializes default subscription with 14-day Pro trial", () => {
    const defaultSub = getDefaultSubscription("tenant-101", "Manila Central Clinic");

    expect(defaultSub.clinicId).toBe("tenant-101");
    expect(defaultSub.clinicName).toBe("Manila Central Clinic");
    expect(defaultSub.planId).toBe("growth");
    expect(defaultSub.status).toBe("TRIAL");
    expect(defaultSub.invoices).toHaveLength(1);
    expect(defaultSub.invoices[0].amountPhp).toBe(0);

    const days = getDaysLeftInTrial(defaultSub.trialEndsAt);
    expect(days).toBeGreaterThanOrEqual(13);
    expect(days).toBeLessThanOrEqual(14);
  });

  it("calculates trial days remaining correctly", () => {
    // 5 days in future
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDaysLeftInTrial(future.toISOString())).toBe(5);

    // Expired trial (in the past)
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(getDaysLeftInTrial(past.toISOString())).toBe(0);
  });

  it("upgrades clinic plan and issues an official SaaS invoice", () => {
    // Start with trial
    const sub = getClinicSubscription();
    expect(sub.status).toBe("TRIAL");

    // Upgrade to Enterprise Yearly with GCash
    const upgraded = upgradePlan("enterprise", "yearly", "GCASH");

    expect(upgraded.status).toBe("ACTIVE");
    expect(upgraded.planId).toBe("enterprise");
    expect(upgraded.billingCycle).toBe("yearly");
    expect(upgraded.invoices[0].amountPhp).toBe(76790);
    expect(upgraded.invoices[0].paymentMethod).toBe("GCASH");
    expect(upgraded.invoices[0].invoiceNo).toMatch(/^INV-SAAS-/);
    expect(upgraded.invoices[0].status).toBe("PAID");

    // Verify persistence in localStorage
    const reloaded = getClinicSubscription();
    expect(reloaded.status).toBe("ACTIVE");
    expect(reloaded.planId).toBe("enterprise");
  });

  it("extends trial days by 14 days when requested by Super Admin", () => {
    const sub = getClinicSubscription();
    const initialDays = getDaysLeftInTrial(sub.trialEndsAt);

    const extended = extendTrialDays(14);
    const newDays = getDaysLeftInTrial(extended.trialEndsAt);

    expect(newDays).toBeGreaterThan(initialDays);
    expect(extended.status).toBe("TRIAL");
  });
});
