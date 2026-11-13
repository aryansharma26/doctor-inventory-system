export type SubscriptionPlanId = "starter" | "growth" | "enterprise";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
export type BillingCycle = "monthly" | "yearly";

export interface PlanTier {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  monthlyPricePhp: number;
  yearlyPricePhp: number;
  doctorSeats: number;
  staffSeats: number;
  monthlyPatientsLimit: number | "unlimited";
  popular?: boolean;
  features: string[];
}

export const SAAS_PLANS: PlanTier[] = [
  {
    id: "starter",
    name: "Solo Doctor / Starter",
    tagline: "Ideal for individual doctors & private consultation practices",
    monthlyPricePhp: 1499,
    yearlyPricePhp: 14390, // ~₱1,199/mo (Save 20%)
    doctorSeats: 1,
    staffSeats: 2,
    monthlyPatientsLimit: 500,
    features: [
      "1 Doctor & 2 Staff Logins",
      "Up to 500 Patients / Month",
      "1-Click Doctor Consultation Desk",
      "OPD Token Queue & Thermal Printing",
      "Standard Rx Prescription Generation",
      "Essential Medicines & Stock Tracker",
      "Email & Chat Support",
    ],
  },
  {
    id: "growth",
    name: "Clinic Growth / Pro",
    tagline: "The #1 choice for busy clinics & group practices",
    monthlyPricePhp: 3499,
    yearlyPricePhp: 33590, // ~₱2,799/mo (Save 20%)
    popular: true,
    doctorSeats: 5,
    staffSeats: 10,
    monthlyPatientsLimit: "unlimited",
    features: [
      "Up to 5 Doctors & 10 Staff Logins",
      "Unlimited Patient Consultations",
      "Smart Audio Chime + Voice Token Announcer",
      "Complete BIR-Ready OPD Billing & Receipts",
      "GCash, Maya & Card Payment Tracking",
      "Full Pharmacy POS & Expiry Tracking",
      "Patient Medical History & Vitals CDS Alerts",
      "Daily Financial Collection & Export CSV",
      "Priority WhatsApp & Phone Support",
    ],
  },
  {
    id: "enterprise",
    name: "Polyclinic / Enterprise",
    tagline: "Multi-specialty centers, diagnostic hubs & clinic networks",
    monthlyPricePhp: 7999,
    yearlyPricePhp: 76790, // ~₱6,399/mo (Save 20%)
    doctorSeats: 999,
    staffSeats: 999,
    monthlyPatientsLimit: "unlimited",
    features: [
      "Unlimited Doctors, Nurses & Staff Seats",
      "Multi-Branch & Location Support",
      "Custom Clinic Letterhead & Branding",
      "Advanced Multi-Doctor Queue Routing",
      "Full Audit Trail & DPA Security Compliance",
      "Staff Attendance & Internal Notice Board",
      "Dedicated Technical Account Manager",
      "Custom Data Migration & Staff Onboarding",
      "99.9% Cloud Uptime SLA Guarantee",
    ],
  },
];

export interface SaaSInvoice {
  id: string;
  invoiceNo: string;
  planName: string;
  amountPhp: number;
  date: string;
  status: "PAID" | "PENDING";
  paymentMethod: "GCASH" | "MAYA" | "CARD" | "BANK_TRANSFER";
  downloadUrl?: string;
}

export interface ClinicSubscription {
  clinicId: string;
  clinicName: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  trialEndsAt: string; // ISO string
  currentPeriodEnd: string; // ISO string
  doctorSeatsUsed: number;
  staffSeatsUsed: number;
  patientsCountThisMonth: number;
  invoices: SaaSInvoice[];
}

const STORAGE_KEY = "medistock_saas_subscription";

export function getDefaultSubscription(clinicId = "default-clinic", clinicName = "Metro Manila Health Clinic"): ClinicSubscription {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return {
    clinicId,
    clinicName,
    planId: "growth",
    status: "TRIAL",
    billingCycle: "monthly",
    trialEndsAt: trialEnd.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    doctorSeatsUsed: 2,
    staffSeatsUsed: 4,
    patientsCountThisMonth: 184,
    invoices: [
      {
        id: "inv-init-trial",
        invoiceNo: "INV-SAAS-2026-001",
        planName: "Clinic Growth / Pro (14-Day Free Trial)",
        amountPhp: 0,
        date: new Date().toISOString().split("T")[0],
        status: "PAID",
        paymentMethod: "GCASH",
      },
    ],
  };
}

export function getClinicSubscription(): ClinicSubscription {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultSub = getDefaultSubscription();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSub));
      return defaultSub;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultSubscription();
  }
}

export function saveClinicSubscription(sub: ClinicSubscription): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
    window.dispatchEvent(new Event("medistock-subscription-update"));
  } catch (err) {
    console.error("Failed to save SaaS subscription:", err);
  }
}

export function upgradePlan(
  newPlanId: SubscriptionPlanId,
  billingCycle: BillingCycle,
  paymentMethod: "GCASH" | "MAYA" | "CARD" | "BANK_TRANSFER"
): ClinicSubscription {
  const current = getClinicSubscription();
  const plan = SAAS_PLANS.find((p) => p.id === newPlanId) || SAAS_PLANS[1];
  const amountPhp = billingCycle === "monthly" ? plan.monthlyPricePhp : plan.yearlyPricePhp;

  const newPeriodEnd = new Date();
  if (billingCycle === "yearly") {
    newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
  } else {
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
  }

  const invoiceNo = `INV-SAAS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newInvoice: SaaSInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNo,
    planName: `${plan.name} (${billingCycle.toUpperCase()})`,
    amountPhp,
    date: new Date().toISOString().split("T")[0],
    status: "PAID",
    paymentMethod,
  };

  const updated: ClinicSubscription = {
    ...current,
    planId: newPlanId,
    status: "ACTIVE",
    billingCycle,
    currentPeriodEnd: newPeriodEnd.toISOString(),
    invoices: [newInvoice, ...current.invoices],
  };

  saveClinicSubscription(updated);
  return updated;
}

export function extendTrialDays(days = 14): ClinicSubscription {
  const current = getClinicSubscription();
  const d = new Date(current.trialEndsAt);
  d.setDate(d.getDate() + days);

  const updated: ClinicSubscription = {
    ...current,
    status: "TRIAL",
    trialEndsAt: d.toISOString(),
  };

  saveClinicSubscription(updated);
  return updated;
}

export function getDaysLeftInTrial(trialEndsAt: string): number {
  const diffMs = new Date(trialEndsAt).getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
