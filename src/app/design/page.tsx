import Link from "next/link";
import { ArrowRight, Building2, HeartHandshake, ShieldCheck, Stethoscope } from "lucide-react";

export const metadata = { title: "MediStock · Workspaces" };

const WORKSPACES = [
  {
    href: "/hospital",
    title: "Hospital",
    body: "Reception, consultation queue, appointments, patients, doctors and reports.",
    icon: Building2,
    ready: true,
  },
  {
    href: "/doctor",
    title: "Doctor",
    body: "Your daily schedule, waiting patients and consultation notes.",
    icon: Stethoscope,
    ready: false,
  },
  {
    href: "/care",
    title: "Patients",
    body: "Book an appointment with a doctor and get a token number.",
    icon: HeartHandshake,
    ready: true,
  },
  {
    href: "/admin",
    title: "Platform admin",
    body: "Hospitals, subscriptions, sales pipeline and support.",
    icon: ShieldCheck,
    ready: false,
  },
];

export default function WorkspacesPage() {
  return (
    <div className="ds-root min-h-screen bg-canvas px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="text-sm font-semibold">MediStock</span>
        </div>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Select a workspace</h1>
        <p className="mt-2 text-ink-muted">Aarogya Multispeciality Hospital, Kothrud</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {WORKSPACES.map(({ href, title, body, icon: Icon, ready }) =>
            ready ? (
              <Link
                key={href}
                href={href}
                className="group rounded-card border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-pop"
              >
                <Icon className="size-5 text-brand-600" />
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-1 text-[13px] text-ink-muted">{body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand-700">
                  Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ) : (
              <div key={href} className="rounded-card border border-dashed border-line-strong p-5" aria-disabled="true">
                <Icon className="size-5 text-ink-subtle" />
                <p className="mt-4 font-semibold text-ink-muted">{title}</p>
                <p className="mt-1 text-[13px] text-ink-subtle">{body}</p>
                <span className="mt-4 inline-block rounded-full bg-ink/[0.05] px-2 py-0.5 text-xs text-ink-muted">Coming soon</span>
              </div>
            ),
          )}
        </div>
        <p className="mt-10 text-[13px] text-ink-subtle">
          Staff sign-in:{" "}
          <Link href="/login" className="text-ink-muted underline underline-offset-2 hover:text-ink">
            /login
          </Link>
        </p>
      </div>
    </div>
  );
}
