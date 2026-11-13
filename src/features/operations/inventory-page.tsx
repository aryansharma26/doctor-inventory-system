"use client";

import { useState } from "react";
import { formatPhp } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  PackagePlus,
  Pill,
  Search,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

interface MedicineItem {
  id: string;
  sku: string;
  name: string;
  genericName: string;
  category: string;
  form: string;
  strength: string;
  stockQty: number;
  reorderLevel: number;
  unitPricePhp: number;
  supplier: string;
}

const INITIAL_MEDICINES: MedicineItem[] = [
  {
    id: "med-1",
    sku: "MED-PCM-500",
    name: "Biogesic Paracetamol",
    genericName: "Paracetamol",
    category: "Analgesic & Antipyretic",
    form: "Tablet",
    strength: "500 mg",
    stockQty: 340,
    reorderLevel: 100,
    unitPricePhp: 6.5,
    supplier: "Unilab Philippines",
  },
  {
    id: "med-2",
    sku: "MED-AMX-500",
    name: "Amoxil Amoxicillin",
    genericName: "Amoxicillin Trihydrate",
    category: "Antibiotics",
    form: "Capsule",
    strength: "500 mg",
    stockQty: 48,
    reorderLevel: 80,
    unitPricePhp: 18.0,
    supplier: "GlaxoSmithKline Phils",
  },
  {
    id: "med-3",
    sku: "MED-AML-005",
    name: "Norvasc Amlodipine",
    genericName: "Amlodipine Besylate",
    category: "Cardiovascular / Anti-HTN",
    form: "Tablet",
    strength: "5 mg",
    stockQty: 180,
    reorderLevel: 50,
    unitPricePhp: 22.5,
    supplier: "Pfizer Philippines",
  },
  {
    id: "med-4",
    sku: "MED-MET-500",
    name: "Glucophage Metformin",
    genericName: "Metformin Hydrochloride",
    category: "Antidiabetic",
    form: "Tablet",
    strength: "500 mg",
    stockQty: 25,
    reorderLevel: 60,
    unitPricePhp: 14.0,
    supplier: "Merck Healthcare",
  },
  {
    id: "med-5",
    sku: "MED-SOL-500",
    name: "Solmux Carbocisteine",
    genericName: "Carbocisteine",
    category: "Respiratory / Mucolytic",
    form: "Capsule",
    strength: "500 mg",
    stockQty: 210,
    reorderLevel: 75,
    unitPricePhp: 11.25,
    supplier: "Unilab Philippines",
  },
  {
    id: "med-6",
    sku: "MED-OMP-020",
    name: "Omepron Omeprazole",
    genericName: "Omeprazole",
    category: "Gastrointestinal",
    form: "Capsule",
    strength: "20 mg",
    stockQty: 15,
    reorderLevel: 50,
    unitPricePhp: 28.0,
    supplier: "Zuellig Pharma Phils",
  },
];

export function InventoryPage() {
  const [items, setItems] = useState<MedicineItem[]>(INITIAL_MEDICINES);
  const [search, setSearch] = useState("");
  const [filterAlert, setFilterAlert] = useState<boolean>(false);

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.genericName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesAlert = !filterAlert || item.stockQty <= item.reorderLevel;
    return matchesSearch && matchesAlert;
  });

  const lowStockCount = items.filter((i) => i.stockQty <= i.reorderLevel).length;
  const totalStockValue = items.reduce(
    (acc, i) => acc + i.stockQty * i.unitPricePhp,
    0
  );

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Pharmacy Inventory & Formulary
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Stock levels, automatic re-order triggers, and supplier procurement tracking.
          </p>
        </div>

        <button
          onClick={() => {
            toast.info("Add Medicine dialog");
          }}
          className="btn-primary text-xs"
        >
          <PackagePlus className="w-3.5 h-3.5" /> Add Drug to Formulary
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Total Formulations
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
              {items.length} SKUs
            </div>
          </div>
          <span className="badge badge-zinc text-xs font-semibold px-2 py-1">
            <Pill className="w-3 h-3" /> Catalog
          </span>
        </div>

        <div className="panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Low Stock Warnings
            </div>
            <div className="text-2xl font-bold tracking-tight text-rose-700 mt-0.5 font-mono">
              {lowStockCount} Items
            </div>
          </div>
          <span className="badge badge-red text-xs font-semibold px-2 py-1">
            <AlertTriangle className="w-3 h-3" /> Reorder
          </span>
        </div>

        <div className="panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Total Inventory Value
            </div>
            <div className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 font-mono">
              {formatPhp(totalStockValue)}
            </div>
          </div>
          <span className="badge badge-green text-xs font-semibold px-2 py-1">
            Valuation
          </span>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-900">
              Drug Inventory List
            </span>
            <span className="badge badge-zinc font-mono text-[11px]">
              {filtered.length} Items
            </span>
          </div>

          <button
            onClick={() => setFilterAlert(!filterAlert)}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              filterAlert
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "text-zinc-600 hover:text-zinc-900 border border-zinc-200"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Show Low Stock Only ({lowStockCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by brand name, generic formulation, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-zinc-900 outline-none w-full"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header">SKU</th>
                <th className="table-header">Drug Name & Generic</th>
                <th className="table-header">Category</th>
                <th className="table-header">Form / Strength</th>
                <th className="table-header">Current Stock</th>
                <th className="table-header">Unit Price</th>
                <th className="table-header">Supplier</th>
                <th className="table-header text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isLow = item.stockQty <= item.reorderLevel;
                return (
                  <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="table-cell font-mono font-bold text-xs text-zinc-600">
                      {item.sku}
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold text-zinc-900">{item.name}</div>
                      <div className="text-[11px] text-zinc-500">{item.genericName}</div>
                    </td>
                    <td className="table-cell text-xs text-zinc-600">
                      {item.category}
                    </td>
                    <td className="table-cell text-xs text-zinc-600 font-mono">
                      {item.form} · {item.strength}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isLow ? "text-rose-700" : "text-zinc-900"
                          }`}
                        >
                          {item.stockQty}
                        </span>
                        {isLow ? (
                          <span className="badge badge-red text-[10px]">
                            Low (min {item.reorderLevel})
                          </span>
                        ) : (
                          <span className="badge badge-green text-[10px]">OK</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs font-semibold text-zinc-900">
                      {formatPhp(item.unitPricePhp)}
                    </td>
                    <td className="table-cell text-xs text-zinc-500">
                      {item.supplier}
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => {
                          const add = prompt(`Add stock quantity for ${item.name}:`, "50");
                          if (add && Number(add) > 0) {
                            setItems((prev) =>
                              prev.map((m) =>
                                m.id === item.id ? { ...m, stockQty: m.stockQty + Number(add) } : m
                              )
                            );
                            toast.success(`Restocked ${item.name} by +${add} units`);
                          }
                        }}
                        className="btn-secondary text-[11px] py-1 px-2"
                      >
                        + Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
