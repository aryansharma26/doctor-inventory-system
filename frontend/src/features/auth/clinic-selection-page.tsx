import { Activity, ArrowRight, Building2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export function ClinicSelectionPage() {
  const { identity, selectClinic, signOut } = useAuth();
  return (
    <div className="grid min-h-screen place-items-center bg-paper p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#071b4a] text-white">
            <Activity size={20} />
          </span>
          <span className="text-xl font-extrabold text-[#071b4a]">
            MediStock
          </span>
        </div>
        <section className="card p-6 sm:p-8">
          <div className="label">Workspace access</div>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-[-.035em]">
            Choose a clinic
          </h1>
          <p className="mt-2 text-sm text-[#71807c]">
            Your permissions and data scope will follow the selected clinic.
          </p>
          <div className="mt-6 space-y-2">
            {identity?.clinics.map((clinic) => (
              <button
                key={clinic.id}
                onClick={() => void selectClinic(clinic.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-4 text-left transition hover:border-pine hover:bg-paper"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[#e8f2ed] text-pine">
                  <Building2 size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {clinic.name}
                  </span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[.1em] text-[#71807c]">
                    {clinic.code} · {clinic.role.replaceAll("_", " ")}
                  </span>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          <button
            onClick={() => void signOut()}
            className="mt-6 w-full text-center text-xs font-bold text-[#71807c]"
          >
            Sign in with another account
          </button>
        </section>
      </div>
    </div>
  );
}
