import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Download,
  ReceiptText,
  ShoppingBag,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/ui/page";
import { api } from "@/lib/api";

type Report = {
  sales: { _sum: { total?: number; paid?: number }; _count: number };
  purchases: { _sum: { total?: number }; _count: number };
  expenses: { _sum: { amount?: number }; _count: number };
  topMedicines: Array<{
    medicineId: string;
    _sum: { quantity?: number };
    medicine?: { brandName: string };
  }>;
};
export function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: () => api<Report>("/reports/summary"),
  });
  const cards = [
    {
      label: "Monthly sales",
      value: data?.sales._sum.total ?? 0,
      count: data?.sales._count ?? 0,
      icon: Banknote,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Purchases",
      value: data?.purchases._sum.total ?? 0,
      count: data?.purchases._count ?? 0,
      icon: ShoppingBag,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Expenses",
      value: data?.expenses._sum.amount ?? 0,
      count: data?.expenses._count ?? 0,
      icon: WalletCards,
      color: "bg-rose-50 text-rose-600",
    },
    {
      label: "Collected",
      value: data?.sales._sum.paid ?? 0,
      count: data?.sales._count ?? 0,
      icon: ReceiptText,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];
  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="Live revenue, purchase, expense and medicine performance."
        action={
          <button className="btn-secondary" onClick={() => window.print()}>
            <Download size={16} />
            Export PDF
          </button>
        }
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, count, icon: Icon, color }) => (
          <article key={label} className="card p-5">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-slate-500">{label}</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  ₱{Number(value).toLocaleString("en-PH")}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {count} transactions
                </div>
              </div>
              <span
                className={`grid size-11 place-items-center rounded-xl ${color}`}
              >
                <Icon size={20} />
              </span>
            </div>
          </article>
        ))}
      </div>
      <section className="card mt-5 p-6">
        <h3 className="font-semibold text-slate-900">Top-selling medicines</h3>
        <p className="mt-1 text-sm text-slate-500">
          Units sold during the current month
        </p>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.topMedicines ?? []}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="medicine.brandName"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar
                dataKey="_sum.quantity"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
