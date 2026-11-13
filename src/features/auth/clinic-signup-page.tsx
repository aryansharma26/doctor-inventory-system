"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import {
  type ClinicSubscription,
  SAAS_PLANS,
  saveClinicSubscription,
} from "@/features/subscription/saas-subscription-store";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

export function ClinicSignupPage() {
  const router = useRouter();
  const { signInDemo } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [clinicName, setClinicName] = useState("");
  const [specialty, setSpecialty] = useState("General Medicine & OPD");
  const [locationCity, setLocationCity] = useState("Metro Manila");
  const [phone, setPhone] = useState("+63 9");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim() || !fullName.trim() || !email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const periodEndDate = new Date();
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);

      const clinicId = `clinic-${Date.now()}`;
      const newSub: ClinicSubscription = {
        clinicId,
        clinicName: clinicName.trim(),
        planId: "growth",
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
            planName: "Pro Plan (14-Day Free Trial)",
            amountPhp: 0,
            date: new Date().toISOString().split("T")[0],
            status: "PAID",
            paymentMethod: "GCASH",
          },
        ],
      };

      saveClinicSubscription(newSub);

      // Authenticate session immediately
      signInDemo("DOCTOR", {
        email: email.trim(),
        fullName: fullName.trim(),
        clinicName: clinicName.trim(),
        clinicId,
      });

      setIsSubmitting(false);
      toast.success(`🎉 Welcome! ${clinicName} is provisioned with a 14-Day Free Pro Trial.`);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfb] flex flex-col justify-between p-6">
      <div className="max-w-xl mx-auto w-full space-y-6 pt-6">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
              <Activity className="w-4 h-4" />
            </span>
            <span className="font-semibold text-sm tracking-tight text-zinc-950">
              MediStock SaaS
            </span>
          </Link>

          <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-900 font-medium">
            Already registered? Sign In →
          </Link>
        </div>

        {/* Card */}
        <div className="panel p-6 sm:p-8 bg-white shadow-xs space-y-5">
          <div>
            <div className="badge badge-amber text-xs font-semibold mb-2">
              14-Day Free Pro Trial · Instant Activation
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              Register Your Clinic
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Complete healthcare management, smart OPD queues, and BIR billing in 60 seconds.
            </p>
          </div>

          {/* Step tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 text-xs font-semibold">
            <button
              onClick={() => setStep(1)}
              className={`pb-1 border-b-2 cursor-pointer transition-colors ${
                step === 1 ? "border-zinc-900 text-zinc-950" : "border-transparent text-zinc-400"
              }`}
            >
              1. Clinic Details
            </button>
            <span className="text-zinc-300">/</span>
            <button
              onClick={() => {
                if (clinicName.trim()) setStep(2);
              }}
              className={`pb-1 border-b-2 cursor-pointer transition-colors ${
                step === 2 ? "border-zinc-900 text-zinc-950" : "border-transparent text-zinc-400"
              }`}
            >
              2. Physician Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Clinic Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Jude Family Health Clinic"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Primary Specialty
                    </label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="input-field text-xs cursor-pointer"
                    >
                      <option>General Medicine & OPD</option>
                      <option>Internal Medicine</option>
                      <option>Pediatrics</option>
                      <option>OB-GYN</option>
                      <option>Family Medicine</option>
                      <option>Polyclinic / Diagnostics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      City / Province (PH)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Quezon City, Manila"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Clinic Contact Phone (+63)
                  </label>
                  <input
                    type="text"
                    placeholder="+63 917 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!clinicName.trim()) {
                        toast.error("Please enter your clinic name");
                        return;
                      }
                      setStep(2);
                    }}
                    className="btn-primary w-full justify-center py-2.5"
                  >
                    Continue to Doctor Profile <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Lead Doctor / Clinic Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jose Rizal, MD"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. dr.rizal@clinic.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div className="p-3 rounded bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-zinc-900 block">
                      Growth / Pro Tier (14-Day Free Trial)
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      Up to 5 Doctors, Voice Caller & GCash Billing
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-emerald-700">
                    ₱0 Due Today
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary py-2.5 px-4"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 justify-center py-2.5"
                  >
                    {isSubmitting ? "Provisioning Clinic..." : "Complete Setup & Launch Clinic"}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
            <span>Encrypted database · Philippine DPA (RA 10173) compliant</span>
          </div>
        </div>

        <div className="text-center text-[11px] text-zinc-400">
          © 2026 MediStock Health Systems Inc.
        </div>
      </div>
    </div>
  );
}
