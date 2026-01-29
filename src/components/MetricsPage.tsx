import type { AppData } from "../types/fitness";
import { getGlobalMetrics } from "../lib/storage";
import { formatDate } from "../lib/utils";
import { SimpleLineChart } from "./SimpleLineChart";

interface MetricsPageProps {
  data: AppData;
  onBack: () => void;
  onOpenMetricsModal: () => void;
}

export function MetricsPage({
  data,
  onBack,
  onOpenMetricsModal,
}: MetricsPageProps) {
  const global = getGlobalMetrics(data);
  const allMetrics = global.allMetrics ?? [];
  const weightData = allMetrics
    .filter((m) => m.bodyWeight != null)
    .map((m) => ({ ...m, date: m.date }));
  const bodyFatData = allMetrics
    .filter((m) => m.bodyFatPercent != null)
    .map((m) => ({ ...m, date: m.date }));

  return (
    <div className="page-enter tw-min-h-full">
      <div className="tw-sticky tw-top-0 tw-z-10 tw-pt-[var(--safe-top)] tw-px-4 tw-py-3 tw-bg-gradient-to-b tw-from-background tw-to-background/95 tw-border-b tw-border-slate-700/50 tw-flex tw-items-center tw-justify-between">
        <button
          type="button"
          className="touch-target tw-text-primary tw-font-medium"
          onClick={onBack}
        >
          ← Voltar
        </button>
        <h1 className="tw-font-display tw-text-lg tw-font-bold tw-text-slate-50">Métricas</h1>
        <button
          type="button"
          className="touch-target tw-text-sm tw-font-medium tw-text-secondary"
          onClick={onOpenMetricsModal}
        >
          + Peso
        </button>
      </div>
      <div className="tw-p-4 tw-space-y-6">
        <div className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-border tw-border-slate-700/50 tw-shadow-lg">
          <h2 className="tw-font-display tw-font-bold tw-text-slate-50">
            Peso (kg)
          </h2>
          <div className="tw-mt-2 tw-h-32">
            <SimpleLineChart
              data={weightData}
              valueKey="bodyWeight"
              labelKey="date"
              color="#bef264"
            />
          </div>
        </div>
        <div className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-border tw-border-slate-700/50 tw-shadow-lg">
          <h2 className="tw-font-display tw-font-bold tw-text-slate-50">
            Gordura corporal (%)
          </h2>
          <div className="tw-mt-2 tw-h-32">
            <SimpleLineChart
              data={bodyFatData}
              valueKey="bodyFatPercent"
              labelKey="date"
              color="#a855f7"
            />
          </div>
        </div>
        <div className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-border tw-border-slate-700/50 tw-shadow-lg">
          <h2 className="tw-font-display tw-font-bold tw-text-slate-50 tw-mb-2">
            Por série
          </h2>
          {data.series.length === 0 ? (
            <p className="tw-text-sm tw-text-slate-400">
              Nenhuma série com métricas.
            </p>
          ) : (
            <ul className="tw-space-y-3">
              {data.series.map((s) => {
                const m = (s.metrics ?? []).slice(0, 5);
                const last = m[0];
                return (
                  <li
                    key={s.id}
                    className="tw-border-b tw-border-slate-600/50 tw-pb-2 last:tw-border-0"
                  >
                    <p className="tw-font-medium tw-text-sm tw-text-slate-50">{s.name}</p>
                    <p className="tw-text-xs tw-text-slate-400">
                      {formatDate(s.startDate)} – {formatDate(s.endDate)}
                    </p>
                    {last != null ? (
                      <p className="tw-text-sm tw-mt-1 tw-text-slate-300">
                        Último: {last.bodyWeight} kg
                        {last.bodyFatPercent != null
                          ? ` · ${last.bodyFatPercent}% gordura`
                          : ""}
                      </p>
                    ) : (
                      <p className="tw-text-sm tw-text-slate-400 tw-mt-1">
                        Sem registros
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
