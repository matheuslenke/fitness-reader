import type { Series } from "../types/fitness";
import { formatDate, daysBetween } from "../lib/utils";

interface SeriesListProps {
  series: Series[];
  onSelect: (id: string) => void;
  onEdit: (s: Series) => void;
  onCreate: () => void;
}

const statusLabel: Record<string, string> = {
  active: "Ativa",
  completed: "Concluída",
  archived: "Arquivada",
};

const statusClass: Record<string, string> = {
  active:
    "tw-bg-emerald-100 tw-text-emerald-700 tw-dark:tw-bg-emerald-900/40 tw-dark:tw-text-emerald-300",
  completed:
    "tw-bg-zinc-200 tw-text-zinc-700 tw-dark:tw-bg-zinc-700 tw-dark:tw-text-zinc-300",
  archived:
    "tw-bg-zinc-100 tw-text-zinc-600 tw-dark:tw-bg-zinc-800 tw-dark:tw-text-zinc-400",
};

export function SeriesList({
  series,
  onSelect,
  onEdit,
  onCreate,
}: SeriesListProps) {
  return (
    <div className="tw-px-4 tw-space-y-3">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-text-lg tw-font-semibold">Séries</h2>
        <button
          type="button"
          className="touch-target tw-px-4 tw-py-2 tw-rounded-xl tw-bg-emerald-600 tw-text-white tw-text-sm tw-font-medium"
          onClick={onCreate}
        >
          Nova série
        </button>
      </div>
      {series.length === 0 ? (
        <div className="tw-bg-white tw-dark:tw-bg-zinc-800 tw-rounded-2xl tw-p-8 tw-text-center tw-border tw-border-zinc-200 tw-dark:tw-border-zinc-700">
          <p className="tw-text-zinc-500 tw-dark:tw-text-zinc-400">
            Nenhuma série ainda.
          </p>
          <button
            type="button"
            className="tw-mt-4 tw-px-4 tw-py-2 tw-rounded-xl tw-bg-emerald-600 tw-text-white tw-text-sm tw-font-medium touch-target"
            onClick={onCreate}
          >
            Criar primeira série
          </button>
        </div>
      ) : (
        series.map((s) => {
          const days = daysBetween(s.startDate, s.endDate);
          const count = Object.keys(s.exerciseWeights ?? {}).reduce(
            (acc, id) =>
              acc + ((s.exerciseWeights?.[id] ?? []).length > 0 ? 1 : 0),
            0
          );
          return (
            <div
              key={s.id}
              className="tw-bg-white tw-dark:tw-bg-zinc-800 tw-rounded-2xl tw-p-4 tw-shadow-sm tw-border tw-border-zinc-200 tw-dark:tw-border-zinc-700 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-cursor-pointer active:tw-opacity-90"
              onClick={() => onSelect(s.id)}
            >
              <div className="tw-flex-1 tw-min-w-0">
                <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                  <h3 className="tw-font-semibold">{s.name}</h3>
                  <span
                    className={`tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full tw-font-medium ${
                      statusClass[s.status] ?? statusClass.archived
                    }`}
                  >
                    {statusLabel[s.status] ?? s.status}
                  </span>
                </div>
                <p className="tw-text-sm tw-text-zinc-500 tw-dark:tw-text-zinc-400 tw-mt-1">
                  {formatDate(s.startDate)} – {formatDate(s.endDate)} · {days}{" "}
                  dias
                </p>
                <p className="tw-text-xs tw-text-zinc-400 tw-dark:tw-text-zinc-500 tw-mt-0.5">
                  {count} exercícios com carga
                </p>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 tw-shrink-0">
                <button
                  type="button"
                  className="touch-target tw-w-10 tw-h-10 tw-rounded-xl tw-bg-zinc-100 tw-dark:tw-bg-zinc-700 tw-text-zinc-600 tw-dark:tw-text-zinc-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(s);
                  }}
                  aria-label="Editar"
                >
                  ✎
                </button>
                <span
                  className="touch-target tw-w-10 tw-h-10 tw-rounded-xl tw-bg-emerald-600 tw-text-white tw-inline-flex tw-items-center tw-justify-center"
                  aria-hidden
                >
                  →
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
