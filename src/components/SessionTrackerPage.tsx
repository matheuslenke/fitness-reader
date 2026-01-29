import type {
  AppData,
  Exercise,
  SessionExerciseStatus,
} from "../types/fitness";
import { getSeriesById, getSessionById } from "../lib/storage";
import { formatDateTime, getEmbedUrl } from "../lib/utils";

interface SessionTrackerPageProps {
  data: AppData;
  sessionId: string;
  onBack: () => void;
  onFinish: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
  onUpdateExercise: (
    sessionId: string,
    exerciseId: string,
    payload: {
      weight?: number | null;
      status?: SessionExerciseStatus;
    },
  ) => void;
  onPlayVideo: (url: string) => void;
}

const EXERCISE_STATUS_LABEL: Record<SessionExerciseStatus, string> = {
  pending: "Pendente",
  completed: "Concluído",
  skipped: "Pulado",
};

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
        <p className="tw-text-slate-400 tw-mt-4">Sessão não encontrada.</p>
      </div>
    );
  }

  const exercisesInGroup = series.exercisesByGroup?.[session.group] ?? [];
  const exerciseById = new Map<string, Exercise>(
    exercisesInGroup.map((e) => [e.id, e]),
  );

  const isOngoing = session.status === "ongoing";

  return (
    <div className="page-enter tw-min-h-full tw-flex tw-flex-col">
      <header className="tw-sticky tw-top-0 tw-z-10 tw-pt-[var(--safe-top)] tw-px-4 tw-py-3 tw-bg-gradient-to-b tw-from-background tw-to-background/95 tw-border-b tw-border-slate-700/50 tw-flex tw-items-center tw-gap-2">
        <button
          type="button"
          className="touch-target tw-text-primary tw-font-medium"
          onClick={onBack}
        >
          ← Voltar
        </button>
        <div className="tw-flex-1 tw-min-w-0">
          <h1 className="tw-font-display tw-text-lg tw-font-bold tw-text-slate-50 tw-truncate">
            {series.name} – Dia {session.group}
          </h1>
          <p className="tw-text-xs tw-text-slate-400">
            Início: {formatDateTime(session.startedAt)}
          </p>
        </div>
      </header>

      <main className="tw-flex-1 tw-p-4 tw-pb-24 tw-space-y-4">
        {session.exercises.map((se) => {
          const exercise = exerciseById.get(se.exerciseId);
          if (!exercise) return null;
          const embedUrl = getEmbedUrl(exercise.videoUrl);
          return (
            <div
              key={se.exerciseId}
              className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-border tw-border-slate-700/50"
            >
              <div className="tw-flex tw-items-start tw-gap-3">
                <div className="tw-flex-1 tw-min-w-0">
                  <h3 className="tw-font-display tw-font-bold tw-text-slate-50 tw-text-base">
                    {exercise.name}
                  </h3>
                  <p className="tw-text-sm tw-text-slate-400 tw-mt-0.5">
                    {exercise.sets} × {exercise.reps}
                  </p>
                  <p className="tw-text-xs tw-text-slate-500 tw-mt-1">
                    {EXERCISE_STATUS_LABEL[se.status]}
                  </p>
                  {isOngoing && (
                    <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        placeholder="Carga (kg)"
                        className="tw-w-24 tw-px-3 tw-py-2 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50 tw-text-sm"
                        value={se.weight ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const num = v === "" ? null : parseFloat(v);
                          if (num === null || (!Number.isNaN(num) && num >= 0)) {
                            onUpdateExercise(sessionId, se.exerciseId, {
                              weight: num ?? null,
                            });
                          }
                        }}
                      />
                      <div className="tw-flex tw-gap-1">
                        <button
                          type="button"
                          className={`touch-target tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-sm ${
                            se.status === "completed"
                              ? "tw-bg-primary-dim tw-text-primary"
                              : "tw-bg-slate-700/50 tw-text-slate-400"
                          }`}
                          onClick={() =>
                            onUpdateExercise(sessionId, se.exerciseId, {
                              status: "completed",
                            })
                          }
                        >
                          Feito
                        </button>
                        <button
                          type="button"
                          className={`touch-target tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-sm ${
                            se.status === "skipped"
                              ? "tw-bg-amber-900/40 tw-text-amber-300"
                              : "tw-bg-slate-700/50 tw-text-slate-400"
                          }`}
                          onClick={() =>
                            onUpdateExercise(sessionId, se.exerciseId, {
                              status: "skipped",
                            })
                          }
                        >
                          Pular
                        </button>
                        <button
                          type="button"
                          className={`touch-target tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-sm ${
                            se.status === "pending"
                              ? "tw-bg-slate-600 tw-text-slate-300"
                              : "tw-bg-slate-700/50 tw-text-slate-400"
                          }`}
                          onClick={() =>
                            onUpdateExercise(sessionId, se.exerciseId, {
                              status: "pending",
                            })
                          }
                        >
                          Pendente
                        </button>
                      </div>
                    </div>
                  )}
                  {!isOngoing && se.weight != null && se.weight > 0 && (
                    <p className="tw-mt-2 tw-text-sm tw-text-slate-400">
                      {se.weight} kg
                    </p>
                  )}
                </div>
                {embedUrl && (
                  <button
                    type="button"
                    className="touch-target tw-shrink-0 tw-w-12 tw-h-12 tw-rounded-full tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold tw-flex tw-items-center tw-justify-center"
                    onClick={() => onPlayVideo(exercise.videoUrl)}
                    aria-label="Ver vídeo"
                  >
                    ▶
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {isOngoing && (
        <footer className="tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-pt-3 tw-pb-[var(--safe-bottom)] tw-px-4 tw-bg-gradient-to-t tw-from-background tw-to-background/95 tw-border-t tw-border-slate-700/50">
          <div className="tw-flex tw-gap-2">
            <button
              type="button"
              className="touch-target tw-flex-1 tw-py-3 tw-rounded-xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold"
              onClick={() => onFinish(sessionId)}
            >
              Finalizar sessão
            </button>
            <button
              type="button"
              className="touch-target tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-slate-500/50 tw-text-slate-400 tw-text-sm"
              onClick={() => onCancel(sessionId)}
            >
              Cancelar
            </button>
          </div>
        </footer>
      )}

      {!isOngoing && (
        <div className="tw-px-4 tw-pb-4">
          <span
            className={`tw-inline-block tw-text-xs tw-px-2 tw-py-1 tw-rounded-full tw-font-medium ${
              session.status === "finished"
                ? "tw-bg-slate-700/50 tw-text-slate-300"
                : "tw-bg-slate-700/30 tw-text-slate-400"
            }`}
          >
            {session.status === "finished"
              ? "Sessão concluída"
              : "Sessão cancelada"}
          </span>
          {session.finishedAt != null && (
            <p className="tw-text-xs tw-text-slate-500 tw-mt-1">
              Fim: {formatDateTime(session.finishedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
