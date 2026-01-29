import type { Exercise } from "../types/fitness";
import { getEmbedUrl } from "../lib/utils";

interface ExerciseCardProps {
  exercise: Exercise;
  currentWeight: string;
  onPlayVideo: (url: string) => void;
  onEditWeight: (exercise: Exercise) => void;
}

export function ExerciseCard({
  exercise,
  currentWeight,
  onPlayVideo,
  onEditWeight,
}: ExerciseCardProps) {
  const embedUrl = getEmbedUrl(exercise.videoUrl);
  return (
    <div className="tw-bg-white tw-dark:tw-bg-zinc-800 tw-rounded-2xl tw-p-4 tw-shadow-sm tw-border tw-border-zinc-200 tw-dark:tw-border-zinc-700">
      <div className="tw-flex tw-items-start tw-gap-3">
        <div className="tw-flex-1 tw-min-w-0">
          <h3 className="tw-font-semibold tw-text-base tw-leading-tight">
            {exercise.name}
          </h3>
          <p className="tw-text-sm tw-text-zinc-500 tw-dark:tw-text-zinc-400 tw-mt-1">
            {exercise.sets} × {exercise.reps}
          </p>
          <button
            type="button"
            className="tw-mt-3 tw-px-4 tw-py-2.5 tw-rounded-xl tw-bg-zinc-100 tw-dark:tw-bg-zinc-700 tw-text-sm tw-font-medium touch-target"
            onClick={() => onEditWeight(exercise)}
          >
            {currentWeight ? `${currentWeight} kg` : "Carga"}
          </button>
        </div>
        {embedUrl && (
          <button
            type="button"
            className="touch-target tw-shrink-0 tw-w-12 tw-h-12 tw-rounded-full tw-bg-emerald-600 tw-text-white tw-flex tw-items-center tw-justify-center"
            onClick={() => onPlayVideo(exercise.videoUrl)}
            aria-label="Ver vídeo"
          >
            ▶
          </button>
        )}
      </div>
    </div>
  );
}
