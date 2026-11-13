"use client";

import { useEffect, useState } from "react";
import { Lock, KeyRound, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { MedicalVaultSketch } from "@/components/ui/medical-illustrations";

export function DoctorLock({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem("doctor_desk_unlocked");
    if (isUnlocked === "true") {
      setUnlocked(true);
    }
  }, []);

  const handleUnlock = (e?: React.FormEvent, customPin?: string) => {
    if (e) e.preventDefault();
    const testPin = customPin || pin;
    if (testPin === "1234") {
      sessionStorage.setItem("doctor_desk_unlocked", "true");
      setUnlocked(true);
      toast.success("Doctor's Desk unlocked. Welcome Dr. Rizal!");
    } else {
      setError(true);
      setPin("");
      toast.error("Incorrect PIN. Demo PIN is 1234");
    }
  };

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4">
      <div className="panel max-w-md w-full p-6 sm:p-8 text-center bg-white border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] rounded-2xl">
        {/* Medical Security Vault Handcrafted Sketch */}
        <div className="flex justify-center mb-1">
          <MedicalVaultSketch className="w-36 h-36" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Clinical Privacy Gatekeeper
        </div>

        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Attending Physician Desk
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-5 max-w-xs mx-auto">
          Confidential medical records, patient diagnoses, and electronic prescription pad.
        </p>

        <form onSubmit={(e) => handleUnlock(e)} className="space-y-4">
          {/* PIN Digits Display */}
          <div className="flex justify-center gap-2.5">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-11 h-13 rounded-xl border flex items-center justify-center text-xl font-bold transition-all ${
                  error
                    ? "border-rose-300 bg-rose-50 text-rose-700 animate-shake"
                    : index < pin.length
                    ? "border-teal-600 bg-teal-50/50 text-teal-900 shadow-2xs"
                    : "border-slate-200 bg-slate-50/50 text-slate-300"
                }`}
              >
                {index < pin.length ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => {
                  setError(false);
                  if (pin.length < 4) {
                    const next = pin + digit;
                    setPin(next);
                    if (next.length === 4) {
                      setTimeout(() => handleUnlock(undefined, next), 50);
                    }
                  }
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-teal-50/50 hover:border-teal-300 text-slate-800 font-semibold text-sm transition-all cursor-pointer shadow-2xs"
              >
                {digit}
              </button>
            ))}
            <div className="col-start-2">
              <button
                type="button"
                onClick={() => {
                  setError(false);
                  if (pin.length < 4) {
                    const next = pin + "0";
                    setPin(next);
                    if (next.length === 4) {
                      setTimeout(() => handleUnlock(undefined, next), 50);
                    }
                  }
                }}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-teal-50/50 hover:border-teal-300 text-slate-800 font-semibold text-sm transition-all cursor-pointer shadow-2xs"
              >
                0
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setError(false);
                  setPin((p) => p.slice(0, -1));
                }}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-xs transition-colors cursor-pointer"
              >
                ⌫
              </button>
            </div>
          </div>

          {/* 1-Click Instant Unlock for frictionless access */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleUnlock(undefined, "1234")}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200/80 text-teal-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span>1-Click Unlock with Demo PIN (<strong>1234</strong>)</span>
              <ArrowRight className="w-3 h-3 text-teal-600" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
