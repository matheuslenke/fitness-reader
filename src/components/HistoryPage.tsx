import { useState } from "react";
import type { Exercise, Series } from "../types/fitness";

interface HistoryPageProps {
  exercisesFlat: Exercise[];
  series: Series;
  onBack: () => void;
  onExport?: () => void;
}

const GROUPS = ["A", "B", "C", "D", "E"];

export function HistoryPage({
  exercisesFlat,
  series,
  onBack,
  onExport,
}: HistoryPageProps) {
  const [filter, setFilter] = useState("all");
  const exerciseWeights = series?.exerciseWeights ?? {};
  const filtered =
    filter === "all"
      ? exercisesFlat
      : exercisesFlat.filter((e) => e.group === filter);
  const hasAny = filtered.some(
    (e) => (exerciseWeights[e.id] ?? []).length > 0
  );

  return (
    <div className="page-enter tw-min-h-full">
      <div className="tw-sticky tw-top-0 tw-pt-[var(--safe-top)] tw-pb-3 tw-px-4 tw-bg-zinc-100 tw-dark:tw-bg-zinc-900 tw-border-b tw-border-zinc-200 tw-dark:tw-border-zinc-800 tw-flex tw-items-center tw-justify-between tw-gap-2">
        <button
          type="button"
          className="touch-target tw-text-emerald-600 tw-dark:tw-text-emerald-400 tw-font-medium"
          onClick={onBack}
        >
          ← Voltar
        </button>
        <h1 className="tw-text-lg tw-font-semibold">
          Histórico de cargas
        </h1>
        <select
          className="tw-px-3 tw-py-2 tw-rounded-xl tw-border tw-border-zinc-300 tw-dark:tw-border-zinc-600 tw-dark:tw-bg-zinc-800 tw-text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              Grupo {g}
            </option>
          ))}
        </select>
      </div>
      <div className="tw-p-4 tw-space-y-4">
        {!hasAny && (
          <p className="tw-text-zinc-500 tw-dark:tw-text-zinc-400 tw-text-center tw-py-8">
            Nenhum registro de carga ainda.
          </p>
        )}
        {filtered.map((ex) => {
          const hist = (exerciseWeights[ex.id] ?? []).slice(0, 10);
          if (hist.length === 0) return null;
          return (
            <div
              key={ex.id}
              className="tw-bg-white tw-dark:tw-bg-zinc-800 tw-rounded-2xl tw-p-4 tw-border tw-border-zinc-200 tw-dark:tw-border-zinc-700"
            >
              <p className="tw-font-medium tw-text-sm tw-text-zinc-500 tw-dark:tw-text-zinc-400">
                Grupo {ex.group}
              </p>
              <h3 className="tw-font-semibold">{ex.name}</h3>
              <ul className="tw-mt-2 tw-text-sm tw-space-y-1 tw-text-zinc-600 tw-dark:tw-text-zinc-400">
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
            className="tw-w-full tw-py-3 tw-rounded-xl tw-border tw-border-zinc-300 tw-dark:tw-border-zinc-600 tw-text-sm tw-font-medium touch-target"
            onClick={onExport}
          >
            Exportar JSON
          </button>
        </div>
      )}
    </div>
  );
}
