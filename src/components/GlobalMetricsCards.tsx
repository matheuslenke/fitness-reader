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
      <div className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-shadow-lg tw-border tw-border-slate-700/50 tw-text-center">
        <p className="tw-text-xs tw-font-medium tw-text-slate-400 tw-uppercase tw-tracking-wide">
          Peso
        </p>
        <p className="tw-font-display tw-text-xl tw-font-bold tw-text-primary tw-mt-1">
          {weight != null ? `${weight} kg` : "—"}
        </p>
      </div>
      <div className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-shadow-lg tw-border tw-border-slate-700/50 tw-text-center">
        <p className="tw-text-xs tw-font-medium tw-text-slate-400 tw-uppercase tw-tracking-wide">
          Gordura %
        </p>
        <p className="tw-font-display tw-text-xl tw-font-bold tw-text-secondary tw-mt-1">
          {bodyFat != null ? `${bodyFat}%` : "—"}
        </p>
      </div>
      <div className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-shadow-lg tw-border tw-border-slate-700/50 tw-text-center">
        <p className="tw-text-xs tw-font-medium tw-text-slate-400 tw-uppercase tw-tracking-wide">
          Cargas
        </p>
        <p className="tw-font-display tw-text-xl tw-font-bold tw-text-slate-50 tw-mt-1">
          {exerciseCount}
        </p>
      </div>
    </div>
  );
}
