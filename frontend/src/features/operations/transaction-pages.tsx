import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Minus,
  Plus,
  Printer,
  Receipt,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { EmptyRows, PageHeader, TableToolbar } from "@/components/ui/page";
import { api, apiEnvelope } from "@/lib/api";

type Supplier = { id: string; name: string };
type Product = {
  id: string;
  salePrice: number;
  medicine: {
    id: string;
    brandName: string;
    genericName: string;
    sku: string;
    strength: string;
    taxRate: number;
  };
};
type Inventory = Product & { available: number };
type Purchase = {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  expectedDate?: string;
  total: number;
  supplier: Supplier;
  items: Array<{
    id: string;
    quantity: number;
    received: number;
    medicine: Product["medicine"];
  }>;
};
type Invoice = {
  id: string;
  invoiceNumber: string;
  patientName: string;
  status: string;
  issuedAt: string;
  paymentMethod: string;
  total: number;
  paid: number;
  items: Array<{ id: string; quantity: number; medicine: Product["medicine"] }>;
};
const currency = (value: number) =>
  `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PurchasesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const [supplierId, setSupplierId] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const query = useQuery({
    queryKey: ["purchases", search],
    queryFn: () =>
      apiEnvelope<Purchase[]>(
        `/purchase-orders?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
      ),
  });
  const suppliers = useQuery({
    queryKey: ["supplier-options"],
    queryFn: () => apiEnvelope<Supplier[]>("/suppliers?page=1&pageSize=100"),
  });
  const products = useQuery({
    queryKey: ["product-options"],
    queryFn: () => apiEnvelope<Product[]>("/medicines?page=1&pageSize=100"),
  });
  const create = useMutation({
    mutationFn: () =>
      api("/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          supplierId,
          items: [
            {
              medicineId,
              quantity,
              unitPrice,
              taxRate:
                products.data?.data.find(
                  (item) => item.medicine.id === medicineId,
                )?.medicine.taxRate ?? 0,
            },
          ],
        }),
      }),
    onSuccess: () => {
      toast.success("Purchase order created");
      setOpen(false);
      void client.invalidateQueries({ queryKey: ["purchases"] });
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <>
      <PageHeader
        title="Purchases"
        description="Create, track and receive medicine purchase orders."
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} />
            New purchase
          </button>
        }
      />
      <section className="card mt-6 overflow-hidden">
        <TableToolbar
          search={search}
          onSearch={setSearch}
          count={query.data?.meta?.total}
        />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Purchase</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Items</th>
                <th>Status</th>
                <th className="text-right!">Total</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.data.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold! text-blue-700!">
                    {row.orderNumber}
                  </td>
                  <td>{row.supplier.name}</td>
                  <td>{new Date(row.orderDate).toLocaleDateString("en-PH")}</td>
                  <td>{row.items.length}</td>
                  <td>
                    <Status value={row.status} />
                  </td>
                  <td className="text-right! font-semibold!">
                    {currency(row.total)}
                  </td>
                </tr>
              ))}
              {!query.data?.data.length && (
                <EmptyRows
                  columns={6}
                  loading={query.isLoading}
                  label="No purchases found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create purchase order"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Supplier">
            <select
              className="field"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
            >
              <option value="">Select supplier</option>
              {suppliers.data?.data.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Medicine">
            <select
              className="field"
              value={medicineId}
              onChange={(event) => setMedicineId(event.target.value)}
            >
              <option value="">Select medicine</option>
              {products.data?.data.map((row) => (
                <option key={row.id} value={row.medicine.id}>
                  {row.medicine.brandName} · {row.medicine.strength}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity">
            <input
              type="number"
              min={1}
              className="field"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </Field>
          <Field label="Purchase price">
            <input
              type="number"
              min={0}
              step=".01"
              className="field"
              value={unitPrice}
              onChange={(event) => setUnitPrice(Number(event.target.value))}
            />
          </Field>
          <div className="col-span-full rounded-lg bg-blue-50 p-4 text-sm">
            <span className="text-slate-500">Estimated subtotal</span>
            <strong className="float-right text-blue-800">
              {currency(quantity * unitPrice)}
            </strong>
          </div>
          <div className="col-span-full flex justify-end gap-2 border-t border-line pt-4">
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={
                !supplierId ||
                !medicineId ||
                quantity <= 0 ||
                unitPrice < 0 ||
                create.isPending
              }
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Creating…" : "Create order"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function SalesPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["sales", search],
    queryFn: () =>
      apiEnvelope<Invoice[]>(
        `/invoices?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
      ),
  });
  return (
    <>
      <PageHeader
        title="Sales"
        description="Invoices, collections and dispensing history."
        action={
          <a href="/pos" className="btn-primary">
            <Receipt size={16} />
            New sale
          </a>
        }
      />
      <section className="card mt-6 overflow-hidden">
        <TableToolbar
          search={search}
          onSearch={setSearch}
          count={query.data?.meta?.total}
        />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="text-right!">Paid / Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data?.data.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold! text-blue-700!">
                    {row.invoiceNumber}
                  </td>
                  <td>{row.patientName}</td>
                  <td>
                    {row.issuedAt
                      ? new Date(row.issuedAt).toLocaleString("en-PH")
                      : "Draft"}
                  </td>
                  <td>{row.paymentMethod.replaceAll("_", " ")}</td>
                  <td>
                    <Status value={row.status} />
                  </td>
                  <td className="text-right!">
                    {currency(row.paid)} /{" "}
                    <strong>{currency(row.total)}</strong>
                  </td>
                  <td>
                    <button
                      onClick={() => window.print()}
                      className="grid size-8 place-items-center rounded-lg hover:bg-slate-100"
                    >
                      <Printer size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {!query.data?.data.length && (
                <EmptyRows
                  columns={7}
                  loading={query.isLoading}
                  label="No sales found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

type CartItem = Inventory & { quantity: number };
export function PosPage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [patientName, setPatientName] = useState("Walk-in customer");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const client = useQueryClient();
  const inventory = useQuery({
    queryKey: ["pos-inventory", search],
    queryFn: () =>
      apiEnvelope<Inventory[]>(
        `/inventory?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
      ),
  });
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.quantity * Number(item.salePrice),
        0,
      ),
    [cart],
  );
  const add = (item: Inventory) =>
    setCart((current) => {
      const existing = current.find((row) => row.id === item.id);
      if (existing)
        return current.map((row) =>
          row.id === item.id
            ? { ...row, quantity: Math.min(row.quantity + 1, row.available) }
            : row,
        );
      return [...current, { ...item, quantity: 1 }];
    });
  const change = (id: string, delta: number) =>
    setCart((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              quantity: Math.max(
                1,
                Math.min(row.available, row.quantity + delta),
              ),
            }
          : row,
      ),
    );
  const checkout = useMutation({
    mutationFn: () =>
      api<Invoice>("/invoices", {
        method: "POST",
        body: JSON.stringify({
          patientName,
          paymentMethod,
          paid: subtotal,
          discount: 0,
          items: cart.map((item) => ({
            medicineId: item.medicine.id,
            quantity: item.quantity,
            unitPrice: Number(item.salePrice),
            taxRate: Number(item.medicine.taxRate),
          })),
        }),
      }),
    onSuccess: (invoice) => {
      toast.success(`Sale completed · ${invoice.invoiceNumber}`);
      setCart([]);
      void client.invalidateQueries({ queryKey: ["pos-inventory"] });
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <div>
      <PageHeader
        title="Point of Sale"
        description="Fast billing with live stock checks and FEFO batch deduction."
      />
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_390px]">
        <section className="card overflow-hidden">
          <TableToolbar
            search={search}
            onSearch={setSearch}
            count={inventory.data?.meta?.total}
          />
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.data?.data.map((item) => (
              <button
                key={item.id}
                disabled={item.available <= 0}
                onClick={() => add(item)}
                className="rounded-xl border border-line p-4 text-left transition hover:border-blue-300 hover:shadow-sm disabled:opacity-45"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-slate-900">
                    {item.medicine.brandName}
                  </div>
                  <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {currency(item.salePrice)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.medicine.genericName}
                </div>
                <div className="mt-4 flex justify-between text-xs">
                  <span className="font-mono text-slate-400">
                    {item.medicine.sku}
                  </span>
                  <span
                    className={
                      item.available <= 5
                        ? "font-medium text-amber-600"
                        : "text-slate-500"
                    }
                  >
                    {item.available} available
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
        <aside className="card self-start overflow-hidden xl:sticky xl:top-24">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <ShoppingCart size={18} className="text-blue-600" />
            <h3 className="font-semibold">Current sale</h3>
            <span className="ml-auto rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
              {cart.length} items
            </span>
          </div>
          <div className="max-h-80 divide-y divide-line overflow-y-auto">
            {cart.length ? (
              cart.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {item.medicine.brandName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {currency(item.salePrice)} each
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setCart((rows) =>
                          rows.filter((row) => row.id !== item.id),
                        )
                      }
                      className="text-rose-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center">
                    <button
                      onClick={() => change(item.id, -1)}
                      className="grid size-7 place-items-center rounded border border-line"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => change(item.id, 1)}
                      className="grid size-7 place-items-center rounded border border-line"
                    >
                      <Plus size={13} />
                    </button>
                    <strong className="ml-auto text-sm">
                      {currency(item.quantity * Number(item.salePrice))}
                    </strong>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-sm text-slate-400">
                Select medicines to begin.
              </div>
            )}
          </div>
          <div className="space-y-4 border-t border-line bg-slate-50/70 p-5">
            <Field label="Patient">
              <input
                className="field bg-white!"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
              />
            </Field>
            <Field label="Payment method">
              <select
                className="field bg-white!"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="GCASH">GCash</option>
                <option value="MAYA">Maya</option>
                <option value="CREDIT">Credit</option>
              </select>
            </Field>
            <div className="flex items-end justify-between border-t border-line pt-4">
              <span className="text-sm text-slate-500">Total</span>
              <strong className="text-2xl text-slate-900">
                {currency(subtotal)}
              </strong>
            </div>
            <button
              disabled={!cart.length || checkout.isPending}
              onClick={() => checkout.mutate()}
              className="btn-primary w-full"
            >
              {checkout.isPending ? "Processing…" : "Complete sale"}
            </button>
          </div>
        </aside>
      </div>
    </div>
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
function Status({ value }: { value: string }) {
  const good = ["PAID", "RECEIVED", "ACTIVE"].includes(value);
  const bad = ["VOID", "CANCELLED"].includes(value);
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${good ? "bg-emerald-50 text-emerald-700" : bad ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
