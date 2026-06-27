import type { Exercise, WeightEntry } from "../types/fitness";
import { getEmbedUrl } from "../lib/utils";
import { WeightHistory } from "./WeightHistory";

interface ExerciseCardProps {
  exercise: Exercise;
  currentWeight: string;
  weightHistory: WeightEntry[];
  onPlayVideo: (exercise: Exercise) => void;
  onEditWeight: (exercise: Exercise) => void;
}

export function ExerciseCard({
  exercise,
  currentWeight,
  weightHistory,
  onPlayVideo,
  onEditWeight,
}: ExerciseCardProps) {
  const embedUrl = getEmbedUrl(exercise.videoUrl);
  return (
    <article className="app-card tw-rounded-3xl tw-p-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        <div className="tw-flex-1 tw-min-w-0">
          <h3 className="tw-font-display tw-font-bold tw-text-slate-50 tw-text-base tw-leading-tight">
            {exercise.name}
          </h3>
          <p className="tw-text-sm tw-text-slate-400 tw-mt-1">
            {exercise.sets} × {exercise.reps}
          </p>
          <button
            type="button"
            className="tw-mt-3 tw-px-4 tw-py-2.5 tw-rounded-xl tw-bg-slate-800/80 tw-text-slate-50 tw-text-sm tw-font-semibold touch-target tw-shadow-[inset_0_0_0_1px_rgba(148,163,184,0.14)] tw-transition-transform active:tw-scale-[0.96]"
            onClick={() => onEditWeight(exercise)}
          >
            {currentWeight ? `${currentWeight} kg` : "Carga"}
          </button>
        </div>
        {embedUrl && (
          <button
            type="button"
            className="play-button touch-target tw-shrink-0 tw-w-12 tw-h-12 tw-rounded-2xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold tw-flex tw-items-center tw-justify-center tw-shadow-[0_10px_24px_rgba(132,204,22,0.2)] tw-transition-transform active:tw-scale-[0.96]"
            onClick={() => onPlayVideo(exercise)}
            aria-label="Ver vídeo"
          >
            <span aria-hidden>▶</span>
          </button>
        )}
      </div>
      <WeightHistory entries={weightHistory} />
    </article>
  );
}
