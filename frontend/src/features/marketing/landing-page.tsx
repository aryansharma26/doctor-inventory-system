import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  HelpCircle,
  Laptop,
  Package,
  Sparkles,
  Stethoscope,
  Volume2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { SAAS_PLANS } from "../subscription/saas-subscription-store";

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [activeTab, setActiveTab] = useState<"doctor" | "queue" | "billing" | "inventory">(
    "doctor",
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* SaaS Top Sticky Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Activity size={22} />
                <i className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-slate-950 bg-amber-400" />
              </span>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  MediStock <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase tracking-wider">SaaS</span>
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-blue-400">
                  Cloud Clinic Suite
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#solutions" className="hover:text-white transition-colors">
                Solutions
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing (₱ PHP)
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                FAQ
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-blue-300 backdrop-blur-md">
            <span className="text-amber-400">★★★★★</span>
            <span>The #1 Cloud OPD & Clinic Management SaaS in the Philippines</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
            Run Your Clinic With
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              Zero Paper & Zero Wait Chaos.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Equip your doctors with <strong>1-click prescription consultation</strong>, call waiting patients with <strong>chime & voice announcements</strong>, and issue <strong>BIR-compliant receipts via GCash & Maya</strong>. Built specifically for Philippine clinics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Start Free 14-Day Pro Trial <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/reception"
              className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-2xl border border-white/15 transition-all flex items-center justify-center gap-2"
            >
              <Laptop className="w-4 h-4 text-blue-400" />
              Open Live Clinic Demo
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No Credit Card Required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 2-Minute Setup
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Philippine DPA Compliant
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> GCash & Maya Ready
            </span>
          </div>
        </div>

        {/* Live System Mockup Preview Card */}
        <div className="max-w-6xl mx-auto mt-16 rounded-3xl border border-white/15 bg-slate-900/90 shadow-2xl overflow-hidden p-2 sm:p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-rose-500 inline-block" />
              <span className="size-3 rounded-full bg-amber-500 inline-block" />
              <span className="size-3 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 font-mono text-[11px] text-slate-500">medistock-cloud.ph/practice</span>
            </div>
            <span className="text-[11px] font-bold text-blue-400">
              Live Interactive SaaS Preview
            </span>
          </div>

          <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">OPD Queue</span>
              <div className="text-2xl font-black text-white">18 Patients</div>
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Voice Caller Active
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Today's Revenue</span>
              <div className="text-2xl font-black text-white font-mono">₱12,850 PHP</div>
              <div className="text-xs text-blue-400 font-semibold">
                72% GCash / Maya E-Wallets
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Average Wait Time</span>
              <div className="text-2xl font-black text-white">8.5 Mins</div>
              <div className="text-xs text-emerald-400 font-semibold">
                ↓ 60% Faster Turnaround
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Low Stock Alerts</span>
              <div className="text-2xl font-black text-white">2 Items</div>
              <div className="text-xs text-amber-400 font-semibold">
                Auto PO Generated
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Matrix Section */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Comprehensive SaaS Modules
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Everything Your Clinic Needs in One Tab
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Engineered from ground up to replace fragmented software, messy Excel sheets, and handwritten prescriptions.
          </p>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl max-w-2xl mx-auto">
          {[
            { id: "doctor", label: "🩺 Doctor Consultation", icon: Stethoscope },
            { id: "queue", label: "🛎️ Smart Queue & Voice", icon: Volume2 },
            { id: "billing", label: "💳 ₱ POS & E-Wallets", icon: Wallet },
            { id: "inventory", label: "📦 Pharmacy & Stock", icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Feature Content */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
          {activeTab === "doctor" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                  Doctor's Desk
                </span>
                <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  1-Click Prescriptions & Clinical Decision Support
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Doctor creates full, professional prescriptions in under 30 seconds. Includes 1-click diagnosis chips, quick dosage presets, vital sign alerts (Hypertension, Hypoxia, Fever), and comprehensive patient medical history.
                </p>
                <div className="space-y-3 text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    1-Click chips for Flu, Bronchitis, Hypertension, Diabetes & UTI
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Doctor custom prescription templates & common advice chips
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Instant A4 & A5 prescription printout with clinic header & PRC details
                  </div>
                </div>
                <Link
                  to="/consultation"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 pt-2"
                >
                  Try Doctor Desk in Demo <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-xs border-b border-white/10 pb-3">
                  <span className="font-bold text-white">Prescription Preview</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    Token #101 · Maria Santos
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">Biogesic Paracetamol 500mg</strong>
                      <span className="text-slate-400 text-[11px]">1 Tablet · 1-0-1 · After Meals (5 Days)</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[10px]">In Stock</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">Amoxil Amoxicillin 500mg</strong>
                      <span className="text-slate-400 text-[11px]">1 Capsule · 1-1-1 · After Meals (7 Days)</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[10px]">In Stock</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "queue" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                  Reception & Queue
                </span>
                <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  Two-Tone Chime & Voice Patient Announcer
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Say goodbye to shouting patient names in crowded waiting rooms. With 1-click on the Reception Desk or Doctor Desk, the system rings a pleasant two-tone musical chime and announces the patient's token and name aloud over your clinic speakers.
                </p>
                <div className="space-y-3 text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Zero npm audio dependencies — native Web Audio & Speech API
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Fast token slip printing with QR code and patient queue status
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    1-click CSV Export of daily OPD register for clinic logs
                  </div>
                </div>
                <Link
                  to="/reception"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 pt-2"
                >
                  Test Reception Desk in Demo <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-xl flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-xl bg-blue-600 text-white shadow">
                    <Volume2 size={24} />
                  </span>
                  <div>
                    <div className="text-xs text-blue-300 font-bold uppercase">Now Calling</div>
                    <div className="text-xl font-black text-white">Token #104 · Juan Dela Cruz</div>
                    <div className="text-xs text-slate-400">Proceed to Consultation Room 1</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  Billing & BIR Receipts
                </span>
                <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  GCash, Maya & BIR-Ready Official Receipts (₱ PHP)
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Seamlessly collect consultation fees, medicine costs, and lab fees. Issue printed official receipts with 12% Philippine VAT breakdown, TIN numbers, and instant GCash/Maya reference logging.
                </p>
                <div className="space-y-3 text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    GCash, Maya, Over-the-counter Cash, Card & Split Payments
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Auto VAT-exempt calculation for Senior Citizens & PWDs (20% discount)
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Daily collection summaries with 1-click clean financial sheet print
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Payment Breakdown</span>
                  <span className="text-emerald-400 font-bold">PHP ₱ Currency</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>🔵 GCash Payments</span>
                    <span>₱8,450 (65%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full w-[65%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>🟢 Maya / QR Ph</span>
                    <span>₱2,800 (22%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[22%]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                  Pharmacy & Stock
                </span>
                <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  Stop Medicine Expirations & Stockouts
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Real-time inventory deduction whenever a doctor prescribes or dispenses. Never get surprised by expired batches or missing critical antibiotics.
                </p>
                <div className="space-y-3 text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Automated 30/60/90-day expiry date alerts
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Supplier management & 1-click Purchase Order generation
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Stock audit trail with batch numbers and lot tracking
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 space-y-3 text-xs">
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex justify-between items-center">
                  <div>
                    <strong className="text-emerald-300 block">Biogesic Paracetamol 500mg</strong>
                    <span className="text-slate-400 text-[11px]">Batch #B2026-9 · Exp: Nov 2027</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">180 in stock</span>
                </div>
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl flex justify-between items-center">
                  <div>
                    <strong className="text-rose-300 block">Amoxil Amoxicillin 500mg</strong>
                    <span className="text-slate-400 text-[11px]">Batch #AMX-04 · Low Stock (12 left)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">Reorder Alert</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SaaS Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Transparent SaaS Pricing (₱ PHP)
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Choose the Perfect Plan for Your Clinic
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            All plans come with a <strong>14-day free trial</strong>. No setup fees. Upgrade or cancel anytime.
          </p>

          {/* Monthly vs Annual Toggle */}
          <div className="pt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SAAS_PLANS.map((plan) => {
            const price =
              billingCycle === "monthly"
                ? plan.monthlyPricePhp
                : Math.round(plan.yearlyPricePhp / 12);

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 border transition-all flex flex-col justify-between ${
                  plan.popular
                    ? "bg-gradient-to-b from-blue-950/60 to-slate-900/90 border-blue-500/60 shadow-2xl shadow-blue-500/20 ring-1 ring-blue-500/40"
                    : "bg-slate-900/60 border-white/10 hover:border-white/20 shadow-xl"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow">
                    Most Popular
                  </span>
                )}

                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-black text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                      {plan.tagline}
                    </p>
                  </div>

                  <div className="border-y border-white/10 py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white font-mono">
                        ₱{price.toLocaleString("en-PH")}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ month</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div className="text-[11px] text-emerald-400 font-bold mt-1">
                        Billed annually (₱{plan.yearlyPricePhp.toLocaleString("en-PH")}/year)
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Included in this tier:
                    </div>
                    {plan.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-300 font-medium"
                      >
                        <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    to="/signup"
                    className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                        : "bg-white/10 hover:bg-white/15 text-white"
                    }`}
                  >
                    Start 14-Day Free Trial <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Can my clinic staff use multiple computers at the same time?",
              a: "Yes! MediStock is 100% cloud-based and supports real-time multi-terminal sync. Your receptionist can issue tokens on one computer while 3 different doctors consult patients on their own screens simultaneously.",
            },
            {
              q: "Do I need to buy special hardware for the voice token caller?",
              a: "No! MediStock uses your browser's built-in Web Audio & Speech synthesis. Simply plug any standard desktop speaker or Bluetooth soundbar into the reception or doctor's computer.",
            },
            {
              q: "Can we collect payments via GCash and Maya?",
              a: "Yes! You can accept GCash, Maya QR, cash, or credit cards, record reference numbers, and generate itemized BIR-compliant receipts.",
            },
            {
              q: "Is our patient data safe and compliant with Philippine laws?",
              a: "Absolutely. MediStock adheres to the Philippine Data Privacy Act of 2012 (RA 10173). All clinic databases are encrypted at rest and strictly isolated per tenant.",
            },
            {
              q: "What happens after the 14-day free trial?",
              a: "You can choose any plan (Starter, Pro, or Enterprise) to continue seamlessly. We never lock your data, and you can export your full patient records and medicines to CSV anytime.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-2"
            >
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                {item.q}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-10 sm:p-16 text-white text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Transform Your Clinic?
          </h2>
          <p className="max-w-xl mx-auto text-blue-100 text-sm sm:text-base">
            Start your 14-day free trial today. Join hundreds of doctors modernizing their daily OPD workflow.
          </p>
          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm hover:bg-blue-50 transition-all shadow-xl hover:scale-105"
            >
              Start Free 14-Day Trial (No Card Needed) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SaaS Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white font-bold">
              <Activity size={16} />
            </span>
            <span className="font-extrabold text-white text-sm">MediStock SaaS</span>
            <span>· Cloud Clinic Operations Suite</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white transition-colors">
              Clinic Login
            </Link>
            <Link to="/signup" className="hover:text-white transition-colors">
              Register Clinic
            </Link>
            <Link to="/superadmin/login" className="hover:text-white transition-colors text-slate-500">
              Platform Admin
            </Link>
          </div>

          <div>
            © 2026 MediStock Philippines Cloud Tech Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
