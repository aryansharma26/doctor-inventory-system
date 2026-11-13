import type { LucideIcon } from "lucide-react";
export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-paper text-pine">
        <Icon size={22} />
      </span>
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[#71807c]">{body}</p>
    </div>
  );
}
