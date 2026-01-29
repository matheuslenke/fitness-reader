import type { AppData, Series } from "../types/fitness";
import { getGlobalMetrics } from "../lib/storage";
import { ProfileHeader } from "./ProfileHeader";
import { GlobalMetricsCards } from "./GlobalMetricsCards";
import { ProgressGallery } from "./ProgressGallery";
import { SeriesList } from "./SeriesList";

interface LandingPageProps {
  data: AppData;
  onSelectSeries: (id: string) => void;
  onOpenMetricsModal: () => void;
  onGoToMetrics: () => void;
  onOpenSeriesModal: () => void;
  onEditSeries: (s: Series) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isExporting: boolean;
  isImporting: boolean;
  onOpenPhotoModal: () => void;
}

export function LandingPage({
  data,
  onSelectSeries,
  onOpenMetricsModal,
  onGoToMetrics,
  onOpenSeriesModal,
  onEditSeries,
  onExport,
  onImport,
  isExporting,
  isImporting,
  onOpenPhotoModal,
}: LandingPageProps) {
  const global = getGlobalMetrics(data);
  const photos = data.profile.progressPhotos ?? [];

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
      <ProgressGallery photos={photos} onAdd={onOpenPhotoModal} />
      <SeriesList
        series={data.series}
        onSelect={onSelectSeries}
        onEdit={onEditSeries}
        onCreate={onOpenSeriesModal}
      />
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
