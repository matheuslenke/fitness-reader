import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { AuthPage } from "./components/AuthPage";
import { ExerciseCard } from "./components/ExerciseCard";
import { HistoryPage } from "./components/HistoryPage";
import { LandingPage } from "./components/LandingPage";
import { MetricsModal } from "./components/MetricsModal";
import { MetricsPage } from "./components/MetricsPage";
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
  clearStoredAuthSession,
  getErrorMessage,
  readStoredAuthSession,
  writeStoredAuthSession,
} from "./lib/auth";
import {
  buildDefaultSnapshot,
  ensureProfileExtras,
  exerciseLibraryToTemplateLibrary,
  getCurrentExerciseWeight,
  getGlobalMetrics,
  getSeriesById,
} from "./lib/storage";
import { formatDate } from "./lib/utils";
import type {
  AppData,
  Exercise,
  ExerciseLibrary,
  SessionExerciseStatus,
  Series,
  TemplateLibrary,
  ToastState,
  ViewKey,
} from "./types/fitness";

type AuthSession = {
  sessionId: string;
  userId: string;
  username: string;
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

function TrainingApp({ authSession, onLogout }: TrainingAppProps) {
  const snapshot = useQuery(api.appState.get, {
    authSessionId: authSession.sessionId,
  });
  const saveSeriesMutation = useMutation(api.appState.saveSeries);
  const deleteSeriesMutation = useMutation(api.appState.deleteSeries);
  const saveMetricMutation = useMutation(api.appState.saveMetric);
  const addProgressPhotoMutation = useMutation(api.appState.addProgressPhoto);
  const addExerciseWeightEntryMutation = useMutation(
    api.appState.addExerciseWeightEntry,
  );
  const replaceAppDataMutation = useMutation(api.appState.replaceAppData);
  const replaceTemplateLibraryMutation = useMutation(
    api.appState.replaceTemplateLibrary,
  );
  const startSessionMutation = useMutation(api.appState.startSession);
  const setSessionStatusMutation = useMutation(api.appState.setSessionStatus);
  const updateSessionExerciseMutation = useMutation(
    api.appState.updateSessionExercise,
  );

  const [view, setView] = useState<ViewKey>("landing");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState("A");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
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

  const handleSaveWeight = useCallback(
    async (exerciseId: string, weight: number) => {
      const seriesId = weightModalSeriesId ?? selectedSeriesId;

      if (!seriesId) {
        return;
      }

      try {
        await addExerciseWeightEntryMutation({
          authSessionId: authSession.sessionId,
          seriesId,
          exerciseId,
          weight,
        });
      } catch {
        showToast("Erro ao salvar a carga.", "error");
      }
    },
    [
      addExerciseWeightEntryMutation,
      authSession.sessionId,
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
        await saveSeriesMutation({
          authSessionId: authSession.sessionId,
          seriesId: seriesToEdit?.id ?? undefined,
          payload,
        });
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
      authSession.sessionId,
      saveSeriesMutation,
      seriesToEdit,
      showToast,
    ],
  );

  const handleSeriesDelete = useCallback(
    async (id: string) => {
      try {
        await deleteSeriesMutation({
          authSessionId: authSession.sessionId,
          seriesId: id,
        });

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
    [authSession.sessionId, deleteSeriesMutation, selectedSeriesId, showToast],
  );

  const handleCreateFromTemplate = useCallback((templateId: string) => {
    setSeriesToEdit(null);
    setDefaultTemplateIdForModal(templateId);
    setSeriesModalOpen(true);
  }, []);

  const handleSwitchSeries = useCallback((series: Series) => {
    setSeriesToEdit(null);
    setDefaultTemplateIdForModal(series.templateId ?? null);
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
        await addProgressPhotoMutation({
          authSessionId: authSession.sessionId,
          photo,
        });
        showToast("Foto adicionada com sucesso.", "success");
      } catch {
        showToast("Erro ao adicionar a foto.", "error");
      }
    },
    [addProgressPhotoMutation, authSession.sessionId, showToast],
  );

  const handleMetricsSave = useCallback(
    async (bodyWeight: number, bodyFatPercent: number | null) => {
      try {
        await saveMetricMutation({
          authSessionId: authSession.sessionId,
          bodyWeight,
          bodyFatPercent,
          seriesId:
            view === "series" && selectedSeriesId != null
              ? selectedSeriesId
              : undefined,
        });
        setMetricsModalOpen(false);
      } catch {
        showToast("Erro ao salvar as métricas.", "error");
      }
    },
    [authSession.sessionId, saveMetricMutation, selectedSeriesId, showToast, view],
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
            await replaceAppDataMutation({
              authSessionId: authSession.sessionId,
              data: ensureProfileExtras(imported as AppData),
            });
            setSelectedSeriesId(null);
            setSelectedSessionId(null);
            setView("landing");
            showToast("Dados importados com sucesso!", "success");
          } else if (
            imported != null &&
            "templates" in imported &&
            Array.isArray((imported as TemplateLibrary).templates)
          ) {
            await replaceTemplateLibraryMutation({
              authSessionId: authSession.sessionId,
              templateLibrary: imported as TemplateLibrary,
            });
            showToast("Planos (templates) atualizados!", "success");
          } else if (
            imported != null &&
            Array.isArray((imported as ExerciseLibrary).groups)
          ) {
            await replaceTemplateLibraryMutation({
              authSessionId: authSession.sessionId,
              templateLibrary: exerciseLibraryToTemplateLibrary(
                imported as ExerciseLibrary,
              ),
            });
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
      authSession.sessionId,
      replaceAppDataMutation,
      replaceTemplateLibraryMutation,
      showToast,
    ],
  );

  const handleStartSession = useCallback(async () => {
    if (!selectedSeriesId) {
      return;
    }

    try {
      const result = await startSessionMutation({
        authSessionId: authSession.sessionId,
        seriesId: selectedSeriesId,
        group: activeGroup,
      });

      if (result.sessionId) {
        setSelectedSessionId(result.sessionId);
        setView("session-tracker");
      }
    } catch {
      showToast("Erro ao iniciar a sessão.", "error");
    }
  }, [
    activeGroup,
    authSession.sessionId,
    selectedSeriesId,
    showToast,
    startSessionMutation,
  ]);

  const handleFinishSession = useCallback(
    async (sessionId: string) => {
      try {
        await setSessionStatusMutation({
          authSessionId: authSession.sessionId,
          sessionId,
          status: "finished",
        });
        setView("sessions");
        setSelectedSessionId(null);
      } catch {
        showToast("Erro ao finalizar a sessão.", "error");
      }
    },
    [authSession.sessionId, setSessionStatusMutation, showToast],
  );

  const handleCancelSession = useCallback(
    async (sessionId: string) => {
      try {
        await setSessionStatusMutation({
          authSessionId: authSession.sessionId,
          sessionId,
          status: "canceled",
        });

        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
          setView("sessions");
        }
      } catch {
        showToast("Erro ao cancelar a sessão.", "error");
      }
    },
    [authSession.sessionId, selectedSessionId, setSessionStatusMutation, showToast],
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
        await updateSessionExerciseMutation({
          authSessionId: authSession.sessionId,
          sessionId,
          exerciseId,
          payload,
        });
      } catch {
        showToast("Erro ao atualizar o exercício.", "error");
      }
    },
    [authSession.sessionId, showToast, updateSessionExerciseMutation],
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

  if (isLoading) {
    return <StatusScreen text="Carregando dados do Convex..." />;
  }

  return (
    <>
      {view === "landing" && (
        <LandingPage
          data={data}
          activeSeries={activeSeries}
          templates={templates}
          username={authSession.username}
          onSelectSeries={(id) => {
            const series = getSeriesById(data, id);
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
            setSelectedSeriesId(id);
            setView("series");
            setActiveGroup(groups[0] ?? "A");
          }}
          onSwitchSeries={handleSwitchSeries}
          onOpenMetricsModal={() => setMetricsModalOpen(true)}
          onGoToMetrics={() => setView("metrics")}
          onOpenSeriesModal={() => {
            setSeriesToEdit(null);
            setDefaultTemplateIdForModal(null);
            setSeriesModalOpen(true);
          }}
          onCreateFromTemplate={handleCreateFromTemplate}
          onPlayVideo={setVideoUrl}
          onEditWeightInSeries={openWeightModal}
          onEditSeries={(series) => {
            setSeriesToEdit(series);
            setSeriesModalOpen(true);
          }}
          onExport={handleExport}
          onImport={handleImport}
          isExporting={isExporting}
          isImporting={isImporting}
          onOpenPhotoModal={() => setPhotoModalOpen(true)}
          onGoToSessions={() => setView("sessions")}
          onLogout={() => {
            void onLogout();
          }}
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
                {formatDate(currentSeries.startDate)} -{" "}
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
              {currentExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  currentWeight={getCurrentExerciseWeight(
                    currentSeries,
                    exercise.id,
                  )}
                  onPlayVideo={setVideoUrl}
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
  const loginAction = useAction(api.authActions.login);
  const logoutMutation = useMutation(api.auth.logout);
  const registerAction = useAction(api.authActions.register);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [storedSession, setStoredSession] = useState<AuthSession | null>(() =>
    readStoredAuthSession(),
  );
  const resolvedSession = useQuery(
    api.auth.getSession,
    storedSession ? { sessionId: storedSession.sessionId } : "skip",
  );

  useEffect(() => {
    if (!storedSession || resolvedSession === undefined) {
      return;
    }

    if (resolvedSession === null) {
      clearStoredAuthSession();
      setStoredSession(null);
      setAuthErrorMessage("Sua sessão expirou. Faça login novamente.");
      return;
    }

    const nextSession: AuthSession = {
      sessionId: resolvedSession.sessionId,
      userId: resolvedSession.userId,
      username: resolvedSession.username,
    };

    if (
      nextSession.sessionId !== storedSession.sessionId ||
      nextSession.userId !== storedSession.userId ||
      nextSession.username !== storedSession.username
    ) {
      writeStoredAuthSession(nextSession);
      setStoredSession(nextSession);
    }
  }, [resolvedSession, storedSession]);

  const handleAuthenticate = useCallback(
    async ({
      mode,
      password,
      username,
    }: {
      mode: "login" | "register";
      username: string;
      password: string;
    }) => {
      setAuthErrorMessage(null);
      setIsAuthenticating(true);

      try {
        const nextSession =
          mode === "register"
            ? await registerAction({ username, password })
            : await loginAction({ username, password });

        writeStoredAuthSession(nextSession);
        setStoredSession(nextSession);
      } catch (error) {
        setAuthErrorMessage(
          getErrorMessage(
            error,
            mode === "register"
              ? "Não foi possível criar sua conta."
              : "Não foi possível fazer login.",
          ),
        );
      } finally {
        setIsAuthenticating(false);
      }
    },
    [loginAction, registerAction],
  );

  const handleLogout = useCallback(async () => {
    const currentSession = storedSession;

    clearStoredAuthSession();
    setStoredSession(null);
    setAuthErrorMessage(null);

    if (!currentSession) {
      return;
    }

    try {
      await logoutMutation({ sessionId: currentSession.sessionId });
    } catch {
      // Ignore logout cleanup failures after the local session has been cleared.
    }
  }, [logoutMutation, storedSession]);

  if (!storedSession) {
    return (
      <AuthPage
        errorMessage={authErrorMessage}
        isSubmitting={isAuthenticating}
        onAuthenticate={handleAuthenticate}
      />
    );
  }

  if (resolvedSession === undefined) {
    return <StatusScreen text="Validando sessão..." />;
  }

  if (resolvedSession === null) {
    return (
      <AuthPage
        errorMessage={authErrorMessage}
        isSubmitting={isAuthenticating}
        onAuthenticate={handleAuthenticate}
      />
    );
  }

  const activeSession: AuthSession = {
    sessionId: resolvedSession.sessionId,
    userId: resolvedSession.userId,
    username: resolvedSession.username,
  };

  return <TrainingApp authSession={activeSession} onLogout={handleLogout} />;
}

export default App;
