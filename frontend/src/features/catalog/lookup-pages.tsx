import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Factory, FolderTree, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page";
import { api } from "@/lib/api";

type Lookups = {
  categories: Array<{ id: string; name: string; description?: string }>;
  manufacturers: Array<{ id: string; name: string; country?: string }>;
};
export function CategoriesPage() {
  return (
    <LookupPage
      type="categories"
      title="Categories"
      description="Organise medicines into reusable catalogue groups."
    />
  );
}
export function ManufacturersPage() {
  return (
    <LookupPage
      type="manufacturers"
      title="Manufacturers"
      description="Maintain medicine brands and manufacturers."
    />
  );
}

function LookupPage({
  type,
  title,
  description,
}: {
  type: "categories" | "manufacturers";
  title: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["catalog-lookups"],
    queryFn: () => api<Lookups>("/medicines/lookups"),
  });
  const mutation = useMutation({
    mutationFn: () =>
      api(`/medicines/${type}`, {
        method: "POST",
        body: JSON.stringify(
          type === "categories"
            ? { name, description: detail }
            : { name, country: detail },
        ),
      }),
    onSuccess: () => {
      toast.success(`${title.slice(0, -1)} added`);
      setOpen(false);
      setName("");
      setDetail("");
      void client.invalidateQueries({ queryKey: ["catalog-lookups"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const rows = query.data?.[type] ?? [];
  const Icon = type === "categories" ? FolderTree : Factory;
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Add {title.slice(0, -1).toLowerCase()}
          </button>
        }
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.id} className="card flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Icon size={19} />
            </span>
            <div>
              <div className="font-semibold text-slate-900">{row.name}</div>
              <div className="mt-1 text-xs text-slate-500">
                {type === "categories"
                  ? ("description" in row ? row.description : "") ||
                    "No description"
                  : ("country" in row ? row.country : "") || "Country not set"}
              </div>
            </div>
          </article>
        ))}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Add ${title.slice(0, -1).toLowerCase()}`}
      >
        <div className="space-y-4">
          <label>
            <span className="field-label">Name</span>
            <input
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            <span className="field-label">
              {type === "categories" ? "Description" : "Country"}
            </span>
            <input
              className="field"
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              disabled={name.length < 2 || mutation.isPending}
              className="btn-primary"
              onClick={() => mutation.mutate()}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
