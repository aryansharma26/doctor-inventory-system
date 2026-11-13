import {
  AlertCircle,
  Banknote,
  CheckCircle,
  CreditCard,
  Printer,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getStoredTickets, type OPDTicket } from "./opd-store";

export function DailyCollectionPage() {
  const [tickets, setTickets] = useState<OPDTicket[]>([]);

  useEffect(() => {
    setTickets(getStoredTickets());
  }, []);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filter today's tickets or use all for demonstration
  const todayTickets = tickets;

  const paidTickets = todayTickets.filter(
    (t) =>
      t.status === "COMPLETED" ||
      t.billing?.paymentStatus === "PAID",
  );
  const unpaidTickets = todayTickets.filter(
    (t) =>
      t.status === "WAITING" ||
      t.status === "IN_CONSULTATION" ||
      t.billing?.paymentStatus === "PENDING",
  );

  const totalCollection = paidTickets.reduce(
    (sum, t) => sum + (t.billing?.totalAmountPhp || 0),
    0,
  );

  const getPaymentStats = (method: string) => {
    const methodTickets = paidTickets.filter(
      (t) => t.billing?.paymentMethod === method,
    );
    const amount = methodTickets.reduce(
      (sum, t) => sum + (t.billing?.totalAmountPhp || 0),
      0,
    );
    return { count: methodTickets.length, amount };
  };

  const cashStats = getPaymentStats("CASH");
  const gcashStats = getPaymentStats("GCASH");
  const mayaStats = getPaymentStats("MAYA");
  const cardStats = getPaymentStats("CARD");

  const formatPhp = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const handlePrint = () => {
    window.print();
  };

  const calcPercentage = (amount: number) => {
    if (totalCollection === 0) return 0;
    return (amount / totalCollection) * 100;
  };

  return (
    <div className="print-area min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Sparkles className="w-64 h-64 -mt-16 -mr-16" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Daily Collection Summary
            </h1>
            <p className="text-blue-200 text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              {todayStr}
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="no-print mt-4 md:mt-0 bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all text-white py-3 px-6 rounded-full flex items-center font-medium shadow-lg cursor-pointer"
          >
            <Printer className="w-5 h-5 mr-2" />
            Print Daily Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Total Collection */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center col-span-1 lg:col-span-1 border-b-4 border-b-indigo-500">
          <div className="bg-indigo-100 p-3 rounded-full mb-3">
            <Wallet className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">
            Total Collection
          </p>
          <h2 className="text-3xl font-bold text-slate-800">
            {formatPhp(totalCollection)}
          </h2>
        </div>

        {/* Cash */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center border-b-4 border-b-green-500">
          <div className="bg-green-100 p-3 rounded-full mb-3">
            <Banknote className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">
            Cash ({cashStats.count})
          </p>
          <h2 className="text-2xl font-bold text-slate-800">
            {formatPhp(cashStats.amount)}
          </h2>
        </div>

        {/* GCash */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center border-b-4 border-b-blue-500">
          <div className="bg-blue-100 p-3 rounded-full mb-3">
            <Smartphone className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">
            GCash ({gcashStats.count})
          </p>
          <h2 className="text-2xl font-bold text-slate-800">
            {formatPhp(gcashStats.amount)}
          </h2>
        </div>

        {/* Maya */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center border-b-4 border-b-emerald-500">
          <div className="bg-emerald-100 p-3 rounded-full mb-3">
            <Smartphone className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">
            Maya ({mayaStats.count})
          </p>
          <h2 className="text-2xl font-bold text-slate-800">
            {formatPhp(mayaStats.amount)}
          </h2>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center border-b-4 border-b-purple-500">
          <div className="bg-purple-100 p-3 rounded-full mb-3">
            <CreditCard className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">
            Card ({cardStats.count})
          </p>
          <h2 className="text-2xl font-bold text-slate-800">
            {formatPhp(cardStats.amount)}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Breakdown */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-indigo-500" />
                Completed Payments
              </h3>
              <span className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-sm font-medium">
                {paidTickets.length} Patients
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                    <th className="p-4 font-medium">Token</th>
                    <th className="p-4 font-medium">Patient Name</th>
                    <th className="p-4 font-medium">Consultation</th>
                    <th className="p-4 font-medium">Lab</th>
                    <th className="p-4 font-medium">Medicine</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paidTickets.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 font-medium text-slate-700">
                        {t.tokenNo}
                      </td>
                      <td className="p-4 text-slate-800">{t.patientName}</td>
                      <td className="p-4 text-slate-600">
                        {formatPhp(t.billing?.consultationFeePhp || 0)}
                      </td>
                      <td className="p-4 text-slate-600">
                        {formatPhp(t.billing?.labFeePhp || 0)}
                      </td>
                      <td className="p-4 text-slate-600">
                        {formatPhp(t.billing?.medicinesFeePhp || 0)}
                      </td>
                      <td className="p-4 font-bold text-indigo-600">
                        {formatPhp(t.billing?.totalAmountPhp || 0)}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                          {t.billing?.paymentMethod || "UNKNOWN"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {paidTickets.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500"
                      >
                        No completed payments today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outstanding */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-orange-50/30">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                Outstanding / Unpaid
              </h3>
              <span className="bg-orange-100 text-orange-700 py-1 px-3 rounded-full text-sm font-medium">
                {unpaidTickets.length} Patients
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                    <th className="p-4 font-medium">Token</th>
                    <th className="p-4 font-medium">Patient Name</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {unpaidTickets.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 font-medium text-slate-700">
                        {t.tokenNo}
                      </td>
                      <td className="p-4 text-slate-800">{t.patientName}</td>
                      <td className="p-4">
                        <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-md">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {unpaidTickets.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-slate-500"
                      >
                        No outstanding patients.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">
              Payment Methods
            </h3>
            <div className="space-y-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                      Cash
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-green-600">
                      {calcPercentage(cashStats.amount).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                  <div
                    style={{ width: `${calcPercentage(cashStats.amount)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 rounded-full"
                  ></div>
                </div>
              </div>

              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      GCash
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {calcPercentage(gcashStats.amount).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                  <div
                    style={{ width: `${calcPercentage(gcashStats.amount)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 rounded-full"
                  ></div>
                </div>
              </div>

              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
                      Maya
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-emerald-600">
                      {calcPercentage(mayaStats.amount).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-emerald-100">
                  <div
                    style={{ width: `${calcPercentage(mayaStats.amount)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 rounded-full"
                  ></div>
                </div>
              </div>

              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                      Card
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-purple-600">
                      {calcPercentage(cardStats.amount).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-100">
                  <div
                    style={{ width: `${calcPercentage(cardStats.amount)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 rounded-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyCollectionPage;
