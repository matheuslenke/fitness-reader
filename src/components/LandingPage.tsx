import { useMemo } from "react";
import type { AppData, Exercise, PlanTemplate, Series } from "../types/fitness";
import { getGlobalMetrics, getCurrentExerciseWeight } from "../lib/storage";
import { formatDate } from "../lib/utils";
import { ProfileHeader } from "./ProfileHeader";
import { GlobalMetricsCards } from "./GlobalMetricsCards";
import { ProgressGallery } from "./ProgressGallery";
import { SeriesList } from "./SeriesList";
import { ExerciseCard } from "./ExerciseCard";

interface LandingPageProps {
  data: AppData;
  activeSeries: Series | null;
  templates: PlanTemplate[];
  onSelectSeries: (id: string) => void;
  onOpenMetricsModal: () => void;
  onGoToMetrics: () => void;
  onOpenSeriesModal: () => void;
  onCreateFromTemplate: (templateId: string) => void;
  onEditSeries: (s: Series) => void;
  onPlayVideo: (url: string) => void;
  onEditWeightInSeries: (ex: Exercise, seriesId: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isExporting: boolean;
  isImporting: boolean;
  onOpenPhotoModal: () => void;
}

const statusLabel: Record<string, string> = {
  active: "Ativa",
  completed: "Concluída",
  archived: "Arquivada",
};

const statusClass: Record<string, string> = {
  active: "tw-bg-primary-dim tw-text-primary tw-border tw-border-primary/30",
  completed: "tw-bg-slate-700/50 tw-text-slate-300 tw-border tw-border-slate-600/50",
  archived: "tw-bg-slate-700/30 tw-text-slate-400 tw-border tw-border-slate-600/30",
};

export function LandingPage({
  data,
  activeSeries,
  templates,
  onSelectSeries,
  onOpenMetricsModal,
  onGoToMetrics,
  onOpenSeriesModal,
  onCreateFromTemplate,
  onEditSeries,
  onPlayVideo,
  onEditWeightInSeries,
  onExport,
  onImport,
  isExporting,
  isImporting,
  onOpenPhotoModal,
}: LandingPageProps) {
  const global = getGlobalMetrics(data);
  const photos = data.profile.progressPhotos ?? [];

  const fallbackGroups = useMemo(
    () => templates[0]?.groups?.map((g) => g.group) ?? ["A", "B", "C", "D", "E"],
    [templates]
  );
  const fallbackExercisesByGroup = useMemo(() => {
    const m: Record<string, Exercise[]> = {};
    for (const g of templates[0]?.groups ?? []) {
      m[g.group] = g.exercises ?? [];
    }
    return m;
  }, [templates]);

  const activeGroups = useMemo(
    () =>
      activeSeries?.exercisesByGroup && Object.keys(activeSeries.exercisesByGroup).length > 0
        ? Object.keys(activeSeries.exercisesByGroup)
        : fallbackGroups,
    [activeSeries, fallbackGroups]
  );
  const activeExercisesByGroup = useMemo(() => {
    return activeSeries?.exercisesByGroup ?? fallbackExercisesByGroup;
  }, [activeSeries, fallbackExercisesByGroup]);

  return (
    <div className="tw-min-h-full page-enter tw-relative tw-overflow-hidden">
      <div className="hero-spark one" aria-hidden />
      <div className="hero-spark two" aria-hidden />
      <ProfileHeader name={data.profile.name} />
      <GlobalMetricsCards
        weight={global.weight}
        bodyFat={global.bodyFat}
        exerciseCount={global.exerciseCount}
      />
      <div className="tw-flex tw-flex-wrap tw-gap-3 tw-justify-center tw-mb-4 tw-px-4">
        <button
          type="button"
          className="touch-target tw-px-5 tw-py-2 tw-rounded-2xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold tw-shadow-lg hover:tw-scale-[1.02] tw-transition-transform"
          onClick={onOpenMetricsModal}
        >
          Registro rápido
        </button>
        <button
          type="button"
          className="touch-target tw-px-5 tw-py-2 tw-rounded-2xl tw-border tw-border-slate-500/50 tw-text-slate-50 tw-text-sm tw-uppercase tw-tracking-[0.2em]"
          onClick={onGoToMetrics}
        >
          Métricas
        </button>
        <button
          type="button"
          className="touch-target tw-px-5 tw-py-2 tw-rounded-2xl tw-border tw-border-slate-500/50 tw-text-slate-50 tw-text-sm tw-uppercase tw-tracking-[0.2em]"
          onClick={onOpenPhotoModal}
        >
          Fotos
        </button>
      </div>

      {/* 1. Progress */}
      <ProgressGallery photos={photos} onAdd={onOpenPhotoModal} />

      {/* 2. Current series */}
      <section className="tw-px-4 tw-mt-6 tw-space-y-3">
        <h2 className="tw-font-display tw-text-lg tw-font-bold tw-text-slate-50">
          Série atual
        </h2>
        {activeSeries == null ? (
          <div className="tw-bg-surface tw-rounded-2xl tw-p-6 tw-text-center tw-border tw-border-slate-700/50">
            <p className="tw-text-slate-400 tw-mb-3">
              Nenhuma série ativa. Crie uma nova ou edite uma existente e marque como &quot;Ativa&quot;.
            </p>
            <button
              type="button"
              className="touch-target tw-px-4 tw-py-2 tw-rounded-xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold tw-text-sm"
              onClick={onOpenSeriesModal}
            >
              Nova série
            </button>
          </div>
        ) : (
          <div className="tw-bg-surface tw-rounded-2xl tw-border tw-border-slate-700/50 tw-overflow-hidden">
            <div className="tw-p-4 tw-border-b tw-border-slate-700/50 tw-flex tw-items-start tw-justify-between tw-gap-3">
              <div>
                <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                  <h3 className="tw-font-display tw-font-bold tw-text-slate-50">
                    {activeSeries.name}
                  </h3>
                  <span
                    className={`tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full tw-font-medium ${
                      statusClass[activeSeries.status] ?? statusClass.archived
                    }`}
                  >
                    {statusLabel[activeSeries.status] ?? activeSeries.status}
                  </span>
                </div>
                <p className="tw-text-sm tw-text-slate-400 tw-mt-1">
                  {formatDate(activeSeries.startDate)} – {formatDate(activeSeries.endDate)}
                </p>
              </div>
              <button
                type="button"
                className="touch-target tw-px-3 tw-py-1.5 tw-rounded-xl tw-bg-slate-700/80 tw-text-slate-50 tw-text-sm tw-font-medium tw-shrink-0"
                onClick={() => onSelectSeries(activeSeries.id)}
              >
                Abrir treino
              </button>
            </div>
            <div className="tw-p-4 tw-space-y-4">
              {activeGroups.map((group) => {
                const exercises = activeExercisesByGroup[group] ?? [];
                if (exercises.length === 0) return null;
                return (
                  <div key={group}>
                    <h4 className="tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-2">
                      Grupo {group}
                    </h4>
                    <div className="tw-space-y-3">
                      {exercises.map((ex) => (
                        <ExerciseCard
                          key={ex.id}
                          exercise={ex}
                          currentWeight={getCurrentExerciseWeight(activeSeries, ex.id)}
                          onPlayVideo={onPlayVideo}
                          onEditWeight={(ex) => onEditWeightInSeries(ex, activeSeries.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. Series list (instances) + Library */}
      <SeriesList
        series={data.series}
        onSelect={onSelectSeries}
        onEdit={onEditSeries}
        onCreate={onOpenSeriesModal}
      />

      {/* Series library (templates) */}
      <section className="tw-px-4 tw-mt-6 tw-space-y-3">
        <h2 className="tw-font-display tw-text-lg tw-font-bold tw-text-slate-50">
          Biblioteca de planos
        </h2>
        {templates.length === 0 ? (
          <div className="tw-bg-surface tw-rounded-2xl tw-p-6 tw-text-center tw-border tw-border-slate-700/50">
            <p className="tw-text-slate-400">
              Nenhum plano. Importe um JSON de templates para começar.
            </p>
          </div>
        ) : (
          <div className="tw-space-y-3">
            {templates.map((t) => {
              const groupCount = t.groups?.length ?? 0;
              const exerciseCount = (t.groups ?? []).reduce(
                (acc, g) => acc + (g.exercises?.length ?? 0),
                0
              );
              return (
                <div
                  key={t.id}
                  className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-border tw-border-slate-700/50 tw-flex tw-items-center tw-justify-between tw-gap-3"
                >
                  <div className="tw-flex-1 tw-min-w-0">
                    <h3 className="tw-font-display tw-font-bold tw-text-slate-50">
                      {t.name}
                    </h3>
                    <p className="tw-text-sm tw-text-slate-400 tw-mt-0.5">
                      {groupCount} grupos · {exerciseCount} exercícios
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="tw-px-4 tw-py-6 tw-flex tw-flex-wrap tw-gap-3 tw-justify-center tw-text-sm tw-text-slate-400">
        <button
          type="button"
          className={`touch-target tw-px-4 tw-py-2 tw-rounded-full tw-border tw-border-slate-500/50 tw-bg-surface/80 tw-text-slate-50 tw-text-sm tw-opacity-100 disabled:tw-opacity-60`}
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting ? "Exportando…" : "Exportar dados"}
        </button>
        <label
          className={`tw-px-4 tw-py-2 tw-rounded-full tw-border tw-border-slate-500/50 tw-bg-surface/80 tw-text-slate-50 tw-text-sm touch-target ${
            isImporting ? "tw-opacity-60 tw-pointer-events-none" : "tw-cursor-pointer"
          }`}
        >
          {isImporting ? "Importando…" : "Importar dados"}
          <input
            type="file"
            accept=".json,application/json"
            className="tw-hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = "";
            }}
            disabled={isImporting}
          />
        </label>
      </div>
    </div>
  );
}
