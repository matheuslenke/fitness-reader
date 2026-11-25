import type { AppData, PlanTemplate, Series } from "../types/fitness";
import { formatDate } from "../lib/utils";
import { ActivityIndicator } from "./LoadingScreen";
import { SeriesList } from "./SeriesList";

interface MorePageProps {
  data: AppData;
  templates: PlanTemplate[];
  onSelectSeries: (id: string) => void;
  onEditSeries: (series: Series) => void;
  onOpenSeriesModal: () => void;
  onCreateFromTemplate: (templateId: string) => void;
  onEditTemplate: (template: PlanTemplate) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isExporting: boolean;
  isImporting: boolean;
}

export function MorePage({
  data,
  templates,
  onSelectSeries,
  onEditSeries,
  onOpenSeriesModal,
  onCreateFromTemplate,
  onEditTemplate,
  onExport,
  onImport,
  isExporting,
  isImporting,
}: MorePageProps) {
  return (
    <div className="page-enter tw-min-h-full tw-pb-5">
      <header className="tw-pt-[calc(var(--safe-top)+1rem)] tw-px-4 tw-pb-6">
        <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary">
          Organizar
        </p>
        <h1 className="tw-mt-1 tw-font-display tw-text-3xl tw-font-extrabold tw-text-slate-50">
          Treinos e dados
        </h1>
        <p className="tw-mt-2 tw-max-w-xl tw-text-sm tw-text-slate-400 tw-text-pretty">
          Gerencie suas séries, escolha um plano e mantenha uma cópia dos seus dados.
        </p>
      </header>

      <SeriesList
        series={data.series}
        onSelect={onSelectSeries}
        onEdit={onEditSeries}
        onCreate={onOpenSeriesModal}
      />

      <section className="tw-px-4 tw-mt-8">
        <div className="tw-flex tw-items-end tw-justify-between tw-gap-3">
          <div>
            <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-slate-500">
              Biblioteca
            </p>
            <h2 className="tw-mt-1 tw-font-display tw-text-xl tw-font-bold tw-text-slate-50">
              Planos disponíveis
            </h2>
          </div>
          <span className="tw-text-xs tw-text-slate-500 tabular-nums">
            {templates.length} plano{templates.length === 1 ? "" : "s"}
          </span>
        </div>

        {templates.length === 0 ? (
          <div className="app-card tw-mt-3 tw-rounded-3xl tw-p-6 tw-text-center">
            <p className="tw-text-sm tw-text-slate-400">
              Importe uma biblioteca de planos para começar.
            </p>
          </div>
        ) : (
          <div className="tw-mt-3 tw-space-y-3">
            {templates.map((template) => {
              const groupCount = template.groups?.length ?? 0;
              const exerciseCount = (template.groups ?? []).reduce(
                (count, group) => count + (group.exercises?.length ?? 0),
                0,
              );
              const formattedCreationDate = formatDate(template.createdAt);

              return (
                <article
                  key={template.id}
                  className="app-card tw-rounded-3xl tw-p-4"
                >
                  <div className="tw-flex tw-items-start tw-gap-3">
                    <div className="tw-grid tw-h-12 tw-w-12 tw-shrink-0 tw-place-items-center tw-rounded-2xl tw-bg-primary-dim tw-font-display tw-text-lg tw-font-extrabold tw-text-primary">
                      {groupCount}
                    </div>
                    <div className="tw-min-w-0 tw-flex-1">
                      <h3 className="tw-text-pretty tw-font-display tw-font-bold tw-text-slate-50">
                        {template.name}
                      </h3>
                      <p className="tabular-nums tw-mt-0.5 tw-text-xs tw-text-slate-400">
                        {groupCount} grupos · {exerciseCount} exercícios
                      </p>
                      <p className="tabular-nums tw-mt-1 tw-text-xs tw-text-slate-500">
                        {formattedCreationDate
                          ? `Criado em ${formattedCreationDate}`
                          : "Data de criação não informada"}
                      </p>
                    </div>
                  </div>
                  <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-2">
                    <button
                      type="button"
                      className="touch-target tw-rounded-xl tw-bg-slate-800/80 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-slate-200 tw-shadow-[inset_0_0_0_1px_rgba(148,163,184,0.14)] tw-transition-transform active:tw-scale-[0.96]"
                      onClick={() => onEditTemplate(template)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="touch-target tw-rounded-xl tw-bg-slate-900/55 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary tw-shadow-[inset_0_0_0_1px_rgba(190,242,100,0.16)] tw-transition-transform active:tw-scale-[0.96]"
                      onClick={() => onCreateFromTemplate(template.id)}
                    >
                      Usar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="tw-px-4 tw-mt-8">
        <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-slate-500">
          Seus dados
        </p>
        <h2 className="tw-mt-1 tw-font-display tw-text-xl tw-font-bold tw-text-slate-50">
          Importar e exportar
        </h2>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3 tw-mt-3">
          <button
            type="button"
            className="touch-target app-card tw-gap-2 tw-rounded-2xl tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-slate-100 tw-transition-transform active:tw-scale-[0.96] disabled:tw-cursor-wait disabled:tw-opacity-60"
            onClick={onExport}
            disabled={isExporting}
            aria-busy={isExporting}
          >
            {isExporting && <ActivityIndicator />}
            {isExporting ? "Exportando…" : "Exportar JSON"}
          </button>
          <label
            className={`touch-target app-card tw-gap-2 tw-rounded-2xl tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-slate-100 tw-transition-transform active:tw-scale-[0.96] ${
              isImporting ? "tw-pointer-events-none tw-opacity-60" : "tw-cursor-pointer"
            }`}
            aria-busy={isImporting}
          >
            {isImporting && <ActivityIndicator />}
            <span>{isImporting ? "Importando…" : "Importar JSON"}</span>
            <input
              type="file"
              accept=".json,application/json"
              className="tw-hidden"
              disabled={isImporting}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
