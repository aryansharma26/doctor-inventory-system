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
import {
  DoctorDeskSketch,
  ReceptionDeskSketch,
  PrescriptionSketch,
  QueueWaitingSketch,
} from "@/components/ui/medical-illustrations";

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activeTab, setActiveTab] = useState<"reception" | "doctor" | "queue" | "pos">("doctor");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center font-bold text-sm shadow-2xs">
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
              MediStock
            </span>
            <span className="text-[10px] font-medium text-teal-700 block leading-none">
              Philippine Clinical SaaS
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <a href="#features" className="hover:text-teal-700 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-teal-700 transition-colors">Pricing (₱ PHP)</a>
          <a href="#compliance" className="hover:text-teal-700 transition-colors">BIR & Privacy</a>
          <Link href="/superadmin/login" className="hover:text-teal-700 transition-colors">Admin</Link>
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
      <section className="pt-14 pb-12 px-6 max-w-5xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-200/80 bg-teal-50/70 text-xs font-semibold text-teal-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Clinical Practice Management & E-Prescribing Platform
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
          Modern clinic care, without the clutter.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The purpose-built medical practice platform for Philippine clinics. Role-separated Doctor Consultation Desk, Front Desk token check-in with automated CDS vitals alerts, and GCash/Maya cashier receipts in one unified system.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/signup" className="btn-primary py-2.5 px-6 text-xs w-full sm:w-auto justify-center">
            Start 14-Day Free Pro Trial <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary py-2.5 px-6 text-xs w-full sm:w-auto justify-center">
            Explore 1-Click Demo Desk
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-teal-600" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-teal-600" /> Multi-branch ready
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-teal-600" /> DPA RA 10173 compliant
          </span>
        </div>
      </section>

      {/* Interactive Feature Showcase with Handcrafted Sketches */}
      <section id="features" className="py-10 px-6 max-w-6xl mx-auto">
        <div className="panel overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          {/* Tabs header */}
          <div className="border-b border-slate-200 px-4 flex items-center gap-2 overflow-x-auto bg-slate-50/70">
            {[
              { id: "doctor", label: "Physician Desk & Rx", icon: Stethoscope },
              { id: "reception", label: "Front Desk & Vitals", icon: Users },
              { id: "queue", label: "Smart Token Announcer", icon: Clock },
              { id: "pos", label: "GCash & BIR Receipts", icon: Receipt },
            ].map((tab) => {
              const Icon = tab.icon;
              const isCurr = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                    isCurr
                      ? "border-teal-600 text-teal-800 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isCurr ? "text-teal-600" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab preview content */}
          <div className="p-6 sm:p-8">
            {activeTab === "doctor" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                    Physician Protected Workspace
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Physician Consultation & Prescription Desk
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Physicians review triage vitals, patient complaints, and clinical history. Prescribe standardized drugs with dosage/frequency/timing, apply 1-click clinical presets (URTI, HTN, Gastritis), and print clean official Rx slips.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        1-Click Protocols
                      </span>
                      <span className="text-xs text-slate-800 font-semibold block">
                        URTI, Hypertension Stage 1, and Gastritis
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Physician Privacy
                      </span>
                      <span className="text-xs text-slate-800 font-semibold block">
                        4-Digit PIN gatekeeper for confidential patient records
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 flex justify-center">
                  <DoctorDeskSketch className="w-56 h-56" />
                </div>
              </div>
            )}

            {activeTab === "reception" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-bold uppercase tracking-wider">
                    Front Desk Triage & Tokens
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Front Desk Intake & Clinical Decision Support (CDS)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Reception staff registers incoming patients, records baseline vitals (BP, SpO2, Temperature, HR), receives instant Clinical Decision Support warnings for abnormal vitals, and issues sequential tokens.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Automated Tokening
                      </span>
                      <span className="text-xs text-slate-800 font-semibold block">
                        Sequential tokens (OPD-101...) with fee receipts
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Vitals CDS Engine
                      </span>
                      <span className="text-xs text-slate-800 font-semibold block">
                        Hypoxia & Stage 2 Hypertension color alerts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 flex justify-center">
                  <ReceptionDeskSketch className="w-56 h-56" />
                </div>
              </div>
            )}

            {activeTab === "queue" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                    Waiting Room Experience
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Smart Audio Token Announcer & Waiting Board
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Eliminate waiting room chaos with our real-time 3-column dispatch board. Built-in speech synthesis calls patients over clinic speakers with crystal clear auditory announcements.
                  </p>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Audio Voice Announcer
                    </span>
                    <span className="text-xs text-slate-800 font-semibold block">
                      "Now calling Token OPD-101, Maria Santos. Please proceed to Doctor's Cabin."
                    </span>
                  </div>
                </div>

                <div className="md:col-span-5 flex justify-center">
                  <QueueWaitingSketch className="w-56 h-56" />
                </div>
              </div>
            )}

            {activeTab === "pos" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    Philippine Cashier & BIR Ready
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">
                    GCash, Maya & BIR Official Receipts
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Full Philippine cashier checkout with Senior Citizen and PWD 20% discounts, 12% VAT exemption math, and direct payment tracking for GCash QR and Maya.
                  </p>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Compliance Ready
                    </span>
                    <span className="text-xs text-slate-800 font-semibold block">
                      Official BIR Receipt printout with Senior/PWD ID validation
                    </span>
                  </div>
                </div>

                <div className="md:col-span-5 flex justify-center">
                  <PrescriptionSketch className="w-52 h-52" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-14 px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <span className="badge badge-teal text-xs font-semibold">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Predictable plans in Philippine Peso (₱ PHP)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Choose a plan tailored to your clinic scale. All tiers include a 14-day free trial with no credit card required.
          </p>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 text-xs font-semibold mt-3">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
                billingCycle === "annual"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Annual (2 Months Free)</span>
              <span className="text-[10px] text-teal-800 font-bold bg-teal-100 px-1.5 py-0.2 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAAS_PLANS.map((plan) => {
            const price = billingCycle === "annual" ? plan.yearlyPricePhp : plan.monthlyPricePhp;
            const isPopular = plan.popular || plan.id === "growth";

            return (
              <div
                key={plan.id}
                className={`panel p-6 rounded-2xl flex flex-col justify-between relative transition-all ${
                  isPopular
                    ? "border-2 border-teal-600 shadow-md bg-white"
                    : "border-slate-200 bg-white"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-teal bg-teal-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full shadow-2xs">
                    Most Popular for Clinics
                  </span>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.tagline}</p>
                  </div>

                  <div className="font-mono text-3xl font-bold text-slate-950 pt-2">
                    {formatPhp(price)}
                    <span className="text-xs font-normal text-slate-500 font-sans">
                      /{billingCycle === "annual" ? "year" : "month"}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <li className="flex items-center gap-2 font-medium text-slate-800">
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{plan.doctorSeats === 999 ? "Unlimited" : plan.doctorSeats} Doctor Seats</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-slate-800">
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{plan.staffSeats === 999 ? "Unlimited" : plan.staffSeats} Staff Seats</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-slate-800">
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>
                        {plan.monthlyPatientsLimit === "unlimited" ? "Unlimited" : plan.monthlyPatientsLimit} Patients / Month
                      </span>
                    </li>
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href="/signup"
                    className={`w-full justify-center py-2.5 text-xs font-semibold ${
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
      <footer id="compliance" className="border-t border-slate-200 py-10 px-6 bg-white text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
              <Activity className="w-3 h-3" />
            </span>
            <span className="font-semibold text-slate-800">MediStock Health Systems Inc.</span>
            <span>·</span>
            <span>Manila, Philippines</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Philippine DPA (RA 10173)</span>
            <span>BIR Tax Compliant</span>
            <span>256-bit Encryption</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
