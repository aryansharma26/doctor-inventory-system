"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-context";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DoctorDeskSketch } from "@/components/ui/medical-illustrations";

export function LoginPage() {
  const { signInDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.toLowerCase().trim();
    if (clean.includes("admin") || clean.includes("superadmin")) {
      signInDemo("SUPERADMIN", { email });
    } else if (clean.includes("reception")) {
      signInDemo("RECEPTIONIST", { email });
    } else {
      signInDemo("DOCTOR", { email });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#f8fafc]">
      <div className="max-w-md w-full space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center mx-auto mb-2 font-bold text-sm shadow-2xs">
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Sign in to MediStock
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Clinical practice management, patient queue dispatch & inventory SaaS.
          </p>
        </div>

        {/* Main Sign-In Card */}
        <div className="panel p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] bg-white rounded-2xl border border-slate-200/90 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                placeholder="doctor@medistock.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2 text-xs">
              Sign In Securely <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* 1-Click Instant Demo Login Box */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Instant 1-Click Demo Portals
              </span>
              <span className="badge badge-teal text-[10px]">Direct Role Launch</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Doctor Quick Access */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-teal-200/80 bg-teal-50/50 hover:bg-teal-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      Doctor Consultation Desk
                    </span>
                    <span className="text-[11px] text-teal-800">
                      doctor@medistock.ph · PIN: 1234
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signInDemo("DOCTOR")}
                  className="btn-primary text-[11px] py-1 px-3"
                >
                  Launch Desk
                </button>
              </div>

              {/* Reception Quick Access */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-sky-200/80 bg-sky-50/50 hover:bg-sky-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      Reception & Front Desk
                    </span>
                    <span className="text-[11px] text-sky-800">
                      reception@medistock.ph
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signInDemo("RECEPTIONIST")}
                  className="btn-secondary text-[11px] py-1 px-3 text-sky-900 border-sky-200 hover:bg-sky-100/50"
                >
                  Open Reception
                </button>
              </div>

              {/* Super Admin Quick Access */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      Platform Command Center
                    </span>
                    <span className="text-[11px] text-slate-500">
                      superadmin@medistock.ph
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signInDemo("SUPERADMIN")}
                  className="btn-secondary text-[11px] py-1 px-3 text-slate-900"
                >
                  Admin View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Free Trial Banner */}
        <div className="panel p-3.5 text-center text-xs space-y-1 bg-white rounded-xl border-slate-200/80">
          <span className="text-slate-600 font-medium">
            Setting up a new clinic branch?
          </span>{" "}
          <Link
            href="/signup"
            className="font-bold text-teal-700 hover:underline inline-flex items-center gap-1"
          >
            Start 14-Day Free Pro Trial <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="text-center text-[10px] text-slate-400">
          Philippine DPA (RA 10173) Compliant · BIR Official Receipts Ready
        </div>
      </div>
    </div>
  );
}
