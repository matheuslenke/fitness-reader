import { getEmbedUrl } from "../lib/utils";
import type { Exercise, SessionExerciseStatus } from "../types/fitness";

type ExerciseOverview = {
  exercise: Exercise;
  status: SessionExerciseStatus;
  weight: string;
  completedSets: number;
  totalSets: number;
};

type SessionExerciseListProps = {
  exercises: ExerciseOverview[];
  activeExerciseId: string;
  onSelectExercise: (exerciseId: string) => void;
  onPlayVideo: (exercise: Exercise) => void;
};

const STATUS_LABELS: Record<SessionExerciseStatus, string> = {
  pending: "Pendente",
  completed: "Concluído",
  skipped: "Pulado",
};

export function SessionExerciseList({
  exercises,
  activeExerciseId,
  onSelectExercise,
  onPlayVideo,
}: SessionExerciseListProps) {
  return (
    <ol className="session-exercise-list" aria-label="Todos os exercícios do treino">
      {exercises.map(({ exercise, status, weight, completedSets, totalSets }, index) => {
        const isActive = exercise.id === activeExerciseId;

        return (
          <li
            key={exercise.id}
            className={`session-exercise-list__item ${isActive ? "is-active" : ""}`}
            data-status={status}
          >
            <button
              type="button"
              className="session-exercise-list__select"
              onClick={() => onSelectExercise(exercise.id)}
              aria-label={`Abrir exercício ${index + 1}: ${exercise.name}`}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="session-exercise-list__number tabular-nums" aria-hidden>
                {status === "completed" ? "✓" : String(index + 1).padStart(2, "0")}
              </span>
              <span className="session-exercise-list__details">
                <span className="session-exercise-list__status">
                  {STATUS_LABELS[status]}
                  {isActive ? " · Selecionado" : ""}
                </span>
                <span className="session-exercise-list__name tw-font-display">{exercise.name}</span>
                <span className="session-exercise-list__prescription tabular-nums">
                  {exercise.sets} séries · {exercise.reps} reps
                </span>
                <span className="session-exercise-list__parameters">
                  {[
                    exercise.rest ? `Descanso ${exercise.rest}` : null,
                    exercise.cadence ? `Cadência ${exercise.cadence}` : null,
                    exercise.rpe ? `RPE ${exercise.rpe}` : null,
                    exercise.load ? `Carga ${exercise.load}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="session-exercise-list__progress tabular-nums">
                  {completedSets}/{totalSets} séries feitas
                  {weight.trim() ? ` · ${weight} kg registrados` : ""}
                </span>
              </span>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {getEmbedUrl(exercise.videoUrl) && (
              <button
                type="button"
                className="touch-target session-exercise-list__video"
                onClick={() => onPlayVideo(exercise)}
                aria-label={`Assistir execução de ${exercise.name}`}
                title="Assistir execução"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                  <path d="m9 6 9 6-9 6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
