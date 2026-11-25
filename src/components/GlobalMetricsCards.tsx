interface GlobalMetricsCardsProps {
  weight: number | null;
  bodyFat: number | null;
  exerciseCount: number;
}

export function GlobalMetricsCards({
  weight,
  bodyFat,
  exerciseCount,
}: GlobalMetricsCardsProps) {
  return (
    <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-px-4 tw-mb-4">
      <div className="app-card tw-rounded-2xl tw-p-4 tw-text-center">
        <p className="tw-text-xs tw-font-medium tw-text-slate-400 tw-uppercase tw-tracking-wide">
          Peso
        </p>
        <p className="tw-font-display tw-text-xl tw-font-bold tw-text-primary tw-mt-1 tabular-nums">
          {weight != null ? `${weight} kg` : "—"}
        </p>
      </div>
      <div className="app-card tw-rounded-2xl tw-p-4 tw-text-center">
        <p className="tw-text-xs tw-font-medium tw-text-slate-400 tw-uppercase tw-tracking-wide">
          Gordura %
        </p>
        <p className="tw-font-display tw-text-xl tw-font-bold tw-text-secondary tw-mt-1 tabular-nums">
          {bodyFat != null ? `${bodyFat}%` : "—"}
        </p>
      </div>
      <div className="app-card tw-rounded-2xl tw-p-4 tw-text-center">
        <p className="tw-text-xs tw-font-medium tw-text-slate-400 tw-uppercase tw-tracking-wide">
          Cargas
        </p>
        <p className="tw-font-display tw-text-xl tw-font-bold tw-text-slate-50 tw-mt-1 tabular-nums">
          {exerciseCount}
        </p>
      </div>
    </div>
  );
}
