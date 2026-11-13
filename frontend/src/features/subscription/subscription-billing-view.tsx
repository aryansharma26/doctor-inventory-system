import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Coins,
  CreditCard,
  Crown,
  Download,
  FileText,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type BillingCycle,
  type ClinicSubscription,
  getClinicSubscription,
  getDaysLeftInTrial,
  SAAS_PLANS,
  type SubscriptionPlanId,
  upgradePlan,
} from "./saas-subscription-store";

export function SubscriptionBillingView() {
  const [sub, setSub] = useState<ClinicSubscription>(getClinicSubscription());
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] =
    useState<SubscriptionPlanId>("growth");
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("monthly");
  const [selectedMethod, setSelectedMethod] = useState<
    "GCASH" | "MAYA" | "CARD" | "BANK_TRANSFER"
  >("GCASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingReceiptInvoice, setViewingReceiptInvoice] = useState<any | null>(
    null,
  );

  useEffect(() => {
    const handleUpdate = () => setSub(getClinicSubscription());
    window.addEventListener("medistock-subscription-update", handleUpdate);
    return () =>
      window.removeEventListener("medistock-subscription-update", handleUpdate);
  }, []);

  const currentPlan =
    SAAS_PLANS.find((p) => p.id === sub.planId) || SAAS_PLANS[1];
  const daysLeftInTrial = getDaysLeftInTrial(sub.trialEndsAt);
  const isTrial = sub.status === "TRIAL";

  const handleConfirmUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const updated = upgradePlan(
        selectedPlanId,
        selectedCycle,
        selectedMethod,
      );
      setSub(updated);
      setIsProcessing(false);
      setIsUpgradeModalOpen(false);
      toast.success(
        `🎉 Clinic successfully upgraded to ${
          SAAS_PLANS.find((p) => p.id === selectedPlanId)?.name
        }! All features activated.`,
      );
    }, 900);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              SaaS Multi-Tenant Subscription & Licensing
            </div>

            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <span>{sub.clinicName}</span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                  isTrial
                    ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                }`}
              >
                {isTrial ? "Free Trial" : "Active Plan"}
              </span>
            </h1>

            <p className="text-blue-200/80 text-sm leading-relaxed">
              Current Plan:{" "}
              <strong className="text-white font-bold">
                {currentPlan.name}
              </strong>
              .{" "}
              {isTrial ? (
                <>
                  You have{" "}
                  <span className="text-amber-300 font-extrabold text-base">
                    {daysLeftInTrial} days
                  </span>{" "}
                  left in your trial. Upgrade anytime to ensure uninterrupted OPD
                  service.
                </>
              ) : (
                <>
                  Your subscription renews on{" "}
                  <strong className="text-white">
                    {new Date(sub.currentPeriodEnd).toLocaleDateString("en-PH", {
                      dateStyle: "long",
                    })}
                  </strong>{" "}
                  ({sub.billingCycle.toUpperCase()}).
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                setSelectedPlanId(sub.planId);
                setIsUpgradeModalOpen(true);
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              {isTrial ? "Upgrade to Pro" : "Change Subscription Plan"}
            </button>
          </div>
        </div>
      </div>

      {/* Plan Usage & Quotas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Doctor Seats
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {sub.doctorSeatsUsed}{" "}
              <span className="text-slate-400 font-medium text-sm">
                / {currentPlan.doctorSeats >= 999 ? "Unlimited" : currentPlan.doctorSeats}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (sub.doctorSeatsUsed /
                      (currentPlan.doctorSeats >= 999 ? 10 : currentPlan.doctorSeats)) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Active consulting doctor profiles under this clinic
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Staff & Nurse Seats
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {sub.staffSeatsUsed}{" "}
              <span className="text-slate-400 font-medium text-sm">
                / {currentPlan.staffSeats >= 999 ? "Unlimited" : currentPlan.staffSeats}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (sub.staffSeatsUsed /
                      (currentPlan.staffSeats >= 999 ? 15 : currentPlan.staffSeats)) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Receptionists, triage nurses, and pharmacy staff logins
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Patients
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <BadgeCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {sub.patientsCountThisMonth}{" "}
              <span className="text-slate-400 font-medium text-sm">
                / {currentPlan.monthlyPatientsLimit === "unlimited" ? "Unlimited" : `${currentPlan.monthlyPatientsLimit} cap`}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    currentPlan.monthlyPatientsLimit === "unlimited"
                      ? 25
                      : Math.min(
                          100,
                          (sub.patientsCountThisMonth /
                            (typeof currentPlan.monthlyPatientsLimit === "number"
                              ? currentPlan.monthlyPatientsLimit
                              : 1000)) *
                            100,
                        )
                  }%`,
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold">
            100% capacity available · Zero throttling
          </p>
        </div>
      </div>

      {/* Subscription Features Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Included in Your {currentPlan.name} Plan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Everything your clinic needs for high-efficiency daily OPD
              operations.
            </p>
          </div>
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Compare all tiers <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentPlan.features.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs text-slate-700 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SaaS Billing Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              SaaS Billing History & Official Tax Invoices
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Download BIR-compliant official receipts for software expenses.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            Currency: PHP (₱)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Invoice #</th>
                <th className="pb-3">Subscription Description</th>
                <th className="pb-3">Billing Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sub.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-mono font-bold text-slate-900">
                    {inv.invoiceNo}
                  </td>
                  <td className="py-4 font-semibold text-slate-800">
                    {inv.planName}
                  </td>
                  <td className="py-4 text-slate-500">{inv.date}</td>
                  <td className="py-4 font-mono font-bold text-slate-900">
                    ₱{inv.amountPhp.toLocaleString("en-PH")} PHP
                  </td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px]">
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {inv.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setViewingReceiptInvoice(inv)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> View / Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Upgrade & Switcher Modal */}
      {isUpgradeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsUpgradeModalOpen(false)}
        >
          <div
            className="w-full max-w-5xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  SaaS Clinic Licensing
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  Upgrade or Change Subscription Plan
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select the plan that matches your clinic's doctor count and
                  patient volume.
                </p>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Monthly vs Annual Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedCycle("monthly")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    selectedCycle === "monthly"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCycle("yearly")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCycle === "yearly"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SAAS_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const price =
                  selectedCycle === "monthly"
                    ? plan.monthlyPricePhp
                    : Math.round(plan.yearlyPricePhp / 12);

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/20 shadow-xl ring-2 ring-blue-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 min-h-[36px]">
                          {plan.tagline}
                        </p>
                      </div>

                      <div className="border-y border-slate-100 py-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900 font-mono">
                            ₱{price.toLocaleString("en-PH")}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            / month
                          </span>
                        </div>
                        {selectedCycle === "yearly" && (
                          <div className="text-[10px] text-emerald-600 font-bold mt-1">
                            Billed annually (₱{plan.yearlyPricePhp.toLocaleString("en-PH")}/yr)
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Key Limits:
                        </div>
                        <div className="text-xs font-semibold text-slate-700 space-y-1">
                          <div>👨‍⚕️ {plan.doctorSeats >= 999 ? "Unlimited" : `${plan.doctorSeats} Doctor seats`}</div>
                          <div>👥 {plan.staffSeats >= 999 ? "Unlimited" : `${plan.staffSeats} Staff seats`}</div>
                          <div>📋 {plan.monthlyPatientsLimit === "unlimited" ? "Unlimited" : `${plan.monthlyPatientsLimit} patients / mo`}</div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        {plan.features.slice(2, 6).map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-slate-600 font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="button"
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? "Selected Plan ✓" : "Choose Plan"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selection */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Payment Method (Philippine E-Wallets & Cards)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instant SaaS activation upon confirmation.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  Secure 256-Bit SSL
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: "GCASH",
                    name: "GCash",
                    badge: "E-Wallet",
                    icon: Wallet,
                    color: "text-blue-600",
                  },
                  {
                    id: "MAYA",
                    name: "Maya / QR Ph",
                    badge: "E-Wallet",
                    icon: QrCode,
                    color: "text-emerald-600",
                  },
                  {
                    id: "CARD",
                    name: "Credit / Debit Card",
                    badge: "Visa/MC",
                    icon: CreditCard,
                    color: "text-indigo-600",
                  },
                  {
                    id: "BANK_TRANSFER",
                    name: "BDO / BPI Bank",
                    badge: "Online Bank",
                    icon: Coins,
                    color: "text-amber-600",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedMethod(item.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedMethod === item.id
                        ? "border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">
                      {item.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmUpgrade}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>Processing Activation...</>
                ) : (
                  <>
                    Confirm & Activate Plan <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official SaaS Receipt Print Modal */}
      {viewingReceiptInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setViewingReceiptInvoice(null)}
        >
          <div
            className="w-full max-w-2xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <div className="text-xl font-extrabold text-[#071b4a] tracking-tight">
                  MediStock Cloud SaaS
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Official SaaS Subscription Billing Receipt
                </div>
              </div>
              <button
                onClick={() => setViewingReceiptInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Billed To:
                </span>
                <strong className="text-slate-900 block text-sm">
                  {sub.clinicName}
                </strong>
                <span className="text-slate-500 block">
                  Clinic Tenant ID: {sub.clinicId}
                </span>
                <span className="text-slate-500 block">
                  Location: Metro Manila, Philippines
                </span>
              </div>

              <div className="space-y-1 text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Receipt Details:
                </span>
                <strong className="text-slate-900 block font-mono text-sm">
                  {viewingReceiptInvoice.invoiceNo}
                </strong>
                <span className="text-slate-500 block">
                  Date: {viewingReceiptInvoice.date}
                </span>
                <span className="text-emerald-600 font-bold block">
                  Status: PAID ({viewingReceiptInvoice.paymentMethod})
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Amount (PHP)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">
                      {viewingReceiptInvoice.planName}
                      <span className="block text-[11px] text-slate-400 font-normal">
                        Cloud Clinic Management SaaS Subscription License
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">1</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      ₱{viewingReceiptInvoice.amountPhp.toLocaleString("en-PH")}.00
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={2} className="p-3 text-right">
                      Total Paid:
                    </td>
                    <td className="p-3 text-right font-mono text-sm text-blue-700">
                      ₱{viewingReceiptInvoice.amountPhp.toLocaleString("en-PH")}.00 PHP
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-[10px] text-slate-400 text-center leading-relaxed">
              MediStock Philippines Cloud Technologies Inc. · BIR TIN: 009-842-192-00000
              <br />
              Payment via {viewingReceiptInvoice.paymentMethod} · Thank you for trusting MediStock SaaS!
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
