import { useState } from "react";
import type { Exercise, Series } from "../types/fitness";

interface HistoryPageProps {
  groups: string[];
  exercisesFlat: Exercise[];
  series: Series;
  onBack: () => void;
  onExport?: () => void;
}

export function HistoryPage({
  groups,
  exercisesFlat,
  series,
  onBack,
  onExport,
}: HistoryPageProps) {
  const [filter, setFilter] = useState("all");
  const exerciseWeights = series?.exerciseWeights ?? {};
  const groupList = groups.length > 0 ? groups : ["A", "B", "C", "D", "E"];
  const filtered =
    filter === "all"
      ? exercisesFlat
      : exercisesFlat.filter((e) => e.group === filter);
  const hasAny = filtered.some(
    (e) => (exerciseWeights[e.id] ?? []).length > 0
  );

  return (
    <div className="page-enter tw-min-h-full">
      <div className="tw-sticky tw-top-0 tw-pt-[var(--safe-top)] tw-pb-3 tw-px-4 tw-bg-gradient-to-b tw-from-background tw-to-background/95 tw-border-b tw-border-slate-700/50 tw-flex tw-items-center tw-justify-between tw-gap-2">
        <button
          type="button"
          className="touch-target tw-text-primary tw-font-medium"
          onClick={onBack}
        >
          ← Voltar
        </button>
        <h1 className="tw-font-display tw-text-lg tw-font-bold tw-text-slate-50">
          Histórico de cargas
        </h1>
        <select
          className="tw-px-3 tw-py-2 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-surface tw-text-slate-50 tw-text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          {groupList.map((g) => (
            <option key={g} value={g}>
              Grupo {g}
            </option>
          ))}
        </select>
      </div>
      <div className="tw-p-4 tw-space-y-4">
        {!hasAny && (
          <p className="tw-text-slate-400 tw-text-center tw-py-8">
            Nenhum registro de carga ainda.
          </p>
        )}
        {filtered.map((ex) => {
          const hist = (exerciseWeights[ex.id] ?? []).slice(0, 10);
          if (hist.length === 0) return null;
          return (
            <div
              key={ex.id}
              className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-border tw-border-slate-700/50"
            >
              <p className="tw-font-medium tw-text-sm tw-text-slate-400">
                Grupo {ex.group}
              </p>
              <h3 className="tw-font-display tw-font-bold tw-text-slate-50">{ex.name}</h3>
              <ul className="tw-mt-2 tw-text-sm tw-space-y-1 tw-text-slate-400">
                {hist.map((entry, i) => (
                  <li key={i}>
                    {entry.date}: {entry.weight} kg
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {onExport != null && (
        <div className="tw-px-4 tw-pb-4">
          <button
            type="button"
            className="tw-w-full tw-py-3 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-surface/80 tw-text-slate-50 tw-text-sm tw-font-medium touch-target"
            onClick={onExport}
          >
            Exportar JSON
          </button>
        </div>
      )}
    </div>
  );
}
