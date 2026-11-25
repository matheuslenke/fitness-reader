import { useEffect, useRef, useState } from "react";
import { getSeriesById, getSessionById } from "../lib/storage";
import {
  formatDateTime,
  getEmbedUrl,
  getSuggestedRepetitionCount,
  isYouTubeShortUrl,
  MAX_REPETITION_COUNT,
} from "../lib/utils";
import type {
  AppData,
  Exercise,
  SessionExercise,
  SessionExerciseStatus,
  SessionExerciseUpdate,
  SessionSetProgress,
} from "../types/fitness";
import { ActivityIndicator } from "./LoadingScreen";
import { RestTimer } from "./RestTimer";
import { WeightHistory } from "./WeightHistory";

type SessionTrackerPageProps = {
  data: AppData;
  sessionId: string;
  onBack: () => void;
  onFinish: (
    sessionId: string,
    exerciseUpdates: Record<string, SessionExerciseUpdate>,
  ) => Promise<void>;
  onCancel: (sessionId: string) => void;
  onUpdateExercise: (
    sessionId: string,
    exerciseId: string,
    payload: SessionExerciseUpdate,
  ) => Promise<void>;
  onPlayVideo: (exercise: Exercise) => void;
};

type PlayerExercise = {
  exercise: Exercise;
  sessionExercise: SessionExercise;
};

type ParsedWeight =
  | { weight: number | null; error: null }
  | { weight: null; error: string };

const DRAFT_SAVE_DELAY_MS = 550;
const UPCOMING_EXERCISE_PREVIEW_COUNT = 3;

const EXERCISE_STATUS_LABEL: Record<SessionExerciseStatus, string> = {
  pending: "Em andamento",
  completed: "Concluído",
  skipped: "Pulado",
};

const EXERCISE_SEQUENCE_LABEL: Record<
  NonNullable<Exercise["sequenceType"]>,
  string
> = {
  "bi-set": "bi-set",
  "tri-set": "tri-set",
  circuit: "circuito",
};

function getSequenceContinuationCount(
  activeExercise: Exercise,
  followingExercises: PlayerExercise[],
): number {
  if (!activeExercise.sequenceId) return 0;

  let continuationCount = 0;
  for (const { exercise } of followingExercises) {
    if (exercise.sequenceId !== activeExercise.sequenceId) break;
    continuationCount++;
  }
  return continuationCount;
}

function parseWeightDraft(value: string): ParsedWeight {
  const normalizedValue = value.trim().replace(",", ".");

  if (normalizedValue === "") {
    return { weight: null, error: null };
  }

  const weight = Number(normalizedValue);
  if (!Number.isFinite(weight) || weight < 0) {
    return { weight: null, error: "Digite uma carga válida." };
  }

  return { weight, error: null };
}

function getPlannedSetCount(exercise: Exercise): number {
  const setCountMatch = exercise.sets.match(/\d+/);
  const parsedSetCount = setCountMatch ? Number(setCountMatch[0]) : 1;
  return Math.min(20, Math.max(1, parsedSetCount));
}

function getInitialSetProgress(
  exercise: Exercise,
  savedProgress: SessionSetProgress[] | undefined,
  useSuggestedDefaults: boolean,
): SessionSetProgress[] {
  const setCount = Math.max(getPlannedSetCount(exercise), savedProgress?.length ?? 0);
  const suggestedRepetitionCount = getSuggestedRepetitionCount(exercise.reps);

  return Array.from({ length: setCount }, (_, index) => {
    const savedSet = savedProgress?.[index];
    const shouldUseSuggestedCount =
      savedSet == null ||
      (useSuggestedDefaults && !savedSet.completed && savedSet.repetitions === 0);

    return {
      repetitions: shouldUseSuggestedCount
        ? suggestedRepetitionCount
        : Math.max(0, savedSet.repetitions),
      completed: savedSet?.completed === true,
    };
  });
}

function getFirstOpenSetIndex(progress: SessionSetProgress[]): number {
  const firstOpenIndex = progress.findIndex((set) => !set.completed);
  return firstOpenIndex >= 0 ? firstOpenIndex : Math.max(0, progress.length - 1);
}

function PreviousIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="m14.5 6-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="m9.5 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
      <path d="M8 5.8v12.4c0 .8.9 1.3 1.6.8l9-6.2a1 1 0 0 0 0-1.6l-9-6.2A1 1 0 0 0 8 5.8Z" fill="currentColor" />
    </svg>
  );
}

function ExerciseMark() {
  return (
    <svg viewBox="0 0 64 64" width="74" height="74" aria-hidden>
      <path
        d="M14 24v16M8 27v10m42-13v16m6-13v10M14 32h36M22 27v10m20-10v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SessionTrackerPage({
  data,
  sessionId,
  onBack,
  onFinish,
  onCancel,
  onUpdateExercise,
  onPlayVideo,
}: SessionTrackerPageProps) {
  const session = getSessionById(data, sessionId);
  const series = session ? getSeriesById(data, session.seriesId) : null;
  const exercisesInGroup = series?.exercisesByGroup?.[session?.group ?? ""] ?? [];
  const exerciseById = new Map<string, Exercise>(
    exercisesInGroup.map((exercise) => [exercise.id, exercise]),
  );
  const playerExercises: PlayerExercise[] = [];

  for (const sessionExercise of session?.exercises ?? []) {
    const exercise = exerciseById.get(sessionExercise.exerciseId);
    if (exercise) {
      playerExercises.push({ exercise, sessionExercise });
    }
  }

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [selectedSetIndexes, setSelectedSetIndexes] = useState<
    Record<string, number>
  >({});
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
  const [weightErrors, setWeightErrors] = useState<Record<string, string>>({});
  const [setProgressDrafts, setSetProgressDrafts] = useState<
    Record<string, SessionSetProgress[]>
  >({});
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, SessionExerciseStatus>
  >({});
  const [savingExercises, setSavingExercises] = useState<Record<string, boolean>>(
    {},
  );
  const [isFinishing, setIsFinishing] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const weightDraftsRef = useRef<Record<string, string>>({});
  const setProgressDraftsRef = useRef<Record<string, SessionSetProgress[]>>({});
  const draftSaveTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  useEffect(() => {
    if (!session) return;

    const nextWeightDrafts: Record<string, string> = {};
    const nextSetProgressDrafts: Record<string, SessionSetProgress[]> = {};
    const nextSelectedSetIndexes: Record<string, number> = {};

    for (const { exercise, sessionExercise } of playerExercises) {
      nextWeightDrafts[exercise.id] =
        sessionExercise.weight != null ? String(sessionExercise.weight) : "";
      const progress = getInitialSetProgress(
        exercise,
        sessionExercise.setProgress,
        session.status === "ongoing",
      );
      nextSetProgressDrafts[exercise.id] = progress;
      nextSelectedSetIndexes[exercise.id] = getFirstOpenSetIndex(progress);
    }

    const firstPendingIndex = playerExercises.findIndex(
      ({ sessionExercise }) => sessionExercise.status === "pending",
    );

    weightDraftsRef.current = nextWeightDrafts;
    setProgressDraftsRef.current = nextSetProgressDrafts;
    setWeightDrafts(nextWeightDrafts);
    setSetProgressDrafts(nextSetProgressDrafts);
    setSelectedSetIndexes(nextSelectedSetIndexes);
    setWeightErrors({});
    setStatusOverrides({});
    setActiveExerciseIndex(firstPendingIndex >= 0 ? firstPendingIndex : 0);
  }, [sessionId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const clearDraftTimer = (key: string) => {
    const timer = draftSaveTimersRef.current.get(key);
    if (timer != null) {
      window.clearTimeout(timer);
      draftSaveTimersRef.current.delete(key);
    }
  };

  const scheduleDraftSave = (
    key: string,
    exerciseId: string,
    payload: SessionExerciseUpdate,
  ) => {
    clearDraftTimer(key);
    const timer = window.setTimeout(() => {
      draftSaveTimersRef.current.delete(key);
      void onUpdateExercise(sessionId, exerciseId, payload).catch(() => undefined);
    }, DRAFT_SAVE_DELAY_MS);
    draftSaveTimersRef.current.set(key, timer);
  };

  if (!session || !series) {
    return (
      <div className="page-enter tw-p-4">
        <button
          type="button"
          className="touch-target tw-text-primary"
          onClick={onBack}
        >
          ← Voltar
        </button>
        <p className="tw-mt-4 tw-text-slate-400">Sessão não encontrada.</p>
      </div>
    );
  }

  const isOngoing = session.status === "ongoing";
  const safeActiveIndex = Math.min(
    activeExerciseIndex,
    Math.max(0, playerExercises.length - 1),
  );
  const activePlayerExercise = playerExercises[safeActiveIndex];
  const activeExercise = activePlayerExercise?.exercise;
  const activeSessionExercise = activePlayerExercise?.sessionExercise;
  const activeExerciseId = activeExercise?.id ?? "";
  const activeStatus = activeSessionExercise
    ? (statusOverrides[activeSessionExercise.exerciseId] ??
      activeSessionExercise.status)
    : "pending";
  const activeSetProgress = activeExercise
    ? (setProgressDrafts[activeExercise.id] ??
      getInitialSetProgress(
        activeExercise,
        activeSessionExercise?.setProgress,
        isOngoing,
      ))
    : [];
  const selectedSetIndex = Math.min(
    selectedSetIndexes[activeExerciseId] ?? getFirstOpenSetIndex(activeSetProgress),
    Math.max(0, activeSetProgress.length - 1),
  );
  const selectedSet = activeSetProgress[selectedSetIndex];
  const completedSetCount = activeSetProgress.filter((set) => set.completed).length;
  const completedExerciseCount = playerExercises.filter(
    ({ sessionExercise }) =>
      (statusOverrides[sessionExercise.exerciseId] ?? sessionExercise.status) ===
      "completed",
  ).length;
  const progress =
    playerExercises.length > 0
      ? (completedExerciseCount / playerExercises.length) * 100
      : 0;
  const ambientEmbedUrl = prefersReducedMotion
    ? ""
    : getEmbedUrl(activeExercise?.videoUrl, { background: true });
  const isVerticalVideo = isYouTubeShortUrl(activeExercise?.videoUrl);
  const weightError = weightErrors[activeExerciseId];
  const weightErrorId = `weight-error-${activeExerciseId}`;
  const isSavingActiveExercise = savingExercises[activeExerciseId] === true;
  const followingPlayerExercises = playerExercises.slice(safeActiveIndex + 1);
  const sequenceContinuationCount = activeExercise
    ? getSequenceContinuationCount(activeExercise, followingPlayerExercises)
    : 0;
  const upcomingPlayerExercises = followingPlayerExercises.slice(
    0,
    Math.max(
      UPCOMING_EXERCISE_PREVIEW_COUNT,
      sequenceContinuationCount,
    ),
  );
  const activeSequenceLabel = activeExercise?.sequenceType
    ? EXERCISE_SEQUENCE_LABEL[activeExercise.sequenceType]
    : null;
  const recentWeightEntries =
    series.exerciseWeights?.[activeExerciseId] ?? [];
  const latestWeight = recentWeightEntries[0]?.weight;

  const setExerciseSaving = (exerciseId: string, isSaving: boolean) => {
    setSavingExercises((current) => ({
      ...current,
      [exerciseId]: isSaving,
    }));
  };

  const updateWeightDraft = (exerciseId: string, value: string) => {
    const nextWeightDrafts = {
      ...weightDraftsRef.current,
      [exerciseId]: value,
    };
    weightDraftsRef.current = nextWeightDrafts;
    setWeightDrafts(nextWeightDrafts);

    const parsedWeight = parseWeightDraft(value);
    setWeightErrors((current) => ({
      ...current,
      [exerciseId]: parsedWeight.error ?? "",
    }));

    if (parsedWeight.error) {
      clearDraftTimer(`weight:${exerciseId}`);
      return;
    }

    scheduleDraftSave(`weight:${exerciseId}`, exerciseId, {
      weight: parsedWeight.weight,
    });
  };

  const updateSetProgress = (
    exerciseId: string,
    nextProgress: SessionSetProgress[],
    saveImmediately = false,
  ) => {
    const nextDrafts = {
      ...setProgressDraftsRef.current,
      [exerciseId]: nextProgress,
    };
    setProgressDraftsRef.current = nextDrafts;
    setSetProgressDrafts(nextDrafts);

    const timerKey = `sets:${exerciseId}`;
    if (saveImmediately) {
      clearDraftTimer(timerKey);
      void onUpdateExercise(sessionId, exerciseId, {
        setProgress: nextProgress,
      }).catch(() => undefined);
      return;
    }

    scheduleDraftSave(timerKey, exerciseId, { setProgress: nextProgress });
  };

  const changeRepetitionCount = (change: number) => {
    if (!isOngoing || !activeExercise || !selectedSet) return;

    const nextProgress = activeSetProgress.map((set, index) => {
      if (index !== selectedSetIndex) return set;
      return {
        ...set,
        repetitions: Math.min(
          MAX_REPETITION_COUNT,
          Math.max(0, set.repetitions + change),
        ),
      };
    });
    updateSetProgress(activeExercise.id, nextProgress);
  };

  const toggleSelectedSet = () => {
    if (!isOngoing || !activeExercise || !selectedSet) return;

    const willComplete = !selectedSet.completed;
    const nextProgress = activeSetProgress.map((set, index) =>
      index === selectedSetIndex ? { ...set, completed: willComplete } : set,
    );
    updateSetProgress(activeExercise.id, nextProgress, true);

    if (willComplete) {
      const nextOpenSetIndex = nextProgress.findIndex(
        (set, index) => index > selectedSetIndex && !set.completed,
      );
      if (nextOpenSetIndex >= 0) {
        setSelectedSetIndexes((current) => ({
          ...current,
          [activeExercise.id]: nextOpenSetIndex,
        }));
      }
    }
  };

  const setExerciseStatus = async (status: SessionExerciseStatus) => {
    if (!activeExercise || !activeSessionExercise) return;

    const parsedWeight = parseWeightDraft(
      weightDraftsRef.current[activeExercise.id] ?? "",
    );
    if (parsedWeight.error) {
      setWeightErrors((current) => ({
        ...current,
        [activeExercise.id]: parsedWeight.error,
      }));
      return;
    }

    clearDraftTimer(`weight:${activeExercise.id}`);
    clearDraftTimer(`sets:${activeExercise.id}`);
    setWeightErrors((current) => ({ ...current, [activeExercise.id]: "" }));
    setStatusOverrides((current) => ({
      ...current,
      [activeExercise.id]: status,
    }));
    setExerciseSaving(activeExercise.id, true);

    if (status === "completed" && safeActiveIndex < playerExercises.length - 1) {
      window.setTimeout(() => {
        setActiveExerciseIndex((current) =>
          Math.min(current + 1, playerExercises.length - 1),
        );
      }, 280);
    }

    try {
      await onUpdateExercise(sessionId, activeExercise.id, {
        status,
        weight: parsedWeight.weight,
        setProgress: setProgressDraftsRef.current[activeExercise.id],
      });
    } catch {
      setActiveExerciseIndex(safeActiveIndex);
      setStatusOverrides((current) => {
        const nextOverrides = { ...current };
        delete nextOverrides[activeExercise.id];
        return nextOverrides;
      });
    } finally {
      setExerciseSaving(activeExercise.id, false);
      setStatusOverrides((current) => {
        const nextOverrides = { ...current };
        delete nextOverrides[activeExercise.id];
        return nextOverrides;
      });
    }
  };

  const finishSession = async () => {
    const exerciseUpdates: Record<string, SessionExerciseUpdate> = {};
    const nextErrors: Record<string, string> = {};

    for (const { exercise } of playerExercises) {
      const parsedWeight = parseWeightDraft(
        weightDraftsRef.current[exercise.id] ?? "",
      );
      if (parsedWeight.error) {
        nextErrors[exercise.id] = parsedWeight.error;
        continue;
      }

      clearDraftTimer(`weight:${exercise.id}`);
      clearDraftTimer(`sets:${exercise.id}`);
      exerciseUpdates[exercise.id] = {
        weight: parsedWeight.weight,
        setProgress: setProgressDraftsRef.current[exercise.id],
      };
    }

    if (Object.keys(nextErrors).length > 0) {
      setWeightErrors(nextErrors);
      const firstInvalidIndex = playerExercises.findIndex(
        ({ exercise }) => nextErrors[exercise.id] != null,
      );
      if (firstInvalidIndex >= 0) {
        setActiveExerciseIndex(firstInvalidIndex);
      }
      return;
    }

    setIsFinishing(true);
    try {
      await onFinish(sessionId, exerciseUpdates);
    } finally {
      setIsFinishing(false);
    }
  };

  if (!activeExercise || !activeSessionExercise) {
    return (
      <div className="page-enter tw-flex tw-min-h-[100dvh] tw-flex-col tw-p-4">
        <button
          type="button"
          className="touch-target tw-self-start tw-text-primary"
          onClick={onBack}
        >
          ← Voltar
        </button>
        <div className="tw-m-auto tw-text-center">
          <h1 className="tw-font-display tw-text-xl tw-font-bold tw-text-slate-50">
            Nenhum exercício neste treino
          </h1>
          <p className="tw-mt-2 tw-text-sm tw-text-slate-400">
            Volte para a série e confira o plano selecionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="session-player page-enter tw-min-h-[100dvh]">
      <header className="session-player__header">
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            type="button"
            className="touch-target tw-shrink-0 tw-rounded-full tw-text-sm tw-font-semibold tw-text-primary tw-transition-transform active:tw-scale-[0.96]"
            onClick={onBack}
            aria-label="Voltar para sessões"
          >
            <PreviousIcon />
          </button>
          <div className="tw-min-w-0 tw-flex-1">
            <p className="tw-truncate tw-text-[0.65rem] tw-font-bold tw-uppercase tw-tracking-[0.16em] tw-text-slate-500">
              {series.name} · Dia {session.group}
            </p>
            <h1 className="tw-mt-0.5 tw-truncate tw-font-display tw-text-base tw-font-bold tw-text-slate-50">
              Exercício {safeActiveIndex + 1} de {playerExercises.length}
            </h1>
          </div>
          {isOngoing ? (
            <button
              type="button"
              className="touch-target tw-shrink-0 tw-rounded-xl tw-px-2 tw-text-xs tw-font-bold tw-text-slate-300 tw-transition-[transform,color] active:tw-scale-[0.96] disabled:tw-cursor-wait disabled:tw-opacity-60"
              disabled={isFinishing}
              onClick={() => void finishSession()}
              aria-busy={isFinishing}
            >
              {isFinishing && <ActivityIndicator className="tw-mr-1.5" />}
              {isFinishing ? "Salvando..." : "Finalizar"}
            </button>
          ) : (
            <span className="tw-rounded-full tw-bg-slate-800 tw-px-2.5 tw-py-1 tw-text-[0.65rem] tw-font-bold tw-uppercase tw-tracking-[0.12em] tw-text-slate-400">
              {session.status === "finished" ? "Concluída" : "Cancelada"}
            </span>
          )}
        </div>
        <div
          className="tw-mt-3 tw-h-1.5 tw-overflow-hidden tw-rounded-full tw-bg-slate-800"
          role="progressbar"
          aria-label="Progresso da sessão"
          aria-valuemin={0}
          aria-valuemax={playerExercises.length}
          aria-valuenow={completedExerciseCount}
        >
          <div
            className="session-progress tw-h-full tw-rounded-full tw-bg-active-gradient"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="session-player__main">
        <section
          className="session-player__stage player-enter-visual"
          key={`visual-${activeExercise.id}`}
          aria-label={`Prévia de ${activeExercise.name}`}
        >
          <div className="session-player__stage-fallback" aria-hidden>
            <span className="session-player__visual-glow" />
            <ExerciseMark />
          </div>
          {ambientEmbedUrl && (
            <iframe
              title={`Prévia em movimento: ${activeExercise.name}`}
              className={`session-player__ambient-video ${
                isVerticalVideo ? "is-vertical" : ""
              }`}
              src={ambientEmbedUrl}
              allow="autoplay; encrypted-media; picture-in-picture"
              loading="eager"
              tabIndex={-1}
              aria-hidden
            />
          )}
          <div className="session-player__stage-shade" aria-hidden />
        </section>

        <div className="session-player__content">
          <section
            className="session-player__exercise player-enter-details"
            key={`details-${activeExercise.id}`}
          >
            <div className="tw-flex tw-items-end tw-justify-between tw-gap-3">
              <div className="tw-min-w-0 tw-flex-1">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <p className="tw-text-[0.62rem] tw-font-bold tw-uppercase tw-tracking-[0.17em] tw-text-primary">
                    Agora
                  </p>
                  <span
                    className={`tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[0.58rem] tw-font-bold tw-uppercase tw-tracking-[0.08em] ${
                      activeStatus === "completed"
                        ? "tw-bg-primary-dim tw-text-primary"
                        : activeStatus === "skipped"
                          ? "tw-bg-amber-900/50 tw-text-amber-300"
                          : "tw-bg-slate-900/75 tw-text-slate-300"
                    }`}
                  >
                    {EXERCISE_STATUS_LABEL[activeStatus]}
                  </span>
                </div>
                <h2 className="tw-mt-1 tw-line-clamp-2 tw-text-balance tw-font-display tw-text-[clamp(1.25rem,6vw,1.75rem)] tw-font-bold tw-leading-[1.08] tw-text-slate-50">
                  {activeExercise.name}
                </h2>
              </div>
              {ambientEmbedUrl && (
                <button
                  type="button"
                  className="session-player__watch play-button touch-target tw-shrink-0 tw-gap-1.5 tw-rounded-full tw-px-3 tw-text-xs tw-font-bold tw-text-slate-950 tw-transition-transform active:tw-scale-[0.96]"
                  onClick={() => onPlayVideo(activeExercise)}
                  aria-label={`Assistir execução de ${activeExercise.name}`}
                >
                  <PlayIcon />
                  Vídeo
                </button>
              )}
            </div>

            <dl className="session-player__metrics" aria-label="Prescrição do exercício">
              <div className="session-player__metric">
                <dt>Séries</dt>
                <dd>{activeExercise.sets}</dd>
              </div>
              <div className="session-player__metric">
                <dt>Reps</dt>
                <dd>{activeExercise.reps}</dd>
              </div>
              <div className="session-player__metric">
                <dt>RPE</dt>
                <dd>{activeExercise.rpe || "—"}</dd>
              </div>
              <div className="session-player__metric">
                <dt>Cadência</dt>
                <dd>{activeExercise.cadence || "Livre"}</dd>
              </div>
              <div className="session-player__metric">
                <dt>Descanso</dt>
                <dd>{activeExercise.rest || "Livre"}</dd>
              </div>
            </dl>
          </section>

          <section
            className="session-player__controls player-enter-controls"
            key={`sets-${activeExercise.id}`}
          >
            <div className="session-player__sets-heading">
              <div>
                <p className="tw-text-[0.6rem] tw-font-bold tw-uppercase tw-tracking-[0.15em] tw-text-primary">
                  Repetições feitas
                </p>
                <p className="tw-mt-0.5 tw-font-display tw-text-sm tw-font-bold tw-text-slate-50">
                  Série {selectedSetIndex + 1} de {activeSetProgress.length}
                </p>
              </div>
              <span className="tabular-nums tw-text-[0.68rem] tw-font-semibold tw-text-slate-400">
                {completedSetCount}/{activeSetProgress.length} feitas
              </span>
            </div>

            <div className="session-player__set-tabs" aria-label="Selecionar série">
              {activeSetProgress.map((set, index) => (
                <button
                  key={index}
                  type="button"
                  className={`touch-target session-player__set-tab ${
                    index === selectedSetIndex
                      ? "is-selected"
                      : set.completed
                        ? "is-completed"
                        : ""
                  }`}
                  onClick={() =>
                    setSelectedSetIndexes((current) => ({
                      ...current,
                      [activeExercise.id]: index,
                    }))
                  }
                  aria-pressed={index === selectedSetIndex}
                  aria-label={`Série ${index + 1}, ${set.repetitions} repetições${
                    set.completed ? ", concluída" : ""
                  }`}
                >
                  {set.completed ? "✓" : index + 1}
                </button>
              ))}
            </div>

            <div className="session-player__set-editor">
              {isOngoing ? (
                <label
                  className={`session-player__weight ${weightError ? "has-error" : ""}`}
                  htmlFor={`weight-${activeExercise.id}`}
                >
                  <span>Carga</span>
                  <span className="tw-flex tw-items-baseline tw-gap-1">
                    <input
                      id={`weight-${activeExercise.id}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      className="tabular-nums"
                      value={weightDrafts[activeExercise.id] ?? ""}
                      aria-invalid={Boolean(weightError)}
                      aria-describedby={weightError ? weightErrorId : undefined}
                      onChange={(event) =>
                        updateWeightDraft(activeExercise.id, event.target.value)
                      }
                    />
                    <span className="tw-text-[0.65rem] tw-font-semibold tw-text-slate-500">
                      kg
                    </span>
                  </span>
                </label>
              ) : (
                <div className="session-player__weight">
                  <span>Carga</span>
                  <strong className="tabular-nums tw-text-base tw-text-slate-50">
                    {activeSessionExercise.weight ?? "—"}
                    <small className="tw-ml-1 tw-text-[0.65rem] tw-text-slate-500">
                      kg
                    </small>
                  </strong>
                </div>
              )}

              <div className="session-player__repetition-stepper">
                <button
                  type="button"
                  className="touch-target"
                  onClick={() => changeRepetitionCount(-1)}
                  disabled={!isOngoing || (selectedSet?.repetitions ?? 0) === 0}
                  aria-label="Remover uma repetição"
                >
                  −
                </button>
                <div>
                  <strong className="tabular-nums">
                    {selectedSet?.repetitions ?? 0}
                  </strong>
                  <span>meta {activeExercise.reps}</span>
                </div>
                <button
                  type="button"
                  className="touch-target is-add"
                  onClick={() => changeRepetitionCount(1)}
                  disabled={!isOngoing}
                  aria-label="Adicionar uma repetição"
                >
                  +
                </button>
              </div>

              {isOngoing ? (
                <button
                  type="button"
                  className={`session-player__set-done touch-target ${
                    selectedSet?.completed ? "is-completed" : ""
                  }`}
                  onClick={toggleSelectedSet}
                  aria-pressed={selectedSet?.completed === true}
                  aria-label={
                    selectedSet?.completed
                      ? `Reabrir série ${selectedSetIndex + 1}`
                      : `Concluir série ${selectedSetIndex + 1}`
                  }
                >
                  <span>{selectedSet?.completed ? "✓" : "Feito"}</span>
                </button>
              ) : (
                <div
                  className={`session-player__set-done ${
                    selectedSet?.completed ? "is-completed" : ""
                  }`}
                >
                  <span>{selectedSet?.completed ? "✓" : "—"}</span>
                </div>
              )}
            </div>

            {weightError && (
              <p
                id={weightErrorId}
                className="tw-mt-2 tw-text-xs tw-font-medium tw-text-red-400"
                role="alert"
              >
                {weightError}
              </p>
            )}
          </section>

          {isOngoing && (
            <div className="player-enter-controls">
              <RestTimer />
            </div>
          )}

          <details
            className="session-player__context player-enter-controls"
            key={`context-${activeExercise.id}`}
          >
            <summary>
              <span className="session-player__context-item">
                <span>Última carga</span>
                <strong className="tabular-nums">
                  {latestWeight != null ? `${latestWeight} kg` : "Sem histórico"}
                </strong>
              </span>
              <span className="session-player__context-item">
                <span>Próximo</span>
                <strong>
                  {followingPlayerExercises[0]?.exercise.name ?? "Fim do treino"}
                </strong>
              </span>
              <span className="session-player__context-chevron" aria-hidden>
                ⌃
              </span>
            </summary>

            <div className="session-player__context-panel">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                <div>
                  <p className="tw-text-[0.62rem] tw-font-bold tw-uppercase tw-tracking-[0.15em] tw-text-primary">
                    Contexto do exercício
                  </p>
                  <h3 className="tw-mt-1 tw-font-display tw-text-base tw-font-bold tw-text-slate-50">
                    Histórico e sequência
                  </h3>
                </div>
                <span className="tabular-nums tw-rounded-full tw-bg-slate-900/80 tw-px-2.5 tw-py-1 tw-text-[0.68rem] tw-font-semibold tw-text-slate-400">
                  {Math.max(0, playerExercises.length - safeActiveIndex - 1)} restantes
                </span>
              </div>

              <WeightHistory entries={recentWeightEntries} />

              {sequenceContinuationCount > 0 && activeSequenceLabel && (
                <p className="tw-mt-3 tw-text-pretty tw-text-xs tw-font-semibold tw-text-primary">
                  O próximo exercício continua o {activeSequenceLabel}.
                </p>
              )}

              {upcomingPlayerExercises.length > 0 ? (
                <ol className="tw-mt-3 tw-space-y-2" aria-label="Próximos exercícios">
                  {upcomingPlayerExercises.map(
                    ({ exercise, sessionExercise }, previewIndex) => {
                      const exerciseIndex = safeActiveIndex + previewIndex + 1;
                      const isSameSequence =
                        activeExercise.sequenceId != null &&
                        exercise.sequenceId === activeExercise.sequenceId;
                      const sequenceLabel = exercise.sequenceType
                        ? EXERCISE_SEQUENCE_LABEL[exercise.sequenceType]
                        : null;
                      const exerciseStatus =
                        statusOverrides[sessionExercise.exerciseId] ??
                        sessionExercise.status;

                      return (
                        <li key={exercise.id}>
                          <button
                            type="button"
                            className={`touch-target session-player__upcoming ${
                              isSameSequence ? "is-sequence" : ""
                            }`}
                            onClick={() => setActiveExerciseIndex(exerciseIndex)}
                            aria-label={`Abrir ${exercise.name}`}
                          >
                            <span className="tabular-nums session-player__upcoming-index">
                              {exerciseIndex + 1}
                            </span>
                            <span className="tw-min-w-0 tw-flex-1">
                              <span className="tw-block tw-truncate tw-font-display tw-text-sm tw-font-bold tw-text-slate-100">
                                {exercise.name}
                              </span>
                              <span className="tabular-nums tw-mt-0.5 tw-block tw-text-xs tw-text-slate-500">
                                {exercise.sets} séries · {exercise.reps} reps
                              </span>
                            </span>
                            <span className="tw-shrink-0 tw-text-right">
                              {(isSameSequence || sequenceLabel) && (
                                <span className="tw-block tw-text-[0.58rem] tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-primary">
                                  {isSameSequence
                                    ? `Mesmo ${sequenceLabel ?? "bloco"}`
                                    : sequenceLabel}
                                </span>
                              )}
                              <span className="tw-mt-0.5 tw-block tw-text-[0.62rem] tw-font-semibold tw-text-slate-500">
                                {EXERCISE_STATUS_LABEL[exerciseStatus]}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    },
                  )}
                </ol>
              ) : (
                <p className="tw-mt-3 tw-rounded-2xl tw-bg-primary-dim tw-p-3 tw-text-pretty tw-text-sm tw-font-medium tw-text-primary">
                  Este é o último exercício do treino.
                </p>
              )}

              {isOngoing && (
                <button
                  type="button"
                  className="touch-target tw-mx-auto tw-mt-3 tw-flex tw-px-4 tw-text-xs tw-font-medium tw-text-slate-500 tw-transition-[transform,color] active:tw-scale-[0.96]"
                  onClick={() => onCancel(sessionId)}
                >
                  Cancelar esta sessão
                </button>
              )}

              {!isOngoing && session.finishedAt != null && (
                <p className="tabular-nums tw-mt-3 tw-text-center tw-text-xs tw-text-slate-500">
                  Fim: {formatDateTime(session.finishedAt)}
                </p>
              )}
            </div>
          </details>
        </div>
      </main>

      <footer className="session-player__footer">
        <div className="session-player__footer-inner">
          <button
            type="button"
            className="touch-target tw-h-12 tw-w-12 tw-shrink-0 tw-rounded-full tw-bg-slate-800/90 tw-text-slate-300 tw-shadow-[0_0_0_1px_rgba(255,255,255,0.07)] tw-transition-transform active:tw-scale-[0.96] disabled:tw-opacity-30"
            disabled={safeActiveIndex === 0}
            onClick={() => setActiveExerciseIndex((current) => Math.max(0, current - 1))}
            aria-label="Exercício anterior"
          >
            <PreviousIcon />
          </button>

          {isOngoing ? (
            <button
              type="button"
              className={`done-action touch-target tw-h-14 tw-flex-1 tw-gap-2 tw-rounded-2xl tw-px-4 tw-font-display tw-text-sm tw-font-bold tw-transition-[transform,background-color,color,box-shadow] active:tw-scale-[0.96] disabled:tw-cursor-wait disabled:tw-opacity-70 ${
                activeStatus === "completed"
                  ? "tw-bg-primary tw-text-slate-950 tw-shadow-[0_12px_28px_rgba(190,242,100,0.24)]"
                  : "tw-bg-slate-50 tw-text-slate-950 tw-shadow-[0_12px_28px_rgba(0,0,0,0.3)]"
              }`}
              data-completed={activeStatus === "completed"}
              disabled={isSavingActiveExercise}
              aria-pressed={activeStatus === "completed"}
              aria-busy={isSavingActiveExercise}
              onClick={() =>
                void setExerciseStatus(
                  activeStatus === "completed" ? "pending" : "completed",
                )
              }
            >
              {isSavingActiveExercise ? (
                <ActivityIndicator />
              ) : (
                <span className="done-action__icon" aria-hidden>
                  <span className="done-action__icon-pending">○</span>
                  <span className="done-action__icon-completed">✓</span>
                </span>
              )}
              {isSavingActiveExercise
                ? "Salvando..."
                : activeStatus === "completed"
                  ? "Exercício feito!"
                  : "Concluir exercício"}
            </button>
          ) : (
            <div className="tw-flex-1 tw-text-center tw-text-sm tw-font-semibold tw-text-slate-400">
              {EXERCISE_STATUS_LABEL[activeStatus]}
            </div>
          )}

          <button
            type="button"
            className="touch-target tw-h-12 tw-w-12 tw-shrink-0 tw-rounded-full tw-bg-slate-800/90 tw-text-slate-300 tw-shadow-[0_0_0_1px_rgba(255,255,255,0.07)] tw-transition-transform active:tw-scale-[0.96] disabled:tw-opacity-30"
            disabled={safeActiveIndex === playerExercises.length - 1}
            onClick={() =>
              setActiveExerciseIndex((current) =>
                Math.min(playerExercises.length - 1, current + 1),
              )
            }
            aria-label="Próximo exercício"
          >
            <NextIcon />
          </button>
        </div>
      </footer>
    </div>
  );
}
