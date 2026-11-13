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
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fbfbfb]">
      <div className="max-w-md w-full space-y-4">
        {/* Logo / Header */}
        <div className="text-center space-y-1">
          <div className="w-9 h-9 rounded-md bg-zinc-900 text-white flex items-center justify-center mx-auto mb-2 font-bold text-sm">
            <Activity className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950">
            Sign in to MediStock
          </h1>
          <p className="text-xs text-zinc-500">
            Secure multi-tenant clinic operations & OPD queue management.
          </p>
        </div>

        {/* Main Sign-In Card */}
        <div className="panel p-6 shadow-xs bg-white space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
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
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2">
              Sign In Securely <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* 1-Click Instant Demo Login Box */}
          <div className="pt-4 border-t border-zinc-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 uppercase tracking-wider text-[11px]">
                Instant 1-Click Demo Access
              </span>
              <span className="badge badge-zinc text-[10px]">Ready to test</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded border border-zinc-200 bg-zinc-50/60">
                <div>
                  <span className="font-semibold text-zinc-900 block text-xs">
                    🩺 Doctor / Clinic Owner
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    doctor@medistock.ph
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signInDemo("DOCTOR")}
                  className="btn-primary text-[11px] py-1 px-2.5"
                >
                  <UserCheck className="w-3 h-3" /> Login
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded border border-zinc-200 bg-zinc-50/60">
                <div>
                  <span className="font-semibold text-zinc-900 block text-xs">
                    👑 Platform Super Admin
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    superadmin@medistock.ph
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signInDemo("SUPERADMIN")}
                  className="btn-secondary text-[11px] py-1 px-2.5 text-zinc-900"
                >
                  <ShieldCheck className="w-3 h-3" /> Login
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded border border-zinc-200 bg-zinc-50/60">
                <div>
                  <span className="font-semibold text-zinc-900 block text-xs">
                    🛎️ Reception Desk
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    reception@medistock.ph
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signInDemo("RECEPTIONIST")}
                  className="btn-secondary text-[11px] py-1 px-2.5 text-zinc-900"
                >
                  <UserCheck className="w-3 h-3" /> Login
                </button>
              </div>
            </div>

            <div className="p-2 rounded bg-zinc-100 text-[11px] text-zinc-600 flex items-center justify-between font-mono">
              <span>Password: <strong className="text-zinc-900">Password123</strong></span>
              <span>Doctor PIN: <strong className="text-zinc-900">1234</strong></span>
            </div>
          </div>
        </div>

        {/* Free Trial Callout */}
        <div className="panel p-3.5 text-center text-xs space-y-1 bg-white">
          <span className="text-zinc-600 font-medium">
            Starting a new clinic?
          </span>{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            Start 14-Day Free Pro Trial <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="text-center text-[11px] text-zinc-400">
          Philippine DPA (RA 10173) Compliant · BIR Tax Ready
        </div>
      </div>
    </div>
  );
}
