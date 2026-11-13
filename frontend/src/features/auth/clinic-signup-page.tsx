import {
  Activity,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  type ClinicSubscription,
  SAAS_PLANS,
  saveClinicSubscription,
  type SubscriptionPlanId,
} from "../subscription/saas-subscription-store";

export function ClinicSignupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [clinicName, setClinicName] = useState("");
  const [clinicCode, setClinicCode] = useState("");
  const [specialty, setSpecialty] = useState("General Medicine & OPD");
  const [locationCity, setLocationCity] = useState("Metro Manila");
  const [phone, setPhone] = useState("+63 9");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPlan] = useState<SubscriptionPlanId>("growth");

  const handleClinicNameChange = (val: string) => {
    setClinicName(val);
    if (!clinicCode) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 20);
      setClinicCode(slug);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // 1. Provision new clinic in SaaS store
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const periodEndDate = new Date();
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);

      const newSub: ClinicSubscription = {
        clinicId: `clinic-${Date.now()}`,
        clinicName: clinicName.trim(),
        planId: selectedPlan,
        status: "TRIAL",
        billingCycle: "monthly",
        trialEndsAt: trialEndDate.toISOString(),
        currentPeriodEnd: periodEndDate.toISOString(),
        doctorSeatsUsed: 1,
        staffSeatsUsed: 1,
        patientsCountThisMonth: 0,
        invoices: [
          {
            id: `inv-${Date.now()}`,
            invoiceNo: `INV-SAAS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            planName: `${SAAS_PLANS.find((p) => p.id === selectedPlan)?.name} (14-Day Free Trial)`,
            amountPhp: 0,
            date: new Date().toISOString().split("T")[0],
            status: "PAID",
            paymentMethod: "GCASH",
          },
        ],
      };

      saveClinicSubscription(newSub);
      localStorage.setItem("clinora.clinicId", newSub.clinicId);

      setIsSubmitting(false);
      toast.success(
        `🎉 Welcome aboard! Your clinic "${clinicName}" has been provisioned with a 14-Day Pro Free Trial.`,
      );
      navigate("/reception");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-6">
      {/* Top Header Logo */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <Activity size={22} />
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

        <div className="text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="max-w-xl mx-auto w-full bg-slate-900 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-xs font-bold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            14-Day Free Trial · Instant Activation
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Register Your Clinic on Cloud
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Set up your modern OPD queue, doctor consultation desk, and pharmacy in under 60 seconds.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className={`flex-1 h-2 rounded-full transition-all ${
              step >= 1 ? "bg-blue-600" : "bg-white/10"
            }`}
          />
          <div
            className={`flex-1 h-2 rounded-full transition-all ${
              step >= 2 ? "bg-blue-600" : "bg-white/10"
            }`}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> Step 1: Clinic Information
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Clinic Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Jude Family Health Clinic"
                    value={clinicName}
                    onChange={(e) => handleClinicNameChange(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Clinic URL / Slug
                  </label>
                  <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-xs text-slate-400">
                    <input
                      type="text"
                      placeholder="clinic-code"
                      value={clinicCode}
                      onChange={(e) => setClinicCode(e.target.value.toLowerCase())}
                      className="bg-transparent text-white font-mono text-xs outline-none w-full"
                    />
                    <span className="text-slate-500 shrink-0">.medistock.ph</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Primary Specialty
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option>General Medicine & OPD</option>
                    <option>Pediatrics</option>
                    <option>OB-GYN & Maternal Care</option>
                    <option>Internal Medicine</option>
                    <option>Dental Clinic</option>
                    <option>ENT & Ophthalmology</option>
                    <option>Polyclinic / Diagnostic Center</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    City / Province (Philippines)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Quezon City, Manila"
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Clinic Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+63 917 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!clinicName.trim()) {
                      toast.error("Please enter your Clinic Name");
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Continue to Doctor Profile <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4" /> Step 2: Doctor / Admin Credentials
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Lead Doctor / Clinic Manager Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ricardo Ramos, MD"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Work Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dr.ramos@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Create Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Selected Plan Callout */}
              <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <div className="text-white font-black">
                    Clinic Growth / Pro Plan (14-Day Free Trial)
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Includes up to 5 Doctors, Voice Announcer & GCash Billing (₱0 Today)
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  ₱0 Due Now
                </span>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>Creating Your Clinic SaaS...</>
                  ) : (
                    <>
                      Complete Setup & Launch Clinic <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted cloud database · Philippine DPA (RA 10173) compliant</span>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div className="text-center text-xs text-slate-500 pt-8">
        © 2026 MediStock Philippines Cloud Technologies Inc.
      </div>
    </div>
  );
}
