import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DoctorLockProps {
  children: React.ReactNode;
}

export function DoctorLock({ children }: DoctorLockProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const unlocked = sessionStorage.getItem("doctor_unlocked");
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN is 1234 for demo purposes
    if (pin === "1234") {
      sessionStorage.setItem("doctor_unlocked", "true");
      setIsUnlocked(true);
      toast.success("Doctor's Desk unlocked!");
    } else {
      setError(true);
      setPin("");
      toast.error("Incorrect PIN");
    }
  };

  const handleKeyPress = (digit: string) => {
    setError(false);
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-indigo-600 to-indigo-800"></div>

        <div className="relative pt-12 px-8 pb-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-indigo-600 mb-6">
            {pin.length === 4 && error ? (
              <ShieldCheck className="w-10 h-10 text-rose-500" />
            ) : (
              <Lock className="w-10 h-10" />
            )}
          </div>

          <h2 className="text-2xl font-black text-slate-900 text-center">
            Restricted Access
          </h2>
          <p className="text-slate-500 text-sm text-center mt-1 font-medium mb-6">
            Enter PIN to unlock Doctor's Desk
          </p>

          <form onSubmit={handleUnlock} className="w-full space-y-6">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                    error
                      ? "border-rose-300 bg-rose-50 text-rose-600"
                      : index < pin.length
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  {index < pin.length ? "•" : ""}
                </div>
              ))}
            </div>
            {error && (
              <p className="text-rose-500 text-xs font-bold text-center">
                Incorrect PIN. Try again.
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 mt-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit.toString())}
                  className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xl transition-colors border border-slate-200"
                >
                  {digit}
                </button>
              ))}
              <div className="col-start-2">
                <button
                  type="button"
                  onClick={() => handleKeyPress("0")}
                  className="w-full h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xl transition-colors border border-slate-200"
                >
                  0
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full h-14 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm transition-colors border border-rose-200 flex items-center justify-center"
                >
                  DEL
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <KeyRound className="w-5 h-5" />
              Unlock Desk
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              Demo PIN: 1234
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
