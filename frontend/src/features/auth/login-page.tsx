import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Boxes,
  CalendarDays,
  LockKeyhole,
  Pill,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router";
import { z } from "zod";
import { isAuthConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";

const schema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { session } = useAuth();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  if (session) return <Navigate to="/" replace />;
  const submit = async (values: FormValues) => {
    setError("");
    if (!isAuthConfigured) {
      setError(
        "Authentication has not been configured. Add the Supabase environment variables.",
      );
      return;
    }
    const result = await supabase.auth.signInWithPassword(values);
    if (result.error) setError(result.error.message);
  };
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#071b4a] p-14 text-white lg:flex lg:flex-col">
        <div className="absolute -right-44 -top-44 size-[560px] rounded-full border border-white/[.07]" />
        <div className="absolute -right-20 -top-20 size-[310px] rounded-full border border-orange-400/20" />
        <div className="absolute -bottom-72 -left-36 size-[620px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-xl bg-white text-[#071b4a]">
            <Activity size={21} />
            <i className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#071b4a] bg-orange-400" />
          </span>
          <span className="text-xl font-extrabold">MediStock</span>
        </div>
        <div className="relative my-auto max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">
            One clinic. One clear workspace.
          </span>
          <h1 className="mt-6 text-6xl font-extrabold leading-[1.02] tracking-[-.055em]">
            Patients, practice
            <br />
            and inventory.
            <br />
            <span className="text-orange-300">Finally together.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-white/60">
            Manage appointments, patient records, prescriptions, billing,
            medicines and stock from one secure clinic platform.
          </p>
          <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
            {[
              { icon: CalendarDays, text: "Appointments" },
              { icon: Pill, text: "Prescriptions" },
              { icon: Boxes, text: "Inventory" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="rounded-xl border border-white/10 bg-white/[.06] p-3 text-xs font-semibold text-white/80"
              >
                <Icon size={17} className="mb-2 text-orange-300" />
                {text}
              </span>
            ))}
          </div>
        </div>
        <div className="relative text-[10px] text-white/35">
          © 2026 MediStock · Secure multi-tenant clinic operations
        </div>
      </section>
      <section className="flex items-center justify-center bg-[#f8faff] p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-[#071b4a] text-white">
              <Activity size={19} />
            </span>
            <span className="text-xl font-extrabold text-[#071b4a]">
              MediStock
            </span>
          </div>
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              ← Back to SaaS Home & Pricing
            </Link>
          </div>
          <span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
            <LockKeyhole size={20} />
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-[-.04em] text-[#071b4a]">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with your authorised clinic account.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(submit)}>
            <label className="block">
              <span className="mb-2 block text-xs font-bold">Work email</span>
              <input
                {...register("email")}
                autoComplete="email"
                className="field"
                placeholder="you@clinic.com"
              />
              {errors.email && (
                <span className="mt-1.5 block text-xs text-[#a23a32]">
                  {errors.email.message}
                </span>
              )}
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold">Password</span>
              <input
                {...register("password")}
                autoComplete="current-password"
                type="password"
                className="field"
                placeholder="Enter your password"
              />
              {errors.password && (
                <span className="mt-1.5 block text-xs text-[#a23a32]">
                  {errors.password.message}
                </span>
              )}
            </label>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[#f0c8c4] bg-[#fff3f1] px-3.5 py-3 text-xs text-[#8f352e]"
              >
                {error}
              </div>
            )}
            <button disabled={isSubmitting} className="btn-primary h-11 w-full">
              Sign in securely <ArrowRight size={16} />
            </button>
          </form>

          {/* New Clinic SaaS Sign-up Banner */}
          <div className="mt-6 p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-center space-y-1.5">
            <span className="text-xs text-slate-600 font-medium block">
              Want to set up MediStock for your clinic?
            </span>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 hover:text-blue-800 transition-colors"
            >
              Start 14-Day Free Pro Trial <ArrowRight size={13} />
            </Link>
          </div>

          <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
            Protected by multi-tenant authentication and role-based access.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
