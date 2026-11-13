"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-context";
import { ArrowRight, Lock, ShieldCheck, UserCheck } from "lucide-react";

export function SuperAdminLoginPage() {
  const { signInDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signInDemo("SUPERADMIN", { email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fbfbfb]">
      <div className="max-w-md w-full space-y-4">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="w-9 h-9 rounded-md bg-zinc-900 text-white flex items-center justify-center mx-auto mb-2 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-zinc-100" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950">
            Platform Command Center
          </h1>
          <p className="text-xs text-zinc-500">
            Super Administrator Authentication & Tenant Oversight.
          </p>
        </div>

        {/* Panel */}
        <div className="panel p-6 shadow-xs bg-white space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Admin Work Email
              </label>
              <input
                type="email"
                required
                placeholder="superadmin@medistock.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
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

            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2">
              Sign In to Command Center <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick 1-Click Login Card */}
          <div className="pt-4 border-t border-zinc-100 space-y-2">
            <div className="p-3 rounded border border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-zinc-900 block">
                  👑 Platform Super Admin
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  superadmin@medistock.ph
                </span>
              </div>
              <button
                type="button"
                onClick={() => signInDemo("SUPERADMIN")}
                className="btn-primary text-xs py-1.5 px-3"
              >
                1-Click Login
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
              <span>Password: <strong className="font-mono text-zinc-700">Password123</strong></span>
              <Link href="/login" className="text-blue-600 hover:underline">
                ← Clinic Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
