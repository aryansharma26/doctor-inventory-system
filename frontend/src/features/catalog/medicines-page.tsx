import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Barcode, PackagePlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { EmptyRows, PageHeader, TableToolbar } from "@/components/ui/page";
import { api, apiEnvelope } from "@/lib/api";

type CatalogRow = {
  id: string;
  salePrice: number;
  reorderLevel: number;
  isActive: boolean;
  medicine: {
    id: string;
    brandName: string;
    genericName: string;
    sku: string;
    barcode?: string;
    form: string;
    strength: string;
    unit: string;
    taxRate: number;
    category?: { name: string };
    manufacturer?: { name: string };
  };
};
type Lookups = {
  categories: Array<{ id: string; name: string }>;
  manufacturers: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
};
const schema = z.object({
  brandName: z.string().min(2),
  genericName: z.string().min(2),
  sku: z.string().min(2),
  barcode: z.string(),
  form: z.string().min(2),
  strength: z.string().min(1),
  unit: z.string().min(1),
  taxRate: z.coerce.number().min(0).max(100),
  categoryId: z.string(),
  manufacturerId: z.string(),
  salePrice: z.coerce.number().positive(),
  reorderLevel: z.coerce.number().min(0),
  reorderQuantity: z.coerce.number().min(0),
});

export function MedicinesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["medicines", search],
    queryFn: () =>
      apiEnvelope<CatalogRow[]>(
        `/medicines?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
      ),
  });
  const lookups = useQuery({
    queryKey: ["catalog-lookups"],
    queryFn: () => api<Lookups>("/medicines/lookups"),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      brandName: "",
      genericName: "",
      sku: "",
      barcode: "",
      form: "Tablet",
      strength: "",
      unit: "tablet",
      taxRate: 5,
      categoryId: "",
      manufacturerId: "",
      salePrice: 0,
      reorderLevel: 10,
      reorderQuantity: 50,
    },
  });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      api("/medicines", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          categoryId: values.categoryId || undefined,
          manufacturerId: values.manufacturerId || undefined,
          barcode: values.barcode || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success("Medicine added to inventory");
      setOpen(false);
      form.reset();
      void client.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <>
      <PageHeader
        title="Products"
        description="Medicine catalogue, pricing and reorder configuration."
        action={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <PackagePlus size={16} />
            Add product
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
                <th>Product</th>
                <th>SKU / Barcode</th>
                <th>Category</th>
                <th>Manufacturer</th>
                <th>Unit</th>
                <th>Reorder</th>
                <th className="text-right!">Sale price</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold text-slate-900">
                      {row.medicine.brandName}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {row.medicine.genericName} · {row.medicine.strength}
                    </div>
                  </td>
                  <td>
                    <div className="font-mono text-xs">{row.medicine.sku}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Barcode size={12} />
                      {row.medicine.barcode || "Not set"}
                    </div>
                  </td>
                  <td>{row.medicine.category?.name || "—"}</td>
                  <td>{row.medicine.manufacturer?.name || "—"}</td>
                  <td>
                    {row.medicine.form} / {row.medicine.unit}
                  </td>
                  <td>{Number(row.reorderLevel)}</td>
                  <td className="text-right! font-semibold!">
                    ₱{Number(row.salePrice).toLocaleString("en-PH")}
                  </td>
                </tr>
              ))}
              {!query.data?.data.length && (
                <EmptyRows
                  columns={7}
                  loading={query.isLoading}
                  label="No products found. Add your first medicine."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add medicine"
        description="Create a catalogue item and configure it for this clinic."
      >
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Brand name">
            <input className="field" {...form.register("brandName")} />
          </Field>
          <Field label="Generic name">
            <input className="field" {...form.register("genericName")} />
          </Field>
          <Field label="SKU">
            <input className="field" {...form.register("sku")} />
          </Field>
          <Field label="Barcode">
            <input className="field" {...form.register("barcode")} />
          </Field>
          <Field label="Form">
            <select className="field" {...form.register("form")}>
              <option>Tablet</option>
              <option>Capsule</option>
              <option>Syrup</option>
              <option>Injection</option>
              <option>Cream</option>
              <option>Drops</option>
            </select>
          </Field>
          <Field label="Strength">
            <input
              className="field"
              placeholder="500 mg"
              {...form.register("strength")}
            />
          </Field>
          <Field label="Category">
            <select className="field" {...form.register("categoryId")}>
              <option value="">Uncategorised</option>
              {lookups.data?.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Manufacturer">
            <select className="field" {...form.register("manufacturerId")}>
              <option value="">Not specified</option>
              {lookups.data?.manufacturers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit">
            <input className="field" {...form.register("unit")} />
          </Field>
          <Field label="VAT / Tax % (12%)">
            <input
              type="number"
              className="field"
              {...form.register("taxRate")}
            />
          </Field>
          <Field label="Sale price">
            <input
              type="number"
              step=".01"
              className="field"
              {...form.register("salePrice")}
            />
          </Field>
          <Field label="Reorder level">
            <input
              type="number"
              className="field"
              {...form.register("reorderLevel")}
            />
          </Field>
          <Field label="Reorder quantity">
            <input
              type="number"
              className="field"
              {...form.register("reorderQuantity")}
            />
          </Field>
          <div className="col-span-full flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? "Adding…" : "Add medicine"}
            </button>
          </div>
        </form>
      </Modal>
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
