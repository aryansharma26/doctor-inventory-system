import { cn } from "@/lib/cn";

const tones = {
  healthy: "bg-[#e8f4ec] text-[#246240]",
  warning: "bg-[#fff4d6] text-[#8a5c08]",
  danger: "bg-[#fde9e7] text-[#a23a32]",
  neutral: "bg-[#edf0ee] text-[#52605c]",
};
export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
