"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPhp } from "@/lib/utils";
import { SAAS_PLANS } from "@/features/subscription/saas-subscription-store";
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Lock,
  Pill,
  Receipt,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activeTab, setActiveTab] = useState<"reception" | "doctor" | "queue" | "pos">("reception");

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-[#09090b]">
      {/* Minimalist Top Nav */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-zinc-200 h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
            <Activity className="w-4 h-4" />
          </span>
          <span className="font-semibold text-sm tracking-tight text-zinc-950">
            MediStock
          </span>
          <span className="badge badge-zinc text-[10px] hidden sm:inline">
            Philippines Healthtech
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600">
          <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing (₱ PHP)</a>
          <a href="#compliance" className="hover:text-zinc-900 transition-colors">BIR & Privacy</a>
          <Link href="/superadmin/login" className="hover:text-zinc-900 transition-colors">Admin</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary text-xs">
            Sign In
          </Link>
          <Link href="/signup" className="btn-primary text-xs">
            Start Free Trial <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-6 max-w-5xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-700 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Now Live with BIR Official Receipts & E-Wallet Integration
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-950 max-w-3xl mx-auto leading-tight">
          Modern clinic operations, without the clutter.
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          The purpose-built medical practice platform for Philippine clinics. Real-time OPD token caller, physician consultation desk, and GCash/Maya cashier receipts in one unified system.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/signup" className="btn-primary py-2.5 px-5 text-sm w-full sm:w-auto justify-center">
            Start 14-Day Free Pro Trial <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary py-2.5 px-5 text-sm w-full sm:w-auto justify-center">
            Explore 1-Click Demo Desk
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-zinc-800" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-zinc-800" /> Multi-branch ready
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-zinc-800" /> DPA RA 10173 compliant
          </span>
        </div>
      </section>

      {/* Interactive Feature Showcase Panel */}
      <section id="features" className="py-10 px-6 max-w-6xl mx-auto">
        <div className="panel overflow-hidden border-zinc-200 shadow-xs bg-white">
          {/* Tabs header */}
          <div className="border-b border-zinc-200 px-4 flex items-center gap-2 overflow-x-auto bg-zinc-50/70">
            {[
              { id: "reception", label: "Patient Check-In & Vitals", icon: Users },
              { id: "doctor", label: "Doctor Desk & Rx", icon: Stethoscope },
              { id: "queue", label: "Smart Token Announcer", icon: Clock },
              { id: "pos", label: "GCash & BIR Receipts", icon: Receipt },
            ].map((tab) => {
              const Icon = tab.icon;
              const isCurr = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                    isCurr
                      ? "border-zinc-900 text-zinc-900 bg-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab preview content */}
          <div className="p-6">
            {activeTab === "reception" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900">
                    Front Desk Token & Check-In Desk
                  </h3>
                  <span className="badge badge-zinc font-mono text-[11px]">
                    Automatic sequential numbering (OPD-101...)
                  </span>
                </div>
                <p className="text-xs text-zinc-600 max-w-2xl">
                  Reception staff registers patient demographics, records baseline vital signs (BP, SpO2, Temperature, HR), receives instant Clinical Decision Support alerts for abnormal vitals, and issues official queue tokens with GCash payment.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      Patient Details
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Name, Age, Gender, +63 Phone & Blood Group
                    </span>
                  </div>
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      Clinical Alerts
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Stage 2 HTN, Critical Hypoxia & High Fever warnings
                    </span>
                  </div>
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      Cashier Sync
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Consultation + Vitals fees auto-recorded to POS
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "doctor" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900">
                    Physician Consultation & Rx Desk
                  </h3>
                  <span className="badge badge-zinc text-[11px]">
                    Protected by 4-digit PIN security
                  </span>
                </div>
                <p className="text-xs text-zinc-600 max-w-2xl">
                  Physicians view the patient's vitals, complaints, and clinical history. Write prescriptions with dosage/frequency/timing, apply 1-click clinical presets for common illnesses, schedule follow-up dates, and generate printable prescription slips.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      1-Click Presets
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      URTI, Hypertension Stage 1, and Gastritis protocols
                    </span>
                  </div>
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      Prescription Print
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Standardized Rx format ready for Philippine pharmacies
                    </span>
                  </div>
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      Follow-up Reminders
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Automatic scheduling on clinic follow-up calendar
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "queue" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900">
                    Smart Audio Queue Announcer
                  </h3>
                  <span className="badge badge-zinc text-[11px]">
                    Dual-monitor / Lobby TV compatible
                  </span>
                </div>
                <p className="text-xs text-zinc-600 max-w-2xl">
                  Display waiting queue status on lobby monitors. Built-in speech synthesizer speaks aloud token numbers and patient names so patients never miss their turn.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      Audio Voice Caller
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      "Now calling Token OPD-101, Maria Santos"
                    </span>
                  </div>
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      FIFO Queue
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Orderly flow from Waiting Lobby to Doctor Cabin
                    </span>
                  </div>
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      Zero Refresh
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Instant state updates across multiple computers
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pos" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900">
                    Philippine Cashier & POS Operations
                  </h3>
                  <span className="badge badge-zinc text-[11px]">
                    BIR Tax Invoice Ready
                  </span>
                </div>
                <p className="text-xs text-zinc-600 max-w-2xl">
                  Accept GCash, Maya, Debit/Credit Cards, and Cash. Generate serialized Official Receipts (O.R.) with itemized consultation fees, vitals checks, and pharmacy items.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      ₱ PHP Currency
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Strict Philippine peso standard across all modules
                    </span>
                  </div>
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      E-Wallet Ref Tracking
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Record GCash / Maya reference numbers for audit
                    </span>
                  </div>
                  <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase block mb-1">
                      End-of-Day Balancing
                    </span>
                    <span className="text-xs text-zinc-800 font-medium block">
                      Cash drawer audit summary & reconciliation reports
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            Plans built for growing Philippine practices
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
            All plans include a 14-day free trial with zero setup fees. Cancel anytime.
          </p>

          {/* Monthly / Annual Switch */}
          <div className="pt-4 flex items-center justify-center gap-2">
            <div className="inline-flex items-center p-1 bg-zinc-100 rounded text-xs">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`py-1 px-3 rounded cursor-pointer transition-colors ${
                  billingCycle === "monthly" ? "bg-white font-semibold text-zinc-900 shadow-2xs" : "text-zinc-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`py-1 px-3 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                  billingCycle === "annual" ? "bg-white font-semibold text-zinc-900 shadow-2xs" : "text-zinc-600"
                }`}
              >
                Annual <span className="badge badge-green text-[10px] font-bold">Save 20%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAAS_PLANS.map((plan) => {
            const price = billingCycle === "annual" ? plan.yearlyPricePhp : plan.monthlyPricePhp;
            const isPopular = plan.id === "growth";

            return (
              <div
                key={plan.id}
                className={`panel p-6 flex flex-col justify-between ${
                  isPopular ? "border-zinc-900 shadow-xs relative" : "border-zinc-200"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-zinc bg-zinc-900 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                    Most Popular for Clinics
                  </span>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-zinc-900">{plan.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{plan.tagline}</p>
                  </div>

                  <div className="font-mono text-3xl font-bold text-zinc-950 pt-2">
                    {formatPhp(price)}
                    <span className="text-xs font-normal text-zinc-500 font-sans">
                      /{billingCycle === "annual" ? "year" : "month"}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-zinc-600 pt-3 border-t border-zinc-100">
                    <li className="flex items-center gap-2 font-medium text-zinc-800">
                      <Check className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                      <span>{plan.doctorSeats === 999 ? "Unlimited" : plan.doctorSeats} Doctor Seats</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-zinc-800">
                      <Check className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                      <span>{plan.staffSeats === 999 ? "Unlimited" : plan.staffSeats} Staff Seats</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-zinc-800">
                      <Check className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                      <span>
                        {plan.monthlyPatientsLimit === "unlimited" ? "Unlimited" : plan.monthlyPatientsLimit} Patients / Month
                      </span>
                    </li>
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href="/signup"
                    className={`w-full justify-center py-2.5 text-xs ${
                      isPopular ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    Start 14-Day Free Trial
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Compliance & Footer */}
      <footer id="compliance" className="border-t border-zinc-200 py-10 px-6 bg-white text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
              <Activity className="w-3 h-3" />
            </span>
            <span className="font-semibold text-zinc-800">MediStock Health Systems Inc.</span>
            <span>·</span>
            <span>Manila, Philippines</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>Philippine DPA (RA 10173)</span>
            <span>BIR Tax Compliant</span>
            <span>256-bit Encryption</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
