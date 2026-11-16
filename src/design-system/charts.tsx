"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

/*
 * Chart conventions (see dataviz rules):
 * - categorical colours in fixed order: series-1 blue, series-2 orange, series-3 aqua
 * - 2px lines, 4px rounded bar caps, recessive horizontal grid, one y-axis
 * - legend only when ≥2 series; text never wears series colour
 */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"] as const;
const GRID = "#eceef1";
const TICK = { fill: "#8a93a2", fontSize: 12 };

export type SeriesDef<K extends string> = { key: K; label: string };

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: Partial<TooltipContentProps<number, string>> & { format?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2 text-ink-muted">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="tnum ml-auto pl-4 font-medium text-ink">
            {format ? format(Number(p.value)) : Number(p.value).toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChartLegend<K extends string>({ series }: { series: SeriesDef<K>[] }) {
  if (series.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
      {series.map((s, i) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ background: SERIES[i] }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

export function TrendChart<T extends Record<string, string | number>, K extends Extract<keyof T, string>>({
  data,
  xKey,
  series,
  height = 240,
  format,
}: {
  data: T[];
  xKey: Extract<keyof T, string>;
  series: SeriesDef<K>[];
  height?: number;
  format?: (v: number) => string;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES[i]} stopOpacity={0.16} />
                <stop offset="100%" stopColor={SERIES[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey={xKey} tick={TICK} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
          <YAxis tick={TICK} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => (format ? format(v) : v.toLocaleString("en-IN"))} />
          <Tooltip
            cursor={{ stroke: "#c9ced6", strokeWidth: 1 }}
            content={(props) => <ChartTooltip {...(props as Partial<TooltipContentProps<number, string>>)} format={format} />}
          />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={SERIES[i]}
              strokeWidth={2}
              fill={`url(#fill-${s.key})`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={false}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ColumnChart<T extends Record<string, string | number>, K extends Extract<keyof T, string>>({
  data,
  xKey,
  series,
  height = 240,
  format,
  stacked,
}: {
  data: T[];
  xKey: Extract<keyof T, string>;
  series: SeriesDef<K>[];
  height?: number;
  format?: (v: number) => string;
  stacked?: boolean;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey={xKey} tick={TICK} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tick={TICK} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => (format ? format(v) : v.toLocaleString("en-IN"))} />
          <Tooltip
            cursor={{ fill: "rgb(27 34 48 / 0.04)" }}
            content={(props) => <ChartTooltip {...(props as Partial<TooltipContentProps<number, string>>)} format={format} />}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={SERIES[i]}
              stackId={stacked ? "a" : undefined}
              stroke="#fff"
              strokeWidth={stacked ? 2 : 0}
              radius={stacked && i < series.length - 1 ? 0 : [4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Thin horizontal bars for ranked lists (e.g. department load). */
export function RankedBars({
  items,
  format = (v) => v.toLocaleString("en-IN"),
}: {
  items: Array<{ label: string; value: number; sub?: string }>;
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label} className="group" title={`${it.label}: ${format(it.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-ink">{it.label}</span>
            <span className="tnum shrink-0 font-medium text-ink">
              {format(it.value)}
              {it.sub && <span className="ml-1.5 font-normal text-ink-subtle">{it.sub}</span>}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-ink/[0.06]">
            <div
              className="h-full rounded-full bg-[#2a78d6] transition-opacity group-hover:opacity-80"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
