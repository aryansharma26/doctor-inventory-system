import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Download,
  MoreHorizontal,
  PackagePlus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiEnvelope } from "@/lib/api";

type InventoryRow = {
  id: string;
  onHand: number;
  available: number;
  reorderLevel: number;
  salePrice: number;
  nearestExpiry: string | null;
  medicine: {
    brandName: string;
    genericName: string;
    sku: string;
    strength: string;
    form: string;
    manufacturer?: { name: string };
  };
};

export function InventoryPage() {
  const [search, setSearch] = useState("");
  const { data: response, isLoading } = useQuery({
    queryKey: ["inventory", search],
    queryFn: async () => {
      const response = await fetchInventory(search);
      return response;
    },
  });
  const data = response?.data;
  const columns = useMemo<ColumnDef<InventoryRow>[]>(
    () => [
      {
        header: "Medicine",
        accessorKey: "medicine.brandName",
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-bold">
              {row.original.medicine.brandName}
            </div>
            <div className="mt-1 text-[10px] text-[#82908b]">
              {row.original.medicine.genericName} ·{" "}
              {row.original.medicine.strength}
            </div>
          </div>
        ),
      },
      {
        header: "SKU",
        accessorKey: "medicine.sku",
        cell: ({ getValue }) => (
          <span className="font-mono text-[10px]">{String(getValue())}</span>
        ),
      },
      {
        header: "On hand",
        accessorKey: "onHand",
        cell: ({ row }) => (
          <div className="text-xs font-bold">
            {row.original.onHand.toLocaleString()}{" "}
            <span className="font-normal text-[#82908b]">units</span>
          </div>
        ),
      },
      {
        header: "Available",
        accessorKey: "available",
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.available.toLocaleString()}
          </span>
        ),
      },
      {
        header: "Stock health",
        cell: ({ row }) =>
          row.original.available <= Number(row.original.reorderLevel) ? (
            <StatusBadge tone="warning">Low stock</StatusBadge>
          ) : (
            <StatusBadge tone="healthy">Healthy</StatusBadge>
          ),
      },
      {
        header: "Nearest expiry",
        accessorKey: "nearestExpiry",
        cell: ({ getValue }) => (
          <span className="text-xs text-[#65736f]">
            {getValue()
              ? new Date(String(getValue())).toLocaleDateString("en-PH", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        cell: () => (
          <button
            className="grid size-8 place-items-center rounded-lg hover:bg-paper"
            aria-label="Row actions"
          >
            <MoreHorizontal size={16} />
          </button>
        ),
      },
    ],
    [],
  );
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="label">Stock control</div>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-.035em]">
            Medicine inventory
          </h2>
          <p className="mt-1 text-sm text-[#71807c]">
            Real-time stock across every clinic location and batch.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Download size={15} />
            Export
          </button>
          <button className="btn-primary">
            <PackagePlus size={15} />
            Add medicine
          </button>
        </div>
      </div>
      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-line px-3 sm:max-w-sm">
            <span className="sr-only">Search medicine inventory</span>
            <Search size={15} className="text-[#84908c]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              placeholder="Search brand, generic name, or SKU"
            />
          </label>
          <button className="btn-secondary h-10">
            <SlidersHorizontal size={14} />
            Filters
          </button>
          <div className="ml-auto text-[11px] text-[#82908b]">
            {response?.meta?.total ?? data?.length ?? 0} medicines
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr className="bg-[#fafbf9]">
                {table
                  .getHeaderGroups()
                  .flatMap((group) => group.headers)
                  .map((header) => (
                    <th
                      key={header.id}
                      className="border-b border-line px-5 py-3 text-left text-[9px] font-bold uppercase tracking-[.13em] text-[#71807c]"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-52 text-center text-xs text-[#82908b]"
                  >
                    Loading inventory…
                  </td>
                </tr>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line/80 last:border-0 hover:bg-[#fafbf9]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-52 text-center text-xs text-[#82908b]"
                  >
                    No medicines match this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[11px] text-[#71807c]">
          <span>Page 1</span>
          <div className="flex gap-2">
            <button
              disabled
              className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled
              className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

async function fetchInventory(search: string) {
  const encoded = new URLSearchParams({
    page: "1",
    pageSize: "50",
    ...(search ? { search } : {}),
  });
  return apiEnvelope<InventoryRow[]>(`/inventory?${encoded}`);
}
