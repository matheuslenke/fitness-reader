import type { AppData } from "../types/fitness";
import { getGlobalMetrics } from "../lib/storage";
import { formatDate } from "../lib/utils";
import { GlobalMetricsCards } from "./GlobalMetricsCards";
import { ProgressGallery } from "./ProgressGallery";
import { SimpleLineChart } from "./SimpleLineChart";

interface ProfilePageProps {
  data: AppData;
  username: string;
  onOpenMetricsModal: () => void;
  onOpenPhotoModal: () => void;
  onLogout: () => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfilePage({
  data,
  username,
  onOpenMetricsModal,
  onOpenPhotoModal,
  onLogout,
}: ProfilePageProps) {
  const global = getGlobalMetrics(data);
  const metrics = global.allMetrics ?? [];
  const weightData = metrics.filter((metric) => metric.bodyWeight != null);
  const bodyFatData = metrics.filter((metric) => metric.bodyFatPercent != null);
  const photos = data.profile.progressPhotos ?? [];

  return (
    <div className="page-enter tw-min-h-full tw-pb-4">
      <header className="tw-pt-[calc(var(--safe-top)+1rem)] tw-px-4 tw-pb-5">
        <div className="tw-flex tw-items-center tw-gap-4">
          <div className="tw-grid tw-h-16 tw-w-16 tw-shrink-0 tw-place-items-center tw-rounded-[1.35rem] tw-bg-active-gradient tw-font-display tw-text-xl tw-font-extrabold tw-text-slate-950 tw-shadow-[0_14px_32px_rgba(132,204,22,0.18)]">
            {getInitials(data.profile.name) || "AT"}
          </div>
          <div className="tw-min-w-0 tw-flex-1">
            <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary">
              Perfil
            </p>
            <h1 className="tw-mt-1 tw-truncate tw-font-display tw-text-2xl tw-font-extrabold tw-text-slate-50">
              {data.profile.name}
            </h1>
            <p className="tw-mt-0.5 tw-truncate tw-text-sm tw-text-slate-400">
              {username}
            </p>
          </div>
        </div>
      </header>

      <GlobalMetricsCards
        weight={global.weight}
        bodyFat={global.bodyFat}
        exerciseCount={global.exerciseCount}
      />

      <div className="tw-grid tw-grid-cols-2 tw-gap-3 tw-px-4 tw-mb-7">
        <button
          type="button"
          className="touch-target tw-rounded-2xl tw-bg-active-gradient tw-px-4 tw-py-3 tw-font-display tw-text-sm tw-font-bold tw-text-slate-950 tw-shadow-lg tw-transition-transform active:tw-scale-[0.96]"
          onClick={onOpenMetricsModal}
        >
          + Peso e gordura
        </button>
        <button
          type="button"
          className="touch-target app-card tw-rounded-2xl tw-px-4 tw-py-3 tw-font-display tw-text-sm tw-font-bold tw-text-slate-100 tw-transition-transform active:tw-scale-[0.96]"
          onClick={onOpenPhotoModal}
        >
          + Foto de progresso
        </button>
      </div>

      <section className="tw-px-4 tw-mb-7">
        <div className="tw-flex tw-items-end tw-justify-between tw-gap-3 tw-mb-3">
          <div>
            <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-slate-500">
              Evolução
            </p>
            <h2 className="tw-mt-1 tw-font-display tw-text-xl tw-font-bold tw-text-slate-50">
              Seu progresso
            </h2>
          </div>
          <span className="tw-text-xs tw-text-slate-500 tabular-nums">
            {metrics.length} registro{metrics.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="tw-grid tw-gap-3 md:tw-grid-cols-2">
          <div className="app-card tw-rounded-3xl tw-p-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
              <h3 className="tw-font-display tw-font-bold tw-text-slate-100">Peso</h3>
              <span className="tw-text-sm tw-font-semibold tw-text-primary tabular-nums">
                {global.weight != null ? `${global.weight} kg` : "—"}
              </span>
            </div>
            <div className="tw-mt-2 tw-h-32">
              <SimpleLineChart
                data={weightData}
                valueKey="bodyWeight"
                labelKey="date"
                color="#bef264"
              />
            </div>
          </div>
          <div className="app-card tw-rounded-3xl tw-p-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
              <h3 className="tw-font-display tw-font-bold tw-text-slate-100">
                Gordura corporal
              </h3>
              <span className="tw-text-sm tw-font-semibold tw-text-secondary tabular-nums">
                {global.bodyFat != null ? `${global.bodyFat}%` : "—"}
              </span>
            </div>
            <div className="tw-mt-2 tw-h-32">
              <SimpleLineChart
                data={bodyFatData}
                valueKey="bodyFatPercent"
                labelKey="date"
                color="#a855f7"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="tw-mb-7">
        <ProgressGallery photos={photos} onAdd={onOpenPhotoModal} />
      </section>

      <section className="tw-px-4">
        <h2 className="tw-font-display tw-text-lg tw-font-bold tw-text-slate-50">
          Registros recentes
        </h2>
        <div className="app-card tw-mt-3 tw-overflow-hidden tw-rounded-3xl">
          {metrics.length === 0 ? (
            <p className="tw-p-5 tw-text-sm tw-text-slate-400 tw-text-pretty">
              Registre seu peso para começar a acompanhar a evolução.
            </p>
          ) : (
            <ul>
              {metrics.slice(0, 6).map((metric, index) => (
                <li
                  key={`${metric.date}-${index}`}
                  className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-b tw-border-slate-700/55 tw-px-4 tw-py-3 last:tw-border-0"
                >
                  <time className="tw-text-sm tw-text-slate-400 tabular-nums">
                    {formatDate(metric.date)}
                  </time>
                  <div className="tw-flex tw-items-center tw-gap-3 tw-text-sm tabular-nums">
                    <span className="tw-font-semibold tw-text-slate-100">
                      {metric.bodyWeight} kg
                    </span>
                    <span className="tw-min-w-[3rem] tw-text-right tw-text-slate-400">
                      {metric.bodyFatPercent != null
                        ? `${metric.bodyFatPercent}%`
                        : "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="tw-px-4 tw-pt-8">
        <button
          type="button"
          className="touch-target tw-w-full tw-rounded-2xl tw-bg-slate-900/45 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-slate-400 tw-shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)] tw-transition-[color,background-color,transform] hover:tw-bg-slate-800/70 hover:tw-text-slate-200 active:tw-scale-[0.96]"
          onClick={onLogout}
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
