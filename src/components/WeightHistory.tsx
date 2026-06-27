import type { WeightEntry } from "../types/fitness";
import { formatDate } from "../lib/utils";

interface WeightHistoryProps {
  entries: WeightEntry[];
  limit?: number;
}

export function WeightHistory({ entries, limit = 3 }: WeightHistoryProps) {
  const recentEntries = entries.slice(0, limit);
  const latest = recentEntries[0]?.weight;
  const previous = recentEntries[1]?.weight;
  const change =
    latest != null && previous != null ? Number((latest - previous).toFixed(1)) : null;

  return (
    <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-slate-700/60">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-2">
        <p className="tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-slate-500">
          Histórico de cargas
        </p>
        {change != null && change !== 0 && (
          <span
            className={`tw-text-xs tw-font-semibold tabular-nums ${
              change > 0 ? "tw-text-primary" : "tw-text-amber-300"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change} kg
          </span>
        )}
      </div>

      {recentEntries.length === 0 ? (
        <p className="tw-text-xs tw-text-slate-500 tw-text-pretty">
          A primeira carga registrada aparecerá aqui.
        </p>
      ) : (
        <ol className="tw-flex tw-gap-2 tw-overflow-x-auto tw-pb-1" aria-label="Cargas recentes">
          {recentEntries.map((entry, index) => (
            <li
              key={`${entry.date}-${entry.weight}-${index}`}
              className="tw-min-w-[5.25rem] tw-rounded-xl tw-bg-slate-900/55 tw-px-3 tw-py-2 tw-shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]"
            >
              <p className="tw-text-sm tw-font-bold tw-text-slate-100 tabular-nums">
                {entry.weight} kg
              </p>
              <time
                dateTime={entry.date}
                className="tw-mt-0.5 tw-block tw-text-[0.65rem] tw-text-slate-500 tabular-nums"
              >
                {formatDate(entry.date)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
