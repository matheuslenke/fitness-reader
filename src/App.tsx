import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session as SupabaseSession, User } from "@supabase/supabase-js";
import { AppTabBar } from "./components/AppTabBar";
import type { PrimaryTab } from "./components/AppTabBar";
import { AuthPage } from "./components/AuthPage";
import { ExerciseCard } from "./components/ExerciseCard";
import { HistoryPage } from "./components/HistoryPage";
import { LandingPage } from "./components/LandingPage";
import { MetricsModal } from "./components/MetricsModal";
import { MorePage } from "./components/MorePage";
import { ProfilePage } from "./components/ProfilePage";
import { ProgressPhotoModal } from "./components/ProgressPhotoModal";
import { SeriesManagerModal } from "./components/SeriesManagerModal";
import { SessionsPage } from "./components/SessionsPage";
import { SessionTrackerPage } from "./components/SessionTrackerPage";
import { TabBar } from "./components/TabBar";
import { Toast } from "./components/Toast";
import { VideoModal } from "./components/VideoModal";
import { WeightModal } from "./components/WeightModal";
import type { SeriesManagerSavePayload } from "./components/SeriesManagerModal";
import {
  addExerciseWeightEntry as addExerciseWeightEntryToSnapshot,
  addProgressPhoto as addProgressPhotoToSnapshot,
  addProfileMetric,
  addSeriesMetric,
  applyTemplateToSeries,
  buildDefaultSnapshot,
  createSeries,
  createSession,
  deleteSeries as deleteSeriesFromSnapshot,
  ensureProfileExtras,
  exerciseLibraryToTemplateLibrary,
  getCurrentExerciseWeight,
  getExerciseHistory,
  getGlobalMetrics,
  getSeriesById,
  replaceAppData as replaceAppDataInSnapshot,
  replaceTemplateLibrary as replaceTemplateLibraryInSnapshot,
  updateSeries,
  updateSessionExercise as updateSessionExerciseInSnapshot,
  updateSessionStatus,
} from "./lib/storage";
import {
  getDefaultNavigationState,
  getOngoingSession,
  normalizeNavigationState,
  readStoredNavigationState,
  writeStoredNavigationState,
} from "./lib/navigation";
import {
  readSupabaseAppState,
  writeSupabaseAppState,
} from "./lib/supabaseAppState";
import { isSupabaseConfigured, requireSupabase, supabase } from "./lib/supabase";
import { formatDate } from "./lib/utils";
import type {
  AppData,
  AppSnapshot,
  Exercise,
  ExerciseLibrary,
  SessionExerciseStatus,
  Series,
  TemplateLibrary,
  ToastState,
  ViewKey,
} from "./types/fitness";

type AuthSession = {
  userId: string;
  username: string;
  user: User;
};

type TrainingAppProps = {
  authSession: AuthSession;
  onLogout: () => Promise<void>;
};

type StatusScreenProps = {
  text: string;
};

function StatusScreen({ text }: StatusScreenProps) {
  return (
    <div className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-background tw-text-slate-300">
      {text}
    </div>
  );
}

function getUserDisplayName(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown>;
  const fullName = metadata.full_name;
  const name = metadata.name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return user.email ?? "Atleta";
}

function TrainingApp({ authSession, onLogout }: TrainingAppProps) {
  const initialNavigation = useMemo(
    () =>
      readStoredNavigationState(authSession.userId) ?? getDefaultNavigationState(),
    [authSession.userId],
  );
  const [snapshot, setSnapshot] = useState<AppSnapshot | undefined>(undefined);

  const [view, setView] = useState<ViewKey>(initialNavigation.view);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(
    initialNavigation.selectedSeriesId,
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialNavigation.selectedSessionId,
  );
  const [activeGroup, setActiveGroup] = useState(initialNavigation.activeGroup);
  const [videoExercise, setVideoExercise] = useState<Exercise | null>(null);
  const [weightExercise, setWeightExercise] = useState<Exercise | null>(null);
  const [weightModalSeriesId, setWeightModalSeriesId] = useState<string | null>(
    null,
  );
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const [seriesToEdit, setSeriesToEdit] = useState<Series | null>(null);
  const [defaultTemplateIdForModal, setDefaultTemplateIdForModal] = useState<
    string | null
  >(null);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authUserRef = useRef(authSession.user);
  authUserRef.current = authSession.user;
  const navigationRef = useRef(initialNavigation);
  navigationRef.current = {
    view,
    selectedSeriesId,
    selectedSessionId,
    activeGroup,
  };

  const currentSnapshot = snapshot ?? buildDefaultSnapshot();
  const data: AppData = currentSnapshot;
  const templateLibrary = currentSnapshot.templateLibrary;
  const isLoading = snapshot === undefined;

  const templates = templateLibrary.templates ?? [];
  const fallbackGroups = useMemo(
    () =>
      templates[0]?.groups?.map((group) => group.group) ?? [
        "A",
        "B",
        "C",
        "D",
        "E",
      ],
    [templates],
  );
  const fallbackExercisesByGroup = useMemo(() => {
    const exercisesByGroup: Record<string, Exercise[]> = {};

    for (const group of templates[0]?.groups ?? []) {
      exercisesByGroup[group.group] = group.exercises ?? [];
    }

    return exercisesByGroup;
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
    [currentSeries, fallbackGroups],
  );
  const currentExercises = useMemo(() => {
    const exercisesByGroup =
      currentSeries?.exercisesByGroup ?? fallbackExercisesByGroup;
    return exercisesByGroup[activeGroup] ?? [];
  }, [activeGroup, currentSeries, fallbackExercisesByGroup]);
  const exercisesFlat = useMemo(() => {
    const exercisesByGroup =
      currentSeries?.exercisesByGroup ?? fallbackExercisesByGroup;
    return Object.values(exercisesByGroup).flat();
  }, [currentSeries, fallbackExercisesByGroup]);
  const global = getGlobalMetrics(data);
  const activeSeries = useMemo(
    () => data.series.find((series) => series.status === "active") ?? null,
    [data.series],
  );
  const ongoingSession = useMemo(
    () => getOngoingSession(currentSnapshot),
    [currentSnapshot],
  );

  const showToast = useCallback(
    (text: string, type: ToastState["type"] = "info", duration = 3200) => {
      if (toastTimer.current != null) {
        clearTimeout(toastTimer.current);
      }

      setToast({ text, type });
      toastTimer.current = setTimeout(() => setToast(null), duration);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current != null) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    setSnapshot(undefined);

    readSupabaseAppState(authUserRef.current)
      .then((nextSnapshot) => {
        if (isActive) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch(() => {
        if (isActive) {
          setSnapshot(buildDefaultSnapshot());
          showToast("Erro ao carregar dados do Supabase.", "error");
        }
      });

    return () => {
      isActive = false;
    };
  }, [authSession.userId, showToast]);

  const persistSnapshot = useCallback(
    async (nextSnapshot: AppSnapshot) => {
      const savedSnapshot = await writeSupabaseAppState(
        authSession.userId,
        nextSnapshot,
      );
      setSnapshot(savedSnapshot);
      return savedSnapshot;
    },
    [authSession.userId],
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const normalizedNavigation = normalizeNavigationState(currentSnapshot, {
      view,
      selectedSeriesId,
      selectedSessionId,
      activeGroup,
    });

    if (
      normalizedNavigation.view !== view ||
      normalizedNavigation.selectedSeriesId !== selectedSeriesId ||
      normalizedNavigation.selectedSessionId !== selectedSessionId ||
      normalizedNavigation.activeGroup !== activeGroup
    ) {
      setView(normalizedNavigation.view);
      setSelectedSeriesId(normalizedNavigation.selectedSeriesId);
      setSelectedSessionId(normalizedNavigation.selectedSessionId);
      setActiveGroup(normalizedNavigation.activeGroup);
    }
  }, [
    activeGroup,
    currentSnapshot,
    isLoading,
    selectedSeriesId,
    selectedSessionId,
    view,
  ]);

  useEffect(() => {
    const persistNavigation = () => {
      writeStoredNavigationState(authSession.userId, navigationRef.current);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistNavigation();
      }
    };

    window.addEventListener("pagehide", persistNavigation);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      persistNavigation();
      window.removeEventListener("pagehide", persistNavigation);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authSession.userId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const normalizedNavigation = normalizeNavigationState(currentSnapshot, {
      view,
      selectedSeriesId,
      selectedSessionId,
      activeGroup,
    });

    writeStoredNavigationState(authSession.userId, normalizedNavigation);
  }, [
    activeGroup,
    authSession.userId,
    currentSnapshot,
    isLoading,
    selectedSeriesId,
    selectedSessionId,
    view,
  ]);

  const handleSaveWeight = useCallback(
    async (exerciseId: string, weight: number) => {
      const seriesId = weightModalSeriesId ?? selectedSeriesId;

      if (!seriesId) {
        return;
      }

      try {
        await persistSnapshot(
          addExerciseWeightEntryToSnapshot(
            currentSnapshot,
            seriesId,
            exerciseId,
            weight,
          ),
        );
      } catch {
        showToast("Erro ao salvar a carga.", "error");
      }
    },
    [
      currentSnapshot,
      persistSnapshot,
      selectedSeriesId,
      showToast,
      weightModalSeriesId,
    ],
  );

  const openWeightModal = useCallback((exercise: Exercise, seriesId: string) => {
    setWeightModalSeriesId(seriesId);
    setWeightExercise(exercise);
  }, []);

  const closeWeightModal = useCallback(() => {
    setWeightExercise(null);
    setWeightModalSeriesId(null);
  }, []);

  const handleSeriesSave = useCallback(
    async (payload: SeriesManagerSavePayload) => {
      const isReplacingActiveSeries =
        payload.status === "active" &&
        activeSeries != null &&
        activeSeries.id !== seriesToEdit?.id;

      try {
        if (!seriesToEdit) {
          await persistSnapshot(createSeries(currentSnapshot, payload));
        } else {
          const currentSeriesToEdit = getSeriesById(currentSnapshot, seriesToEdit.id);

          if (!currentSeriesToEdit) {
            return;
          }

          let nextSnapshot = currentSnapshot;

          if (
            payload.templateId &&
            payload.templateId !== currentSeriesToEdit.templateId
          ) {
            nextSnapshot = applyTemplateToSeries(
              nextSnapshot,
              seriesToEdit.id,
              payload.templateId,
            );
          }

          await persistSnapshot(
            updateSeries(nextSnapshot, seriesToEdit.id, {
              name: payload.name,
              startDate: payload.startDate,
              endDate: payload.endDate,
              status: payload.status,
            }),
          );
        }

        setSeriesModalOpen(false);
        setSeriesToEdit(null);
        setDefaultTemplateIdForModal(null);
        showToast(
          isReplacingActiveSeries
            ? "Série atual trocada com sucesso."
            : "Série salva com sucesso.",
          "success",
        );
      } catch {
        showToast("Erro ao salvar a série.", "error");
      }
    },
    [
      activeSeries,
      currentSnapshot,
      persistSnapshot,
      seriesToEdit,
      showToast,
    ],
  );

  const handleSeriesDelete = useCallback(
    async (id: string) => {
      try {
        await persistSnapshot(deleteSeriesFromSnapshot(currentSnapshot, id));

        if (selectedSeriesId === id) {
          setSelectedSeriesId(null);
          setView("landing");
        }

        setSeriesToEdit(null);
        setDefaultTemplateIdForModal(null);
        setSeriesModalOpen(false);
      } catch {
        showToast("Erro ao excluir a série.", "error");
      }
    },
    [currentSnapshot, persistSnapshot, selectedSeriesId, showToast],
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
    async (photo: { date: string; note: string; src: string }) => {
      try {
        await persistSnapshot(addProgressPhotoToSnapshot(currentSnapshot, photo));
        showToast("Foto adicionada com sucesso.", "success");
      } catch {
        showToast("Erro ao adicionar a foto.", "error");
      }
    },
    [currentSnapshot, persistSnapshot, showToast],
  );

  const handleMetricsSave = useCallback(
    async (bodyWeight: number, bodyFatPercent: number | null) => {
      try {
        let nextSnapshot = addProfileMetric(
          currentSnapshot,
          bodyWeight,
          bodyFatPercent,
        );

        if (view === "series" && selectedSeriesId != null) {
          nextSnapshot = addSeriesMetric(
            nextSnapshot,
            selectedSeriesId,
            bodyWeight,
            bodyFatPercent,
          );
        }

        await persistSnapshot(nextSnapshot);
        setMetricsModalOpen(false);
      } catch {
        showToast("Erro ao salvar as métricas.", "error");
      }
    },
    [currentSnapshot, persistSnapshot, selectedSeriesId, showToast, view],
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
          2,
        );
        const blob = new Blob([payload], { type: "application/json" });
        const anchor = document.createElement("a");
        anchor.href = URL.createObjectURL(blob);
        anchor.download = "treino-dados.json";
        anchor.click();
        URL.revokeObjectURL(anchor.href);
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

      reader.onload = async () => {
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
            await persistSnapshot(
              replaceAppDataInSnapshot(
                currentSnapshot,
                ensureProfileExtras(imported as AppData),
              ),
            );
            setSelectedSeriesId(null);
            setSelectedSessionId(null);
            setView("landing");
            showToast("Dados importados com sucesso!", "success");
          } else if (
            imported != null &&
            "templates" in imported &&
            Array.isArray((imported as TemplateLibrary).templates)
          ) {
            await persistSnapshot(
              replaceTemplateLibraryInSnapshot(
                currentSnapshot,
                imported as TemplateLibrary,
              ),
            );
            showToast("Planos (templates) atualizados!", "success");
          } else if (
            imported != null &&
            Array.isArray((imported as ExerciseLibrary).groups)
          ) {
            await persistSnapshot(
              replaceTemplateLibraryInSnapshot(
                currentSnapshot,
                exerciseLibraryToTemplateLibrary(imported as ExerciseLibrary),
              ),
            );
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
    [
      currentSnapshot,
      persistSnapshot,
      showToast,
    ],
  );

  const handleStartSession = useCallback(async () => {
    if (!selectedSeriesId) {
      return;
    }

    try {
      const nextSnapshot = createSession(currentSnapshot, selectedSeriesId, activeGroup);
      const latestSessionId = nextSnapshot.sessions[0]?.id ?? null;
      await persistSnapshot(nextSnapshot);

      if (latestSessionId) {
        setSelectedSessionId(latestSessionId);
        setView("session-tracker");
      }
    } catch {
      showToast("Erro ao iniciar a sessão.", "error");
    }
  }, [
    activeGroup,
    currentSnapshot,
    persistSnapshot,
    selectedSeriesId,
    showToast,
  ]);

  const handleFinishSession = useCallback(
    async (sessionId: string) => {
      try {
        await persistSnapshot(
          updateSessionStatus(currentSnapshot, sessionId, "finished"),
        );
        setView("sessions");
        setSelectedSessionId(null);
      } catch {
        showToast("Erro ao finalizar a sessão.", "error");
      }
    },
    [currentSnapshot, persistSnapshot, showToast],
  );

  const handleCancelSession = useCallback(
    async (sessionId: string) => {
      try {
        await persistSnapshot(
          updateSessionStatus(currentSnapshot, sessionId, "canceled"),
        );

        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
          setView("sessions");
        }
      } catch {
        showToast("Erro ao cancelar a sessão.", "error");
      }
    },
    [currentSnapshot, persistSnapshot, selectedSessionId, showToast],
  );

  const handleUpdateSessionExercise = useCallback(
    async (
      sessionId: string,
      exerciseId: string,
      payload: {
        weight?: number | null;
        status?: SessionExerciseStatus;
      },
    ) => {
      try {
        await persistSnapshot(
          updateSessionExerciseInSnapshot(
            currentSnapshot,
            sessionId,
            exerciseId,
            payload,
          ),
        );
      } catch {
        showToast("Erro ao atualizar o exercício.", "error");
      }
    },
    [currentSnapshot, persistSnapshot, showToast],
  );

  const handleSelectSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    setView("session-tracker");
  }, []);

  const handleBackFromSessionTracker = useCallback(() => {
    setSelectedSessionId(null);
    setView("sessions");
  }, []);

  const openSeriesById = useCallback(
    (seriesId: string, preferredGroup?: string) => {
      const series = getSeriesById(data, seriesId);
      const groups =
        series?.exercisesByGroup &&
        Object.keys(series.exercisesByGroup).length > 0
          ? Object.keys(series.exercisesByGroup)
          : templates[0]?.groups?.map((group) => group.group) ?? [
              "A",
              "B",
              "C",
              "D",
              "E",
            ];
      const nextGroup =
        preferredGroup && groups.includes(preferredGroup)
          ? preferredGroup
          : selectedSeriesId === seriesId && groups.includes(activeGroup)
            ? activeGroup
            : groups[0] ?? "A";

      setSelectedSeriesId(seriesId);
      setSelectedSessionId(null);
      setActiveGroup(nextGroup);
      setView("series");
    },
    [activeGroup, data, selectedSeriesId, templates],
  );

  const handlePrimaryTabChange = useCallback(
    (tab: PrimaryTab) => {
      if (tab === "workout") {
        if (activeSeries) {
          openSeriesById(activeSeries.id);
        } else {
          setSelectedSeriesId(null);
          setView("more");
        }
        return;
      }

      setSelectedSessionId(null);
      setSelectedSeriesId(null);

      if (tab === "home") setView("landing");
      if (tab === "sessions") setView("sessions");
      if (tab === "profile") setView("profile");
      if (tab === "more") setView("more");
    },
    [activeSeries, openSeriesById],
  );

  const primaryTab: PrimaryTab =
    view === "series" || view === "history"
      ? "workout"
      : view === "sessions" || view === "session-tracker"
        ? "sessions"
        : view === "profile" || view === "metrics"
          ? "profile"
          : view === "more"
            ? "more"
            : "home";
  const showPrimaryTabs = view !== "session-tracker";

  if (isLoading) {
    return <StatusScreen text="Carregando seus dados..." />;
  }

  return (
    <>
      <div className={showPrimaryTabs ? "app-shell" : ""}>
        {view === "landing" && (
          <LandingPage
            data={data}
            activeSeries={activeSeries}
            username={authSession.username}
            ongoingSession={ongoingSession}
            onResumeSession={handleSelectSession}
            onOpenActiveSeries={(group) => {
              if (activeSeries) openSeriesById(activeSeries.id, group);
            }}
            onOpenProfile={() => setView("profile")}
            onOpenSessions={() => setView("sessions")}
            onCreateSeries={() => {
              setSeriesToEdit(null);
              setDefaultTemplateIdForModal(null);
              setSeriesModalOpen(true);
            }}
          />
        )}

        {view === "sessions" && (
          <SessionsPage
            data={data}
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
            onPlayVideo={setVideoExercise}
          />
        )}

        {view === "series" && currentSeries != null && (
          <div className="page-enter">
            <header className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-slate-700/50 tw-bg-background/95 tw-px-4 tw-pb-3 tw-pt-[calc(var(--safe-top)+0.75rem)] tw-backdrop-blur-xl">
              <div className="tw-min-w-0 tw-flex-1">
                <p className="tw-text-[0.65rem] tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-primary">
                  Treino · Dia {activeGroup}
                </p>
                <h1 className="tw-mt-1 tw-truncate tw-font-display tw-text-xl tw-font-bold tw-text-slate-50">
                  {currentSeries.name}
                </h1>
                <p className="tw-text-xs tw-text-slate-500 tabular-nums">
                  {formatDate(currentSeries.startDate)} — {formatDate(currentSeries.endDate)}
                </p>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <button
                  type="button"
                  className="touch-target tw-rounded-xl tw-bg-slate-800/75 tw-px-3 tw-text-xs tw-font-semibold tw-text-secondary tw-shadow-[inset_0_0_0_1px_rgba(168,85,247,0.18)] tw-transition-transform active:tw-scale-[0.96]"
                  onClick={() => setView("history")}
                >
                  Histórico
                </button>
              </div>
            </header>
            <main className="tw-space-y-4 tw-p-4">
              <div className="home-hero-card tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-3xl tw-p-4">
                <div>
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-slate-500">
                    Pronto para começar?
                  </p>
                  <p className="tw-mt-1 tw-font-display tw-font-bold tw-text-slate-50">
                    {currentExercises.length} exercícios
                  </p>
                </div>
                <button
                  type="button"
                  className="touch-target tw-rounded-2xl tw-bg-active-gradient tw-px-5 tw-py-2.5 tw-font-display tw-text-sm tw-font-bold tw-text-slate-950 tw-shadow-[0_10px_24px_rgba(132,204,22,0.18)] tw-transition-transform active:tw-scale-[0.96]"
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
                {currentExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    currentWeight={getCurrentExerciseWeight(
                      currentSeries,
                      exercise.id,
                    )}
                    weightHistory={getExerciseHistory(
                      currentSeries,
                      exercise.id,
                    )}
                    onPlayVideo={setVideoExercise}
                    onEditWeight={(selectedExercise) => {
                      if (selectedSeriesId) {
                        openWeightModal(selectedExercise, selectedSeriesId);
                      }
                    }}
                  />
                ))}
              </div>
            </main>
          </div>
        )}

        {(view === "profile" || view === "metrics") && (
          <ProfilePage
            data={data}
            username={authSession.username}
            onOpenMetricsModal={() => setMetricsModalOpen(true)}
            onOpenPhotoModal={() => setPhotoModalOpen(true)}
            onLogout={() => {
              void onLogout();
            }}
          />
        )}

        {view === "more" && (
          <MorePage
            data={data}
            templates={templates}
            onSelectSeries={openSeriesById}
            onEditSeries={(series) => {
              setSeriesToEdit(series);
              setDefaultTemplateIdForModal(series.templateId ?? null);
              setSeriesModalOpen(true);
            }}
            onOpenSeriesModal={() => {
              setSeriesToEdit(null);
              setDefaultTemplateIdForModal(null);
              setSeriesModalOpen(true);
            }}
            onCreateFromTemplate={handleCreateFromTemplate}
            onExport={handleExport}
            onImport={handleImport}
            isExporting={isExporting}
            isImporting={isImporting}
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
      </div>

      {showPrimaryTabs && (
        <AppTabBar active={primaryTab} onChange={handlePrimaryTabChange} />
      )}

      <VideoModal
        open={videoExercise != null}
        exercise={videoExercise}
        onClose={() => setVideoExercise(null)}
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
          weightExercise != null &&
          (weightModalSeriesId != null || currentSeries != null)
            ? getCurrentExerciseWeight(
                (
                  weightModalSeriesId != null
                    ? getSeriesById(data, weightModalSeriesId)
                    : currentSeries
                )!,
                weightExercise.id,
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
        currentActiveSeries={activeSeries}
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

function App() {
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSession, setAuthSession] = useState<SupabaseSession | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setAuthErrorMessage("Não foi possível validar a sessão do Supabase.");
          setAuthSession(null);
          return;
        }

        setAuthSession(data.session);
      })
      .finally(() => setIsAuthLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      setAuthErrorMessage(null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    setAuthErrorMessage(null);

    if (!isSupabaseConfigured) {
      setAuthErrorMessage(
        "Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.",
      );
      return;
    }

    setIsAuthenticating(true);

    try {
      const { error } = await requireSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setAuthErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o login com Google.",
      );
      setIsAuthenticating(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setAuthErrorMessage(null);

    try {
      await requireSupabase().auth.signOut();
      setAuthSession(null);
    } catch {
      setAuthErrorMessage("Não foi possível sair da conta.");
    }
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <AuthPage
        errorMessage={
          authErrorMessage ??
          "Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para habilitar o login com Google."
        }
        isSubmitting={isAuthenticating}
        onSignInWithGoogle={handleSignInWithGoogle}
      />
    );
  }

  if (isAuthLoading) {
    return <StatusScreen text="Validando sessão do Supabase..." />;
  }

  if (!authSession?.user) {
    return (
      <AuthPage
        errorMessage={authErrorMessage}
        isSubmitting={isAuthenticating}
        onSignInWithGoogle={handleSignInWithGoogle}
      />
    );
  }

  const activeSession: AuthSession = {
    userId: authSession.user.id,
    username: getUserDisplayName(authSession.user),
    user: authSession.user,
  };

  return <TrainingApp authSession={activeSession} onLogout={handleLogout} />;
}

export default App;
