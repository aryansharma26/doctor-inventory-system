"use client";

import { useEffect, useState } from "react";
import {
  type ClinicSubscription,
  type SubscriptionPlanId,
  SAAS_PLANS,
  getClinicSubscription,
  getDaysLeftInTrial,
  upgradePlan,
} from "./saas-subscription-store";
import { formatPhp } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Printer,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export function SubscriptionBillingView() {
  const { identity } = useAuth();
  const clinicId = identity?.selectedClinicId || "clinic-st-jude";
  const [sub, setSub] = useState<ClinicSubscription | null>(null);

  // Upgrade Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>("growth");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"GCASH" | "MAYA" | "CARD" | "BANK_TRANSFER">("GCASH");
  const [isProcessing, setIsProcessing] = useState(false);

  const reloadSub = () => {
    setSub(getClinicSubscription());
  };

  useEffect(() => {
    reloadSub();
    const handleUpdate = () => reloadSub();
    window.addEventListener("medistock-subscription-update", handleUpdate);
    return () => window.removeEventListener("medistock-subscription-update", handleUpdate);
  }, []);

  if (!sub) return null;

  const currentPlan = SAAS_PLANS.find((p) => p.id === sub.planId) || SAAS_PLANS[1];
  const daysLeftInTrial = getDaysLeftInTrial(sub.trialEndsAt);

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const updated = upgradePlan(
        selectedPlan,
        billingCycle === "annual" ? "yearly" : "monthly",
        paymentMethod
      );
      setSub(updated);
      setIsProcessing(false);
      setShowUpgradeModal(false);
      toast.success(`Plan successfully updated to ${SAAS_PLANS.find((p) => p.id === selectedPlan)?.name}!`);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            SaaS Plan & Billing
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage your clinic subscription tier, usage quotas, and BIR tax invoices.
          </p>
        </div>

        <button
          onClick={() => setShowUpgradeModal(true)}
          className="btn-primary text-xs"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Change / Upgrade Plan
        </button>
      </div>

      {/* Current Plan Overview Card */}
      <div className="panel p-5 border-zinc-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-zinc-950">
                {currentPlan.name} Tier
              </span>
              {sub.status === "TRIAL" ? (
                <span className="badge badge-amber text-xs">
                  <Clock className="w-3 h-3" /> 14-Day Free Trial ({daysLeftInTrial} days left)
                </span>
              ) : (
                <span className="badge badge-green text-xs">
                  <CheckCircle2 className="w-3 h-3" /> Active Paid Subscription
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              {currentPlan.tagline}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl font-bold text-zinc-900 font-mono">
              {formatPhp(sub.billingCycle === "yearly" ? currentPlan.yearlyPricePhp : currentPlan.monthlyPricePhp)}
              <span className="text-xs font-normal text-zinc-500 font-sans">
                /{sub.billingCycle === "yearly" ? "yr" : "mo"}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Next billing: {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>

        {/* Quotas & Capacity Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-3 rounded bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-zinc-600">Doctor Seats</span>
              <span className="font-mono font-bold text-zinc-900">
                {sub.doctorSeatsUsed} / {currentPlan.doctorSeats === 999 ? "∞" : currentPlan.doctorSeats}
              </span>
            </div>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-zinc-900 h-full rounded-full"
                style={{
                  width: `${Math.min(100, (sub.doctorSeatsUsed / currentPlan.doctorSeats) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="p-3 rounded bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-zinc-600">Staff Seats</span>
              <span className="font-mono font-bold text-zinc-900">
                {sub.staffSeatsUsed} / {currentPlan.staffSeats === 999 ? "∞" : currentPlan.staffSeats}
              </span>
            </div>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-zinc-900 h-full rounded-full"
                style={{
                  width: `${Math.min(100, (sub.staffSeatsUsed / currentPlan.staffSeats) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="p-3 rounded bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-zinc-600">Monthly Patients</span>
              <span className="font-mono font-bold text-zinc-900">
                {sub.patientsCountThisMonth} / {currentPlan.monthlyPatientsLimit === "unlimited" ? "Unlimited" : currentPlan.monthlyPatientsLimit}
              </span>
            </div>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-zinc-900 h-full rounded-full"
                style={{
                  width: `${Math.min(100, (sub.patientsCountThisMonth / (currentPlan.monthlyPatientsLimit === "unlimited" ? 1000 : currentPlan.monthlyPatientsLimit)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Official SaaS Invoices & Tax Receipts Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-900">
              Tax Receipts & Invoices (BIR Compliant)
            </span>
            <span className="badge badge-zinc font-mono text-[11px]">
              {sub.invoices.length} Invoices
            </span>
          </div>

          <span className="text-[11px] text-zinc-400">
            Currency: Philippine Peso (₱ PHP)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th className="table-header">Invoice No.</th>
                <th className="table-header">Plan Description</th>
                <th className="table-header">Billing Date</th>
                <th className="table-header">Amount Paid</th>
                <th className="table-header">Payment Mode</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {sub.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="table-cell font-mono font-bold text-zinc-900">
                    {inv.invoiceNo}
                  </td>
                  <td className="table-cell font-medium text-zinc-800">
                    {inv.planName}
                  </td>
                  <td className="table-cell font-mono text-zinc-500">
                    {inv.date}
                  </td>
                  <td className="table-cell font-mono font-bold text-zinc-950">
                    {formatPhp(inv.amountPhp)}
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-zinc uppercase">
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-green">PAID</span>
                  </td>
                  <td className="table-cell text-right">
                    <button
                      onClick={() => {
                        toast.info(`Printing Official SaaS Invoice: ${inv.invoiceNo}`);
                        window.print();
                      }}
                      className="btn-secondary text-[11px] py-1 px-2"
                    >
                      <Printer className="w-3 h-3" /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="panel max-w-2xl w-full p-6 shadow-xl bg-white space-y-5 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-base text-zinc-900">
                Select Your Subscription Tier
              </h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-zinc-400 hover:text-zinc-800 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center justify-center gap-2 p-1 bg-zinc-100 rounded max-w-xs mx-auto text-xs">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 py-1 rounded cursor-pointer transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-white font-semibold text-zinc-900 shadow-2xs"
                    : "text-zinc-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`flex-1 py-1 rounded cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                  billingCycle === "annual"
                    ? "bg-white font-semibold text-zinc-900 shadow-2xs"
                    : "text-zinc-600"
                }`}
              >
                Annual <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">Save 20%</span>
              </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SAAS_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const price = billingCycle === "annual" ? plan.yearlyPricePhp : plan.monthlyPricePhp;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-3.5 rounded border cursor-pointer transition-all ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-50 shadow-2xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-zinc-900">
                        {plan.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="text-base font-bold text-zinc-900 font-mono mt-1">
                      {formatPhp(price)}
                      <span className="text-[10px] text-zinc-500 font-normal font-sans">
                        /{billingCycle === "annual" ? "yr" : "mo"}
                      </span>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-[11px] text-zinc-600 border-t border-zinc-100 pt-2.5">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <span className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                Select Payment Mode
              </span>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {(["GCASH", "MAYA", "CARD"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-2 rounded border text-center font-medium cursor-pointer transition-colors ${
                      paymentMethod === method
                        ? "border-zinc-900 bg-zinc-50 text-zinc-950 font-bold"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="btn-primary"
              >
                {isProcessing ? "Processing Tax Invoice..." : `Confirm & Pay with ${paymentMethod}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
