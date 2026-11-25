import type { TrainingPreparation } from "../types/fitness";

type WorkoutPreparationProps = {
  preparation: TrainingPreparation | undefined;
};

export function WorkoutPreparation({ preparation }: WorkoutPreparationProps) {
  if (!preparation) return null;

  return (
    <details className="app-card workout-preparation tw-rounded-2xl">
      <summary className="tw-min-h-11 tw-cursor-pointer tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-slate-200">
        Preparação e orientações
      </summary>
      <div className="tw-space-y-4 tw-px-4 tw-pb-4 tw-text-sm tw-text-slate-400">
        <div>
          <h3 className="tw-font-semibold tw-text-slate-200">
            Mobilidade e alongamento
          </h3>
          <p className="tw-mt-1 tw-text-xs">Antes da musculação</p>
          <ul className="tw-mt-2 tw-space-y-2">
            {preparation.movements.map((movement) => (
              <li key={movement.name}>
                <a
                  href={movement.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tw-text-primary tw-underline tw-decoration-primary/30 tw-underline-offset-4"
                >
                  {movement.name}
                </a>
                <span> · {movement.prescription}</span>
              </li>
            ))}
          </ul>
        </div>
        {preparation.guidance && preparation.guidance.length > 0 && (
          <div className="tw-space-y-2">
            <h3 className="tw-font-semibold tw-text-slate-200">
              Orientações gerais
            </h3>
            {preparation.guidance.map((guidance) => (
              <p key={guidance.title}>
                <strong className="tw-text-slate-300">{guidance.title}: </strong>
                {guidance.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
