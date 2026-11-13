import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, Crown, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page";
import { api } from "@/lib/api";
import {
  getClinicSubscription,
  getDaysLeftInTrial,
} from "@/features/subscription/saas-subscription-store";

type Settings = {
  code: string;
  name: string;
  email: string;
  phone?: string;
  timezone: string;
  currency: string;
  settings: {
    lowStockAlerts?: boolean;
    expiryAlertDays?: number;
    invoicePrefix?: string;
    purchasePrefix?: string;
  };
  locations: Array<{ id: string; name: string; code: string; type: string }>;
};
export function SettingsPage() {
  const sub = getClinicSubscription();
  const daysLeft = getDaysLeftInTrial(sub.trialEndsAt);
  const query = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: () => api<Settings>("/settings"),
  });
  const client = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "Asia/Manila",
    currency: "PHP",
    lowStockAlerts: true,
    expiryAlertDays: 30,
    invoicePrefix: "INV",
    purchasePrefix: "PO",
  });
  useEffect(() => {
    if (query.data)
      setForm({
        name: query.data.name,
        email: query.data.email,
        phone: query.data.phone ?? "",
        timezone: query.data.timezone,
        currency: query.data.currency,
        lowStockAlerts: query.data.settings.lowStockAlerts ?? true,
        expiryAlertDays: query.data.settings.expiryAlertDays ?? 30,
        invoicePrefix: query.data.settings.invoicePrefix ?? "INV",
        purchasePrefix: query.data.settings.purchasePrefix ?? "PO",
      });
  }, [query.data]);
  const save = useMutation({
    mutationFn: () =>
      api("/settings", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          timezone: form.timezone,
          currency: form.currency,
          settings: {
            lowStockAlerts: form.lowStockAlerts,
            expiryAlertDays: form.expiryAlertDays,
            invoicePrefix: form.invoicePrefix,
            purchasePrefix: form.purchasePrefix,
          },
        }),
      }),
    onSuccess: () => {
      toast.success("Clinic settings saved");
      void client.invalidateQueries({ queryKey: ["clinic-settings"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <>
      <PageHeader
        title="Settings"
        description="Clinic profile, alerts and document numbering."
        action={
          <button
            className="btn-primary"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            <Save size={16} />
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        }
      />
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <section className="card p-6">
          <div className="flex items-center gap-3 border-b border-line pb-5">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 size={19} />
            </span>
            <div>
              <h3 className="font-semibold">Clinic profile</h3>
              <p className="text-xs text-slate-500">
                Code: {query.data?.code ?? "—"}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Clinic name">
              <input
                className="field"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                className="field"
                value={form.email}
                onChange={(event) => set("email", event.target.value)}
              />
            </Field>
            <Field label="Phone">
              <input
                className="field"
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
              />
            </Field>
            <Field label="Timezone">
              <input
                className="field"
                value={form.timezone}
                onChange={(event) => set("timezone", event.target.value)}
              />
            </Field>
            <Field label="Currency">
              <input
                maxLength={3}
                className="field"
                value={form.currency}
                onChange={(event) =>
                  set("currency", event.target.value.toUpperCase())
                }
              />
            </Field>
            <Field label="Expiry alert (days)">
              <input
                type="number"
                className="field"
                value={form.expiryAlertDays}
                onChange={(event) =>
                  set("expiryAlertDays", Number(event.target.value))
                }
              />
            </Field>
            <Field label="Invoice prefix">
              <input
                className="field"
                value={form.invoicePrefix}
                onChange={(event) => set("invoicePrefix", event.target.value)}
              />
            </Field>
            <Field label="Purchase prefix">
              <input
                className="field"
                value={form.purchasePrefix}
                onChange={(event) => set("purchasePrefix", event.target.value)}
              />
            </Field>
            <label className="col-span-full flex items-center gap-3 rounded-lg border border-line p-4">
              <input
                type="checkbox"
                checked={form.lowStockAlerts}
                onChange={(event) =>
                  set("lowStockAlerts", event.target.checked)
                }
                className="size-4 accent-blue-600"
              />
              <span>
                <span className="block text-sm font-medium">
                  Low stock alerts
                </span>
                <span className="text-xs text-slate-500">
                  Notify inventory staff when stock crosses its reorder level.
                </span>
              </span>
            </label>
          </div>
        </section>
        <aside className="space-y-5">
          <section className="card p-5 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white border-0 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                SaaS Subscription
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono text-[10px] font-bold">
                {sub.status}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="font-black text-base text-white">
                {sub.planId === "growth"
                  ? "Clinic Growth / Pro"
                  : sub.planId === "starter"
                    ? "Solo Doctor Starter"
                    : "Polyclinic Enterprise"}
              </h3>
            </div>
            <p className="mt-2 text-xs text-blue-200/80 leading-relaxed">
              {sub.status === "TRIAL"
                ? `${daysLeft} days remaining in your free trial.`
                : `Active subscription renewing ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-PH")}.`}
            </p>
            <div className="mt-4 pt-3 border-t border-white/10">
              <Link
                to="/subscription"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                Manage Subscription & Billing <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h3 className="font-semibold">Security</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Access is protected by Supabase authentication and role-based
              permissions. Every settings update is written to the audit trail.
            </p>
          </section>
          <section className="card p-5">
            <h3 className="font-semibold">Locations</h3>
            <div className="mt-3 divide-y divide-line">
              {query.data?.locations.map((location) => (
                <div key={location.id} className="py-3">
                  <div className="text-sm font-medium">{location.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {location.code} · {location.type}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}
