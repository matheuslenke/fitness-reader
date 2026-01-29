import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type {
  AppData,
  Exercise,
  ExerciseLibrary,
  Series,
  TemplateLibrary,
  ToastState,
  ViewKey,
} from "./types/fitness";
import {
  loadAppData,
  saveAppData,
  ensureProfileExtras,
  getSeriesById,
  createSeries,
  updateSeries,
  deleteSeries,
  createSession,
  updateSessionStatus,
  updateSessionExercise,
  addProfileMetric,
  addSeriesMetric,
  addProgressPhoto,
  addExerciseWeightEntry,
  getGlobalMetrics,
  getCurrentExerciseWeight,
  loadTemplateLibrary,
  saveTemplateLibrary,
  exerciseLibraryToTemplateLibrary,
  applyTemplateToSeries,
} from "./lib/storage";
import type { SeriesManagerSavePayload } from "./components/SeriesManagerModal";
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
import { SessionsPage } from "./components/SessionsPage";
import { SessionTrackerPage } from "./components/SessionTrackerPage";

function App() {
  const [data, setData] = useState<AppData>(loadAppData);
  const [templateLibrary, setTemplateLibrary] = useState<TemplateLibrary>(
    loadTemplateLibrary
  );
  const [view, setView] = useState<ViewKey>("landing");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState("A");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [weightExercise, setWeightExercise] = useState<Exercise | null>(null);
  const [weightModalSeriesId, setWeightModalSeriesId] = useState<string | null>(null);
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const [seriesToEdit, setSeriesToEdit] = useState<Series | null>(null);
  const [defaultTemplateIdForModal, setDefaultTemplateIdForModal] = useState<string | null>(null);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const templates = templateLibrary.templates ?? [];
  const fallbackGroups = useMemo(
    () =>
      templates[0]?.groups?.map((g) => g.group) ?? ["A", "B", "C", "D", "E"],
    [templates]
  );
  const fallbackExercisesByGroup = useMemo(() => {
    const m: Record<string, Exercise[]> = {};
    for (const g of templates[0]?.groups ?? []) {
      m[g.group] = g.exercises ?? [];
    }
    return m;
  }, [templates]);

  const currentSeries = selectedSeriesId
    ? getSeriesById(data, selectedSeriesId)
    : null;
  const seriesGroups = useMemo(
    () =>
      currentSeries?.exercisesByGroup &&
      Object.keys(currentSeries.exercisesByGroup).length > 0
        ? Object.keys(currentSeries.exercisesByGroup)
        : fallbackGroups,
    [currentSeries, fallbackGroups]
  );
  const currentExercises = useMemo(() => {
    const byGroup = currentSeries?.exercisesByGroup ?? fallbackExercisesByGroup;
    return byGroup[activeGroup] ?? [];
  }, [currentSeries, activeGroup, fallbackExercisesByGroup]);
  const exercisesFlat = useMemo(() => {
    const byGroup = currentSeries?.exercisesByGroup ?? fallbackExercisesByGroup;
    return Object.values(byGroup).flat();
  }, [currentSeries, fallbackExercisesByGroup]);
  const global = getGlobalMetrics(data);
  const activeSeries = useMemo(
    () => data.series.find((s) => s.status === "active") ?? null,
    [data.series]
  );

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
      const sid = weightModalSeriesId ?? selectedSeriesId;
      if (sid == null) return;
      setData((prev) =>
        addExerciseWeightEntry(prev, sid, exerciseId, weight)
      );
    },
    [weightModalSeriesId, selectedSeriesId]
  );

  const openWeightModal = useCallback((ex: Exercise, seriesId: string) => {
    setWeightModalSeriesId(seriesId);
    setWeightExercise(ex);
  }, []);

  const closeWeightModal = useCallback(() => {
    setWeightExercise(null);
    setWeightModalSeriesId(null);
  }, []);

  const handleSeriesSave = useCallback(
    (payload: SeriesManagerSavePayload) => {
      setData((prev) => {
        if (seriesToEdit != null) {
          let next = prev;
          if (
            payload.templateId &&
            payload.templateId !== seriesToEdit.templateId
          ) {
            next = applyTemplateToSeries(prev, seriesToEdit.id, payload.templateId);
          }
          return updateSeries(next, seriesToEdit.id, {
            name: payload.name,
            startDate: payload.startDate,
            endDate: payload.endDate,
            status: payload.status,
          });
        }
        return createSeries(prev, {
          name: payload.name,
          startDate: payload.startDate,
          endDate: payload.endDate,
          status: payload.status,
          templateId: payload.templateId,
        });
      });
      setSeriesModalOpen(false);
      setSeriesToEdit(null);
      setDefaultTemplateIdForModal(null);
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
      setDefaultTemplateIdForModal(null);
      setSeriesModalOpen(false);
    },
    [selectedSeriesId]
  );

  const handleCreateFromTemplate = useCallback((templateId: string) => {
    setSeriesToEdit(null);
    setDefaultTemplateIdForModal(templateId);
    setSeriesModalOpen(true);
  }, []);

  const handleCloseSeriesModal = useCallback(() => {
    setSeriesModalOpen(false);
    setSeriesToEdit(null);
    setDefaultTemplateIdForModal(null);
  }, []);

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
          {
            profile: data.profile,
            series: data.series,
            sessions: data.sessions ?? [],
          },
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
            | ExerciseLibrary
            | TemplateLibrary;
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
            "templates" in imported &&
            Array.isArray((imported as TemplateLibrary).templates)
          ) {
            const lib = imported as TemplateLibrary;
            saveTemplateLibrary(lib);
            setTemplateLibrary(lib);
            showToast("Planos (templates) atualizados!", "success");
          } else if (
            imported != null &&
            Array.isArray((imported as ExerciseLibrary).groups)
          ) {
            const lib = exerciseLibraryToTemplateLibrary(
              imported as ExerciseLibrary
            );
            saveTemplateLibrary(lib);
            setTemplateLibrary(lib);
            showToast("Planos (templates) atualizados!", "success");
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

  const handleStartSession = useCallback(() => {
    if (selectedSeriesId == null) return;
    setData((prev) => {
      const next = createSession(prev, selectedSeriesId, activeGroup);
      const newSessionId = next.sessions[0]?.id ?? null;
      if (newSessionId != null) {
        setTimeout(() => {
          setSelectedSessionId(newSessionId);
          setView("session-tracker");
        }, 0);
      }
      return next;
    });
  }, [selectedSeriesId, activeGroup]);

  const handleFinishSession = useCallback((sessionId: string) => {
    setData((prev) => updateSessionStatus(prev, sessionId, "finished"));
    setView("sessions");
    setSelectedSessionId(null);
  }, []);

  const handleCancelSession = useCallback((sessionId: string) => {
    setData((prev) => updateSessionStatus(prev, sessionId, "canceled"));
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
      setView("sessions");
    }
  }, [selectedSessionId]);

  const handleUpdateSessionExercise = useCallback(
    (
      sessionId: string,
      exerciseId: string,
      payload: {
        weight?: number | null;
        status?: import("./types/fitness").SessionExerciseStatus;
      },
    ) => {
      setData((prev) =>
        updateSessionExercise(prev, sessionId, exerciseId, payload),
      );
    },
    [],
  );

  const handleSelectSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    setView("session-tracker");
  }, []);

  const handleBackFromSessionTracker = useCallback(() => {
    setSelectedSessionId(null);
    setView("sessions");
  }, []);

  const handleBackFromSessions = useCallback(() => {
    setView("landing");
  }, []);

  return (
    <>
      {view === "landing" && (
        <LandingPage
          data={data}
          onSelectSeries={(id) => {
            const s = getSeriesById(data, id);
            const gs =
              s?.exercisesByGroup && Object.keys(s.exercisesByGroup).length > 0
                ? Object.keys(s.exercisesByGroup)
                : templates[0]?.groups?.map((g) => g.group) ?? ["A", "B", "C", "D", "E"];
            setSelectedSeriesId(id);
            setView("series");
            setActiveGroup(gs[0] ?? "A");
          }}
          onOpenMetricsModal={() => setMetricsModalOpen(true)}
          onGoToMetrics={() => setView("metrics")}
          onOpenSeriesModal={() => {
            setSeriesToEdit(null);
            setDefaultTemplateIdForModal(null);
            setSeriesModalOpen(true);
          }}
          onCreateFromTemplate={handleCreateFromTemplate}
          activeSeries={activeSeries}
          templates={templates}
          onPlayVideo={setVideoUrl}
          onEditWeightInSeries={openWeightModal}
          onEditSeries={(s) => {
            setSeriesToEdit(s);
            setSeriesModalOpen(true);
          }}
          onExport={handleExport}
          onImport={handleImport}
          isExporting={isExporting}
          isImporting={isImporting}
          onOpenPhotoModal={() => setPhotoModalOpen(true)}
          onGoToSessions={() => setView("sessions")}
        />
      )}

      {view === "sessions" && (
        <SessionsPage
          data={data}
          onBack={handleBackFromSessions}
          onSelectSession={handleSelectSession}
          onCancelSession={handleCancelSession}
        />
      )}

      {view === "session-tracker" && selectedSessionId != null && (
        <SessionTrackerPage
          data={data}
          sessionId={selectedSessionId}
          onBack={handleBackFromSessionTracker}
          onFinish={handleFinishSession}
          onCancel={handleCancelSession}
          onUpdateExercise={handleUpdateSessionExercise}
          onPlayVideo={setVideoUrl}
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
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-p-3 tw-rounded-2xl tw-bg-surface tw-border tw-border-slate-700/50">
              <span className="tw-text-slate-50 tw-font-medium">
                Dia {activeGroup}
              </span>
              <button
                type="button"
                className="touch-target tw-px-4 tw-py-2 tw-rounded-xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold tw-text-sm"
                onClick={handleStartSession}
              >
                Iniciar agora
              </button>
            </div>
            <TabBar
              groups={seriesGroups}
              active={activeGroup}
              onChange={setActiveGroup}
            />
            <div className="tw-space-y-3">
              {currentExercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  currentWeight={getCurrentExerciseWeight(currentSeries, ex.id)}
                  onPlayVideo={setVideoUrl}
                  onEditWeight={(ex) => selectedSeriesId && openWeightModal(ex, selectedSeriesId)}
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
          groups={seriesGroups}
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
        series={
          weightModalSeriesId != null
            ? getSeriesById(data, weightModalSeriesId)
            : currentSeries
        }
        currentWeight={
          weightExercise != null && (weightModalSeriesId != null || currentSeries != null)
            ? getCurrentExerciseWeight(
                (weightModalSeriesId != null ? getSeriesById(data, weightModalSeriesId) : currentSeries)!,
                weightExercise.id
              )
            : ""
        }
        onClose={closeWeightModal}
        onSave={handleSaveWeight}
      />
      <SeriesManagerModal
        open={seriesModalOpen}
        onClose={handleCloseSeriesModal}
        series={seriesToEdit}
        templates={templates}
        defaultTemplateId={defaultTemplateIdForModal}
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
