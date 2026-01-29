interface DataPoint {
  date?: string;
  bodyWeight?: number;
  bodyFatPercent?: number | null;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  valueKey: "bodyWeight" | "bodyFatPercent";
  labelKey: string;
  color?: string;
}

export function SimpleLineChart({
  data,
  valueKey,
  labelKey: _labelKey,
  color = "#bef264",
}: SimpleLineChartProps) {
  const points = (data ?? []).slice(0, 30).reverse();
  if (points.length === 0) {
    return (
      <p className="tw-text-sm tw-text-slate-400 tw-py-4">
        Sem dados
      </p>
    );
  }
  const values = points
    .map((p) => p[valueKey])
    .filter((v): v is number => v != null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 280;
  const h = 120;
  const pad = 8;
  const xs = points.map(
    (_, i) => pad + (i / Math.max(1, points.length - 1)) * (w - 2 * pad)
  );
  const ys = points.map(
    (p) =>
      h -
      pad -
      (((p[valueKey] ?? 0) - min) / range) * (h - 2 * pad)
  );
  const path = points
    .map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${ys[i]}`)
    .join(" ");
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      className="tw-overflow-visible"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
