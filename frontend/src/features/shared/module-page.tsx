import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function ModulePage({
  eyebrow,
  title,
  description,
  icon,
  action = "Create record",
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action?: string;
}) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="label">{eyebrow}</div>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-.035em]">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[#71807c]">{description}</p>
        </div>
        <button className="btn-primary">
          <Plus size={15} />
          {action}
        </button>
      </div>
      <section className="card mt-6">
        <EmptyState
          icon={icon}
          title={`No ${title.toLowerCase()} yet`}
          body="Records created in this workspace will appear here with role-aware actions, filters, and an immutable activity history."
        />
      </section>
    </div>
  );
}
