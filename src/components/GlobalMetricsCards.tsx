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
      <div className="tw-bg-white tw-dark:tw-bg-zinc-800 tw-rounded-2xl tw-p-4 tw-shadow-sm tw-border tw-border-zinc-200 tw-dark:tw-border-zinc-700 tw-text-center">
        <p className="tw-text-xs tw-font-medium tw-text-zinc-500 tw-dark:tw-text-zinc-400 tw-uppercase tw-tracking-wide">
          Peso
        </p>
        <p className="tw-text-xl tw-font-bold tw-text-emerald-600 tw-dark:tw-text-emerald-400 tw-mt-1">
          {weight != null ? `${weight} kg` : "—"}
        </p>
      </div>
      <div className="tw-bg-white tw-dark:tw-bg-zinc-800 tw-rounded-2xl tw-p-4 tw-shadow-sm tw-border tw-border-zinc-200 tw-dark:tw-border-zinc-700 tw-text-center">
        <p className="tw-text-xs tw-font-medium tw-text-zinc-500 tw-dark:tw-text-zinc-400 tw-uppercase tw-tracking-wide">
          Gordura %
        </p>
        <p className="tw-text-xl tw-font-bold tw-text-teal-600 tw-dark:tw-text-teal-400 tw-mt-1">
          {bodyFat != null ? `${bodyFat}%` : "—"}
        </p>
      </div>
      <div className="tw-bg-white tw-dark:tw-bg-zinc-800 tw-rounded-2xl tw-p-4 tw-shadow-sm tw-border tw-border-zinc-200 tw-dark:tw-border-zinc-700 tw-text-center">
        <p className="tw-text-xs tw-font-medium tw-text-zinc-500 tw-dark:tw-text-zinc-400 tw-uppercase tw-tracking-wide">
          Cargas
        </p>
        <p className="tw-text-xl tw-font-bold tw-text-zinc-700 tw-dark:tw-text-zinc-300 tw-mt-1">
          {exerciseCount}
        </p>
      </div>
    </div>
  );
}
