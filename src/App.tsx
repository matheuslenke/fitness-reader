import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { AppData, Exercise, ExerciseLibrary, Series, ToastState } from "./types/fitness";
import {
  loadAppData,
  saveAppData,
  ensureProfileExtras,
  getSeriesById,
  createSeries,
  updateSeries,
  deleteSeries,
  addProfileMetric,
  addSeriesMetric,
  addProgressPhoto,
  addExerciseWeightEntry,
  getGlobalMetrics,
  getCurrentExerciseWeight,
  loadExerciseLibrary,
  saveExerciseLibrary,
} from "./lib/storage";
import { formatDate } from "./lib/utils";
import { LandingPage } from "./components/LandingPage";
import { MetricsPage } from "./components/MetricsPage";
import { HistoryPage } from "./components/HistoryPage";
import { TabBar } from "./components/TabBar";
import { ExerciseCard } from "./components/ExerciseCard";
import { VideoModal } from "./components/VideoModal";
import { WeightModal } from "./components/WeightModal";
import { SeriesManagerModal } from "./components/SeriesManagerModal";
import { MetricsModal } from "./components/MetricsModal";
import { ProgressPhotoModal } from "./components/ProgressPhotoModal";
import { Toast } from "./components/Toast";

type ViewKey = "landing" | "series" | "metrics" | "history";

function App() {
  const [data, setData] = useState<AppData>(loadAppData);
  const [exerciseData, setExerciseData] = useState<ExerciseLibrary>(
    loadExerciseLibrary
  );
  const [view, setView] = useState<ViewKey>("landing");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState("A");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [weightExercise, setWeightExercise] = useState<Exercise | null>(null);
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const [seriesToEdit, setSeriesToEdit] = useState<Series | null>(null);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = exerciseData.groups ?? [];
  const exercisesFlat = useMemo(
    () => groups.flatMap((g) => g.exercises ?? []),
    [groups]
  );
  const currentSeries = selectedSeriesId
    ? getSeriesById(data, selectedSeriesId)
    : null;
  const currentExercises = useMemo(
    () => groups.find((g) => g.group === activeGroup)?.exercises ?? [],
    [activeGroup, groups]
  );
  const global = getGlobalMetrics(data);

  const showToast = useCallback(
    (text: string, type: ToastState["type"] = "info", duration = 3200) => {
      if (toastTimer.current != null) clearTimeout(toastTimer.current);
      setToast({ text, type });
      toastTimer.current = setTimeout(() => setToast(null), duration);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current != null) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleSaveWeight = useCallback(
    (exerciseId: string, weight: number) => {
      if (selectedSeriesId == null) return;
      setData((prev) =>
        addExerciseWeightEntry(prev, selectedSeriesId, exerciseId, weight)
      );
    },
    [selectedSeriesId]
  );

  const handleSeriesSave = useCallback(
    (payload: {
      name: string;
      startDate: string;
      endDate: string;
      status: Series["status"];
    }) => {
      setData((prev) => {
        if (seriesToEdit != null) {
          return updateSeries(prev, seriesToEdit.id, payload);
        }
        return createSeries(prev, payload);
      });
      setSeriesModalOpen(false);
      setSeriesToEdit(null);
    },
    [seriesToEdit]
  );

  const handleSeriesDelete = useCallback(
    (id: string) => {
      setData((prev) => {
        const next = deleteSeries(prev, id);
        if (selectedSeriesId === id) {
          setSelectedSeriesId(null);
          setView("landing");
        }
        return next;
      });
      setSeriesToEdit(null);
      setSeriesModalOpen(false);
    },
    [selectedSeriesId]
  );

  const handleProgressPhoto = useCallback(
    (photo: { date: string; note: string; src: string }) => {
      setData((prev) => addProgressPhoto(prev, photo));
      showToast("Foto adicionada com sucesso.", "success");
    },
    [showToast]
  );

  const handleMetricsSave = useCallback(
    (bodyWeight: number, bodyFatPercent: number | null) => {
      setData((prev) => {
        let next = addProfileMetric(prev, bodyWeight, bodyFatPercent);
        if (
          view === "series" &&
          selectedSeriesId != null
        ) {
          next = addSeriesMetric(
            next,
            selectedSeriesId,
            bodyWeight,
            bodyFatPercent
          );
        }
        return next;
      });
      setMetricsModalOpen(false);
    },
    [selectedSeriesId, view]
  );

  const handleExport = useCallback(() => {
    setIsExporting(true);
    showToast("Gerando exportação...", "info");
    setTimeout(() => {
      try {
        const payload = JSON.stringify(
          { profile: data.profile, series: data.series },
          null,
          2
        );
        const blob = new Blob([payload], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "treino-dados.json";
        a.click();
        URL.revokeObjectURL(a.href);
        showToast("Exportação concluída!", "success");
      } catch {
        showToast("Erro ao exportar os dados.", "error");
      } finally {
        setIsExporting(false);
      }
    }, 350);
  }, [data, showToast]);

  const handleImport = useCallback(
    (file: File) => {
      setIsImporting(true);
      showToast("Validando arquivo...", "info");
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result as string) as
            | AppData
            | ExerciseLibrary;
          if (
            imported != null &&
            "profile" in imported &&
            Array.isArray((imported as AppData).series)
          ) {
            const next = ensureProfileExtras(imported as AppData);
            saveAppData(next);
            setData(next);
            setView("landing");
            showToast("Dados importados com sucesso!", "success");
          } else if (
            imported != null &&
            Array.isArray((imported as ExerciseLibrary).groups)
          ) {
            saveExerciseLibrary(imported as ExerciseLibrary);
            setExerciseData(imported as ExerciseLibrary);
            showToast("Biblioteca de exercícios atualizada!", "success");
          } else {
            showToast("Formato inválido.", "error");
          }
        } catch {
          showToast("Não foi possível ler o arquivo.", "error");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    },
    [showToast]
  );

  return (
    <>
      {view === "landing" && (
        <LandingPage
          data={data}
          onSelectSeries={(id) => {
            setSelectedSeriesId(id);
            setView("series");
            setActiveGroup("A");
          }}
          onOpenMetricsModal={() => setMetricsModalOpen(true)}
          onGoToMetrics={() => setView("metrics")}
          onOpenSeriesModal={() => {
            setSeriesToEdit(null);
            setSeriesModalOpen(true);
          }}
          onEditSeries={(s) => {
            setSeriesToEdit(s);
            setSeriesModalOpen(true);
          }}
          onExport={handleExport}
          onImport={handleImport}
          isExporting={isExporting}
          isImporting={isImporting}
          onOpenPhotoModal={() => setPhotoModalOpen(true)}
        />
      )}

      {view === "series" && currentSeries != null && (
        <div className="page-enter">
          <header className="tw-sticky tw-top-0 tw-z-10 tw-pt-[var(--safe-top)] tw-px-4 tw-py-3 tw-bg-gradient-to-b tw-from-background tw-to-background/95 tw-border-b tw-border-slate-700/50 tw-flex tw-items-center tw-justify-between tw-gap-2">
            <button
              type="button"
              className="touch-target tw-text-primary tw-font-medium"
              onClick={() => {
                setView("landing");
                setSelectedSeriesId(null);
              }}
            >
              ← Série
            </button>
            <div className="tw-flex-1 tw-min-w-0 tw-text-center">
              <h1 className="tw-font-display tw-text-lg tw-font-bold tw-truncate tw-text-slate-50">
                {currentSeries.name}
              </h1>
              <p className="tw-text-xs tw-text-slate-400">
                {formatDate(currentSeries.startDate)} –{" "}
                {formatDate(currentSeries.endDate)}
              </p>
            </div>
            <div className="tw-flex tw-items-center tw-gap-1">
              <button
                type="button"
                className="touch-target tw-w-9 tw-h-9 tw-rounded-lg tw-bg-surface tw-border tw-border-slate-600/50 tw-text-slate-300 tw-text-sm"
                onClick={() => setMetricsModalOpen(true)}
                aria-label="Peso"
              >
                ⚖
              </button>
              <button
                type="button"
                className="touch-target tw-text-secondary tw-font-medium"
                onClick={() => setView("history")}
              >
                Histórico
              </button>
            </div>
          </header>
          <main className="tw-p-4 tw-space-y-4">
            <TabBar active={activeGroup} onChange={setActiveGroup} />
            <div className="tw-space-y-3">
              {currentExercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  currentWeight={getCurrentExerciseWeight(currentSeries, ex.id)}
                  onPlayVideo={setVideoUrl}
                  onEditWeight={setWeightExercise}
                />
              ))}
            </div>
          </main>
        </div>
      )}

      {view === "metrics" && (
        <MetricsPage
          data={data}
          onBack={() => setView("landing")}
          onOpenMetricsModal={() => setMetricsModalOpen(true)}
        />
      )}

      {view === "history" && currentSeries != null && (
        <HistoryPage
          exercisesFlat={exercisesFlat}
          series={currentSeries}
          onBack={() => setView("series")}
          onExport={handleExport}
        />
      )}

      <VideoModal
        open={videoUrl != null}
        url={videoUrl}
        onClose={() => setVideoUrl(null)}
      />
      <WeightModal
        open={weightExercise != null}
        exercise={weightExercise}
        series={currentSeries}
        currentWeight={
          weightExercise != null && currentSeries != null
            ? getCurrentExerciseWeight(currentSeries, weightExercise.id)
            : ""
        }
        onClose={() => setWeightExercise(null)}
        onSave={handleSaveWeight}
      />
      <SeriesManagerModal
        open={seriesModalOpen}
        onClose={() => {
          setSeriesModalOpen(false);
          setSeriesToEdit(null);
        }}
        series={seriesToEdit}
        onSave={handleSeriesSave}
        onDelete={handleSeriesDelete}
      />
      <MetricsModal
        open={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
        onSave={handleMetricsSave}
        initialWeight={global.weight}
        initialBodyFat={global.bodyFat}
      />
      <ProgressPhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onSave={handleProgressPhoto}
      />
      <Toast toast={toast} />
    </>
  );
}

export default App;
