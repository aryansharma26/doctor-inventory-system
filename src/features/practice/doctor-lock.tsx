"use client";

import { useEffect, useState } from "react";
import { Lock, KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

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

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      sessionStorage.setItem("doctor_desk_unlocked", "true");
      setUnlocked(true);
      toast.success("Doctor's Desk unlocked");
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
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="panel max-w-sm w-full p-6 text-center shadow-xs">
        <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5" />
        </div>

        <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
          Doctor Desk Access
        </h2>
        <p className="text-xs text-zinc-500 mt-1 mb-5">
          Enter 4-digit PIN to access clinical records & prescriptions.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-10 h-12 rounded border flex items-center justify-center text-lg font-bold transition-colors ${
                  error
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : index < pin.length
                    ? "border-zinc-900 bg-zinc-50 text-zinc-900"
                    : "border-zinc-200 bg-white"
                }`}
              >
                {index < pin.length ? "•" : ""}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => {
                  setError(false);
                  if (pin.length < 4) setPin((p) => p + digit);
                }}
                className="h-10 rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 font-semibold text-sm transition-colors cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <div className="col-start-2">
              <button
                type="button"
                onClick={() => {
                  setError(false);
                  if (pin.length < 4) setPin((p) => p + "0");
                }}
                className="w-full h-10 rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 font-semibold text-sm transition-colors cursor-pointer"
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
                className="w-full h-10 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                DEL
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={pin.length < 4}
            className="btn-primary w-full justify-center mt-3 disabled:opacity-40"
          >
            <KeyRound className="w-3.5 h-3.5" /> Unlock Desk
          </button>

          <p className="text-[11px] font-mono text-zinc-400">
            Demo PIN: <strong className="text-zinc-600">1234</strong>
          </p>
        </form>
      </div>
    </div>
  );
}
