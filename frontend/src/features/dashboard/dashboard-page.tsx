import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CircleAlert,
  Clock3,
  Coins,
  PackageCheck,
  Pill,
  ReceiptText,
  ShoppingCart,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

type Dashboard = {
  kpis: {
    medicineCount: number;
    lowStock: number;
    expiring: number;
    openOrders: number;
    monthlyRevenue: number;
    todayAppointments: number;
    waitingPatients: number;
    todayRevenue: number;
    todayCollected: number;
    checkIns: number;
    pendingFollowUps: number;
    prescriptionsToday: number;
    outstandingInvoices: number;
    outstandingAmount: number;
    billingPending: number;
  };
  movements: Array<{ type: string; _sum: { quantity: number | null } }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    supplier: { name: string };
  }>;
  recentAppointments: Array<{
    id: string;
    type: string;
    status: string;
    startsAt: string;
    patient: { id: string; patientCode: string; name: string; phone?: string };
    doctor: { user: { id: string; fullName: string } };
  }>;
};

const emptyKpis: Dashboard["kpis"] = {
  medicineCount: 0,
  lowStock: 0,
  expiring: 0,
  openOrders: 0,
  monthlyRevenue: 0,
  todayAppointments: 0,
  waitingPatients: 0,
  todayRevenue: 0,
  todayCollected: 0,
  checkIns: 0,
  pendingFollowUps: 0,
  prescriptionsToday: 0,
  outstandingInvoices: 0,
  outstandingAmount: 0,
  billingPending: 0,
};

export function DashboardPage() {
  const { identity } = useAuth();
  const firstName = identity?.user.fullName.split(/\s+/)[0] ?? "there";
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Dashboard>("/dashboard/clinic"),
    retry: 1,
  });
  const kpis = data?.kpis ?? emptyKpis;
  const role = identity?.selectedRole;
  const cards =
    role === "RECEPTIONIST"
      ? [
          {
            label: "Today's appointments",
            value: kpis.todayAppointments.toLocaleString(),
            detail: "scheduled visits",
            icon: CalendarDays,
            tone: "bg-blue-50 text-blue-700",
          },
          {
            label: "Waiting patients",
            value: kpis.waitingPatients.toLocaleString(),
            detail: `${kpis.checkIns} total check-ins`,
            icon: UsersRound,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Billing pending",
            value: kpis.billingPending.toLocaleString(),
            detail: "completed visits without invoice",
            icon: ReceiptText,
            tone: "bg-rose-50 text-rose-700",
          },
          {
            label: "Outstanding invoices",
            value: kpis.outstandingInvoices.toLocaleString(),
            detail: `₱${kpis.outstandingAmount.toLocaleString("en-PH")} due`,
            icon: Coins,
            tone: "bg-violet-50 text-violet-700",
          },
        ]
      : role === "DOCTOR"
        ? [
            {
              label: "Today's patients",
              value: kpis.todayAppointments.toLocaleString(),
              detail: "assigned appointments",
              icon: UsersRound,
              tone: "bg-blue-50 text-blue-700",
            },
            {
              label: "Waiting patients",
              value: kpis.waitingPatients.toLocaleString(),
              detail: "ready for consultation",
              icon: Clock3,
              tone: "bg-amber-50 text-amber-700",
            },
            {
              label: "Pending follow-ups",
              value: kpis.pendingFollowUps.toLocaleString(),
              detail: "due or overdue",
              icon: CalendarDays,
              tone: "bg-rose-50 text-rose-700",
            },
            {
              label: "Prescriptions today",
              value: kpis.prescriptionsToday.toLocaleString(),
              detail: "issued today",
              icon: Pill,
              tone: "bg-violet-50 text-violet-700",
            },
          ]
        : role === "ACCOUNTANT"
          ? [
              {
                label: "Today's revenue",
                value: `₱${kpis.todayRevenue.toLocaleString("en-PH")}`,
                detail: "invoiced today",
                icon: Coins,
                tone: "bg-emerald-50 text-emerald-700",
              },
              {
                label: "Collected today",
                value: `₱${kpis.todayCollected.toLocaleString("en-PH")}`,
                detail: "payments received",
                icon: ReceiptText,
                tone: "bg-blue-50 text-blue-700",
              },
              {
                label: "Outstanding",
                value: `₱${kpis.outstandingAmount.toLocaleString("en-PH")}`,
                detail: `${kpis.outstandingInvoices} invoices`,
                icon: CircleAlert,
                tone: "bg-rose-50 text-rose-700",
              },
              {
                label: "Monthly revenue",
                value: `₱${kpis.monthlyRevenue.toLocaleString("en-PH")}`,
                detail: "current month",
                icon: BarChart3,
                tone: "bg-violet-50 text-violet-700",
              },
            ]
          : [
              {
                label: "Today's revenue",
                value: `₱${kpis.todayRevenue.toLocaleString("en-PH")}`,
                detail: `₱${kpis.todayCollected.toLocaleString("en-PH")} collected`,
                icon: Coins,
                tone: "bg-emerald-50 text-emerald-700",
              },
              {
                label: "Appointments",
                value: kpis.todayAppointments.toLocaleString(),
                detail: "scheduled today",
                icon: CalendarDays,
                tone: "bg-blue-50 text-blue-700",
              },
              {
                label: "Waiting patients",
                value: kpis.waitingPatients.toLocaleString(),
                detail: "in the live queue",
                icon: UsersRound,
                tone: "bg-amber-50 text-amber-700",
              },
              {
                label: "Low stock",
                value: kpis.lowStock.toLocaleString(),
                detail: "products need attention",
                icon: CircleAlert,
                tone: "bg-rose-50 text-rose-700",
              },
            ];
  const movementData = (data?.movements ?? []).map((row) => ({
    name: row.type.replaceAll("_", " "),
    quantity: Number(row._sum.quantity ?? 0),
  }));

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-7 text-white shadow-xl border border-white/10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-blue-200 border border-white/10">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            {format(new Date(), "EEEE, d MMMM yyyy")} · Live Clinic Operations
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Welcome back, {firstName}.
          </h2>
          <p className="text-sm text-blue-200/80 max-w-xl">
            Real-time patient flow, OPD appointments, queue status, and pharmaceutical stock control.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/reception"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            🛎️ Reception Queue
          </Link>
          <Link
            to="/consultation"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            🩺 Doctor Room
          </Link>
          <Link
            to="/appointments"
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-1.5"
          >
            <CalendarDays size={15} />
            Schedule
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className="card card-hover p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {label}
                </div>
                <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                  {value}
                </div>
              </div>
              <span
                className={`grid size-12 place-items-center rounded-2xl shadow-xs ${tone}`}
              >
                <Icon size={22} />
              </span>
            </div>
            <div className="mt-4 text-xs font-medium text-slate-400">
              {detail}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-900">Today's schedule</h3>
              <p className="mt-1 text-xs text-slate-500">
                The next visits across all doctors
              </p>
            </div>
            <Link
              to="/queue"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700"
            >
              Open queue <ArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-line">
            {(data?.recentAppointments ?? []).map((appointment) => (
              <article
                key={appointment.id}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="w-16 text-center">
                  <div className="text-sm font-bold text-[#071b4a]">
                    {format(new Date(appointment.startsAt), "h:mm")}
                  </div>
                  <div className="text-[10px] uppercase text-slate-400">
                    {format(new Date(appointment.startsAt), "a")}
                  </div>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Stethoscope size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/patients/${appointment.patient.id}`}
                    className="truncate text-sm font-semibold text-slate-900 hover:text-blue-700"
                  >
                    {appointment.patient.name}
                  </Link>
                  <div className="mt-1 text-xs text-slate-400">
                    Dr. {appointment.doctor.user.fullName} ·{" "}
                    {appointment.type.replaceAll("_", " ")}
                  </div>
                </div>
                <StatusBadge>
                  {appointment.status.replaceAll("_", " ")}
                </StatusBadge>
              </article>
            ))}
            {!data?.recentAppointments?.length && (
              <div className="grid min-h-56 place-items-center p-8 text-center">
                <div>
                  <CalendarDays size={28} className="mx-auto text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    No appointments scheduled today
                  </p>
                  <Link
                    to="/appointments"
                    className="mt-2 inline-flex text-xs font-semibold text-blue-700"
                  >
                    Book the first appointment
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="card p-5">
          <div>
            <h3 className="font-semibold text-slate-900">Quick actions</h3>
            <p className="mt-1 text-xs text-slate-500">
              Common front-desk and pharmacy workflows
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <QuickAction
              to="/pos"
              icon={ReceiptText}
              label="New sale"
              color="bg-blue-50 text-blue-700"
            />
            <QuickAction
              to="/patients"
              icon={UsersRound}
              label="Add patient"
              color="bg-violet-50 text-violet-700"
            />
            <QuickAction
              to="/prescriptions"
              icon={Pill}
              label="Prescription"
              color="bg-orange-50 text-orange-600"
            />
            <QuickAction
              to="/purchases"
              icon={ShoppingCart}
              label="Purchase"
              color="bg-emerald-50 text-emerald-700"
            />
          </div>
          <div className="mt-5 space-y-2 border-t border-line pt-5">
            <Alert
              to="/inventory"
              icon={CircleAlert}
              label={`${kpis.lowStock} items below reorder level`}
              tone="bg-amber-50 text-amber-800"
            />
            <Alert
              to="/inventory"
              icon={Clock3}
              label={`${kpis.expiring} batches expiring in 30 days`}
              tone="bg-rose-50 text-rose-800"
            />
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Stock activity</h3>
              <p className="mt-1 text-xs text-slate-500">
                Quantity moved during the last seven days
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {kpis.medicineCount} medicines
            </span>
          </div>
          <div className="mt-5 h-64">
            {movementData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementData}>
                  <CartesianGrid vertical={false} stroke="#e9eef5" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="#2563eb"
                    radius={[7, 7, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                Stock movements will appear here.
              </div>
            )}
          </div>
        </section>
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-900">Recent purchases</h3>
              <p className="mt-1 text-xs text-slate-500">
                {kpis.openOrders} open orders
              </p>
            </div>
            <Link
              to="/purchases"
              className="text-xs font-semibold text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-line">
            {(data?.recentOrders ?? []).map((order) => (
              <div key={order.id} className="flex items-center gap-3 px-5 py-4">
                <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <PackageCheck size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-slate-900">
                    {order.supplier.name}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {order.orderNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold">
                    ₱{Number(order.total).toLocaleString("en-PH")}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {order.status.replaceAll("_", " ")}
                  </div>
                </div>
              </div>
            ))}
            {!data?.recentOrders?.length && (
              <div className="p-10 text-center text-xs text-slate-400">
                No purchase orders yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  color,
}: {
  to: string;
  icon: typeof Pill;
  label: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-line p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
    >
      <span className={`grid size-9 place-items-center rounded-lg ${color}`}>
        <Icon size={17} />
      </span>
      <div className="mt-3 text-xs font-semibold text-slate-800">{label}</div>
    </Link>
  );
}

function Alert({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: string;
  icon: typeof Pill;
  label: string;
  tone: string;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold ${tone}`}
    >
      <Icon size={15} />
      {label}
      <ArrowRight size={13} className="ml-auto" />
    </Link>
  );
}
