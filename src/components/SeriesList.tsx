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
    "tw-bg-primary-dim tw-text-primary tw-border tw-border-primary/30",
  completed:
    "tw-bg-slate-700/50 tw-text-slate-300 tw-border tw-border-slate-600/50",
  archived:
    "tw-bg-slate-700/30 tw-text-slate-400 tw-border tw-border-slate-600/30",
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
        <h2 className="tw-font-display tw-text-lg tw-font-bold tw-text-slate-50">Séries</h2>
      </div>
      {series.length === 0 ? (
        <div className="tw-bg-surface tw-rounded-2xl tw-p-8 tw-text-center tw-border tw-border-slate-700/50 tw-shadow-lg">
          <p className="tw-text-slate-400">
            Nenhuma série ainda.
          </p>
          <button
            type="button"
            className="tw-mt-4 tw-px-4 tw-py-2 tw-rounded-xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold tw-text-sm touch-target"
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
              className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-shadow-lg tw-border tw-border-slate-700/50 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-cursor-pointer active:tw-opacity-90"
              onClick={() => onSelect(s.id)}
            >
              <div className="tw-flex-1 tw-min-w-0">
                <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                  <h3 className="tw-font-display tw-font-bold tw-text-slate-50">{s.name}</h3>
                  <span
                    className={`tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full tw-font-medium ${
                      statusClass[s.status] ?? statusClass.archived
                    }`}
                  >
                    {statusLabel[s.status] ?? s.status}
                  </span>
                </div>
                <p className="tw-text-sm tw-text-slate-400 tw-mt-1">
                  {formatDate(s.startDate)} – {formatDate(s.endDate)} · {days}{" "}
                  dias
                </p>
                <p className="tw-text-xs tw-text-slate-500 tw-mt-0.5">
                  {count} exercícios com carga
                </p>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 tw-shrink-0">
                <button
                  type="button"
                  className="touch-target tw-w-10 tw-h-10 tw-rounded-xl tw-bg-slate-700/80 tw-text-slate-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(s);
                  }}
                  aria-label="Editar"
                >
                  ✎
                </button>
                <span
                  className="touch-target tw-w-10 tw-h-10 tw-rounded-xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold tw-inline-flex tw-items-center tw-justify-center"
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
