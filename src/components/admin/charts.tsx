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
} from "recharts";
import { formatIQD, formatNumber } from "@/lib/format";

/**
 * Admin charts (Recharts). Single-series charts use one brand hue (no legend needed; the
 * card title names the series), thin marks, recessive grid, hover tooltips, and a table view
 * for accessibility. Charts render LTR internally so time reads left→right.
 */

const INK = "#200b2c";
const MUTED = "#7d6c8a";
const GRID = "#ebe3f1";
const SERIES = "#634477"; // plum-600 — ≥3:1 against the white surface
const SERIES_SOFT = "#cdb4de"; // lavender-300 area fill

type Point = { day: string; revenue: number; orders: number };

const shortDay = (d: string) => {
  const [, m, day] = d.split("-");
  return `${Number(day)}/${Number(m)}`;
};

const compactIQD = (v: number) =>
  v >= 1_000_000 ? `${formatNumber(v / 1_000_000, 1)}M` : v >= 1000 ? `${formatNumber(v / 1000)}K` : formatNumber(v);

function TooltipBox({ title, lines }: { title: string; lines: Array<[string, string]> }) {
  return (
    <div dir="rtl" className="rounded-lg border border-line bg-paper px-3 py-2 text-xs shadow-lift">
      <p className="mb-1 font-medium text-plum-950" dir="ltr">
        {title}
      </p>
      {lines.map(([k, v]) => (
        <p key={k} className="flex justify-between gap-4 text-muted">
          <span>{k}</span>
          <span className="font-medium text-plum-950 tabular-nums">{v}</span>
        </p>
      ))}
    </div>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: [string, string]; rows: Array<[string, string]> }) {
  return (
    <details className="mt-3 text-xs">
      <summary className="cursor-pointer text-subtle hover:text-plum-950">عرض كجدول</summary>
      <div className="mt-2 max-h-56 overflow-y-auto">
        <table className="w-full">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="text-subtle">
              <th className="py-1 text-start font-normal">{head[0]}</th>
              <th className="py-1 text-end font-normal">{head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b]) => (
              <tr key={a} className="border-t border-line">
                <td className="py-1" dir="ltr">
                  {a}
                </td>
                <td className="py-1 text-end tabular-nums">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <div>
      <div dir="ltr" className="h-64 w-full" role="img" aria-label="الإيرادات اليومية">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_SOFT} stopOpacity={0.7} />
                <stop offset="100%" stopColor={SERIES_SOFT} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis tickFormatter={compactIQD} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: INK, strokeWidth: 1, strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                const p = active && payload?.[0] ? (payload[0].payload as Point) : null;
                return p ? (
                  <TooltipBox
                    title={p.day}
                    lines={[
                      ["الإيرادات", formatIQD(p.revenue)],
                      ["الطلبات", formatNumber(p.orders)],
                    ]}
                  />
                ) : null;
              }}
            />
            <Area type="monotone" dataKey="revenue" stroke={SERIES} strokeWidth={2} fill="url(#revFill)" activeDot={{ r: 4, stroke: "#fefeff", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption="الإيرادات اليومية" head={["اليوم", "الإيرادات"]} rows={data.map((d) => [d.day, formatIQD(d.revenue)])} />
    </div>
  );
}

export function OrdersChart({ data }: { data: Point[] }) {
  return (
    <div>
      <div dir="ltr" className="h-64 w-full" role="img" aria-label="عدد الطلبات اليومية">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              cursor={{ fill: "#f1e8f6" }}
              content={({ active, payload }) => {
                const p = active && payload?.[0] ? (payload[0].payload as Point) : null;
                return p ? <TooltipBox title={p.day} lines={[["الطلبات", formatNumber(p.orders)]]} /> : null;
              }}
            />
            <Bar dataKey="orders" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption="الطلبات اليومية" head={["اليوم", "الطلبات"]} rows={data.map((d) => [d.day, formatNumber(d.orders)])} />
    </div>
  );
}

/** Horizontal ranking bars (products / categories) — labels in text ink, values direct-labelled. */
export function RankingBars({ data, valueLabel }: { data: Array<{ name: string; value: number; units: number }>; valueLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="py-8 text-center text-sm text-subtle">لا توجد مبيعات في هذه الفترة.</p>;
  return (
    <ul className="space-y-3" aria-label={valueLabel}>
      {data.map((d) => (
        <li key={d.name} className="group" title={`${d.name}: ${formatIQD(d.value)} · ${formatNumber(d.units)} قطعة`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-plum-950">{d.name}</span>
            <span className="shrink-0 text-xs text-muted tabular-nums">
              {formatIQD(d.value)} · {formatNumber(d.units)} قطعة
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-lavender-50">
            <div className="h-full rounded-full bg-plum-600 transition-[width] group-hover:bg-plum-950" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
