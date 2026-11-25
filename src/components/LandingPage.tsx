import type { AppData, Series, Session } from "../types/fitness";
import { getGlobalMetrics, getSeriesById } from "../lib/storage";
import { formatDate, formatDateTime } from "../lib/utils";

interface LandingPageProps {
  data: AppData;
  activeSeries: Series | null;
  username: string;
  ongoingSession: Session | null;
  onResumeSession: (sessionId: string) => void;
  onOpenActiveSeries: (group?: string) => void;
  onOpenProfile: () => void;
  onOpenSessions: () => void;
  onCreateSeries: () => void;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Atleta";
}

export function LandingPage({
  data,
  activeSeries,
  username,
  ongoingSession,
  onResumeSession,
  onOpenActiveSeries,
  onOpenProfile,
  onOpenSessions,
  onCreateSeries,
}: LandingPageProps) {
  const global = getGlobalMetrics(data);
  const ongoingSessionSeries = ongoingSession
    ? getSeriesById(data, ongoingSession.seriesId)
    : null;
  const completedSessionExercises =
    ongoingSession?.exercises.filter((exercise) => exercise.status === "completed")
      .length ?? 0;
  const totalSessionExercises = ongoingSession?.exercises.length ?? 0;
  const finishedSessions = data.sessions.filter(
    (session) => session.status === "finished",
  );
  const recentSessions = data.sessions
    .filter((session) => session.status !== "ongoing")
    .slice(0, 3);
  const activeGroups = activeSeries?.exercisesByGroup
    ? Object.keys(activeSeries.exercisesByGroup)
    : [];
  const displayName = firstName(data.profile.name || username);

  return (
    <div className="page-enter tw-relative tw-min-h-full tw-overflow-hidden tw-pb-4">
      <div className="home-glow" aria-hidden />
      <header className="tw-relative tw-z-[1] tw-flex tw-items-center tw-justify-between tw-gap-4 tw-pt-[calc(var(--safe-top)+1.2rem)] tw-px-4 tw-pb-7">
        <div>
          <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-primary">
            Fitness Reader
          </p>
          <h1 className="tw-mt-1 tw-font-display tw-text-3xl tw-font-extrabold tw-text-slate-50">
            Olá, {displayName}
          </h1>
          <p className="tw-mt-1 tw-text-sm tw-text-slate-400">
            Seu treino, sem distrações.
          </p>
        </div>
        <button
          type="button"
          className="touch-target tw-h-12 tw-w-12 tw-shrink-0 tw-rounded-2xl tw-bg-slate-800/80 tw-font-display tw-text-sm tw-font-extrabold tw-text-primary tw-shadow-[0_0_0_1px_rgba(190,242,100,0.18),0_10px_25px_rgba(15,23,42,0.35)] tw-transition-transform active:tw-scale-[0.96]"
          onClick={onOpenProfile}
          aria-label="Abrir perfil"
        >
          {displayName.slice(0, 2).toUpperCase()}
        </button>
      </header>

      <main className="tw-relative tw-z-[1] tw-px-4">
        {ongoingSession != null ? (
          <section className="home-hero-card tw-rounded-[2rem] tw-p-5">
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-relative tw-flex tw-h-2.5 tw-w-2.5">
                <span className="tw-absolute tw-inline-flex tw-h-full tw-w-full tw-rounded-full tw-bg-primary tw-opacity-40 tw-animate-ping" />
                <span className="tw-relative tw-inline-flex tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-primary" />
              </span>
              <p className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-primary">
                Sessão em andamento
              </p>
            </div>
            <h2 className="tw-mt-3 tw-font-display tw-text-2xl tw-font-extrabold tw-text-slate-50">
              {ongoingSessionSeries?.name ?? "Treino"} · Dia {ongoingSession.group}
            </h2>
            <p className="tw-mt-1 tw-text-sm tw-text-slate-400 tabular-nums">
              Início {formatDateTime(ongoingSession.startedAt)}
            </p>

            <div className="tw-mt-5">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-text-xs">
                <span className="tw-text-slate-400">Progresso da sessão</span>
                <span className="tw-font-semibold tw-text-slate-200 tabular-nums">
                  {completedSessionExercises}/{totalSessionExercises}
                </span>
              </div>
              <div className="tw-mt-2 tw-h-1.5 tw-overflow-hidden tw-rounded-full tw-bg-slate-950/65">
                <div
                  className="tw-h-full tw-rounded-full tw-bg-active-gradient tw-transition-[width] tw-duration-300"
                  style={{
                    width: `${
                      totalSessionExercises > 0
                        ? (completedSessionExercises / totalSessionExercises) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="touch-target tw-mt-5 tw-w-full tw-rounded-2xl tw-bg-active-gradient tw-px-5 tw-py-3.5 tw-font-display tw-font-bold tw-text-slate-950 tw-shadow-[0_12px_28px_rgba(132,204,22,0.18)] tw-transition-transform active:tw-scale-[0.96]"
              onClick={() => onResumeSession(ongoingSession.id)}
            >
              Continuar treino
              <span className="tw-ml-2" aria-hidden>
                →
              </span>
            </button>
          </section>
        ) : activeSeries != null ? (
          <section className="home-hero-card tw-rounded-[2rem] tw-p-5">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
              <div className="tw-min-w-0 tw-flex-1">
                <p className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-primary">
                  Série atual
                </p>
                <h2 className="tw-mt-2 tw-font-display tw-text-2xl tw-font-extrabold tw-text-slate-50">
                  {activeSeries.name}
                </h2>
                <p className="tw-mt-1 tw-text-sm tw-text-slate-400 tabular-nums">
                  {formatDate(activeSeries.startDate)} — {formatDate(activeSeries.endDate)}
                </p>
              </div>
              <span className="tw-shrink-0 tw-rounded-full tw-bg-primary-dim tw-px-3 tw-py-1.5 tw-text-xs tw-font-bold tw-text-primary tw-shadow-[inset_0_0_0_1px_rgba(190,242,100,0.18)]">
                Ativa
              </span>
            </div>

            {activeGroups.length > 0 && (
              <div className="tw-mt-5">
                <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-slate-500">
                  Escolha o treino
                </p>
                <div className="tw-flex tw-gap-2 tw-overflow-x-auto tw-pb-1">
                  {activeGroups.map((group) => (
                    <button
                      key={group}
                      type="button"
                      className="touch-target tw-min-w-12 tw-rounded-xl tw-bg-slate-900/55 tw-px-4 tw-py-2 tw-font-display tw-font-bold tw-text-slate-100 tw-shadow-[inset_0_0_0_1px_rgba(148,163,184,0.14)] tw-transition-[background-color,color,transform] hover:tw-bg-primary-dim hover:tw-text-primary active:tw-scale-[0.96]"
                      onClick={() => onOpenActiveSeries(group)}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="touch-target tw-mt-5 tw-w-full tw-rounded-2xl tw-bg-active-gradient tw-px-5 tw-py-3.5 tw-font-display tw-font-bold tw-text-slate-950 tw-shadow-[0_12px_28px_rgba(132,204,22,0.18)] tw-transition-transform active:tw-scale-[0.96]"
              onClick={() => onOpenActiveSeries()}
            >
              Abrir série atual
              <span className="tw-ml-2" aria-hidden>
                →
              </span>
            </button>
          </section>
        ) : (
          <section className="home-hero-card tw-rounded-[2rem] tw-p-6 tw-text-center">
            <div className="tw-mx-auto tw-grid tw-h-14 tw-w-14 tw-place-items-center tw-rounded-2xl tw-bg-primary-dim tw-text-2xl tw-text-primary">
              +
            </div>
            <h2 className="tw-mt-4 tw-font-display tw-text-xl tw-font-bold tw-text-slate-50">
              Configure sua primeira série
            </h2>
            <p className="tw-mt-2 tw-text-sm tw-text-slate-400 tw-text-pretty">
              Escolha um plano para começar a registrar treinos e cargas.
            </p>
            <button
              type="button"
              className="touch-target tw-mt-5 tw-w-full tw-rounded-2xl tw-bg-active-gradient tw-px-5 tw-py-3 tw-font-display tw-font-bold tw-text-slate-950 tw-transition-transform active:tw-scale-[0.96]"
              onClick={onCreateSeries}
            >
              Criar série
            </button>
          </section>
        )}

        <section className="tw-mt-7">
          <div className="tw-flex tw-items-end tw-justify-between tw-gap-3">
            <div>
              <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-slate-500">
                Resumo
              </p>
              <h2 className="tw-mt-1 tw-font-display tw-text-xl tw-font-bold tw-text-slate-50">
                Seu ritmo
              </h2>
            </div>
            <button
              type="button"
              className="touch-target tw-px-2 tw-text-sm tw-font-semibold tw-text-primary tw-transition-transform active:tw-scale-[0.96]"
              onClick={onOpenProfile}
            >
              Ver perfil
            </button>
          </div>
          <div className="tw-mt-3 tw-grid tw-grid-cols-3 tw-gap-2.5">
            <div className="app-card tw-rounded-2xl tw-p-3.5">
              <p className="tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-slate-500">
                Peso
              </p>
              <p className="tw-mt-2 tw-font-display tw-text-lg tw-font-bold tw-text-slate-100 tabular-nums">
                {global.weight != null ? `${global.weight}` : "—"}
                {global.weight != null && (
                  <span className="tw-ml-1 tw-text-xs tw-font-medium tw-text-slate-500">kg</span>
                )}
              </p>
            </div>
            <div className="app-card tw-rounded-2xl tw-p-3.5">
              <p className="tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-slate-500">
                Sessões
              </p>
              <p className="tw-mt-2 tw-font-display tw-text-lg tw-font-bold tw-text-slate-100 tabular-nums">
                {finishedSessions.length}
              </p>
            </div>
            <div className="app-card tw-rounded-2xl tw-p-3.5">
              <p className="tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-slate-500">
                Cargas
              </p>
              <p className="tw-mt-2 tw-font-display tw-text-lg tw-font-bold tw-text-slate-100 tabular-nums">
                {global.exerciseCount}
              </p>
            </div>
          </div>
        </section>

        <section className="tw-mt-7">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
            <h2 className="tw-font-display tw-text-xl tw-font-bold tw-text-slate-50">
              Atividade recente
            </h2>
            <button
              type="button"
              className="touch-target tw-px-2 tw-text-sm tw-font-semibold tw-text-primary tw-transition-transform active:tw-scale-[0.96]"
              onClick={onOpenSessions}
            >
              Ver todas
            </button>
          </div>
          <div className="app-card tw-mt-3 tw-overflow-hidden tw-rounded-3xl">
            {recentSessions.length === 0 ? (
              <p className="tw-p-5 tw-text-sm tw-text-slate-400 tw-text-pretty">
                Suas sessões concluídas aparecerão aqui.
              </p>
            ) : (
              <ul>
                {recentSessions.map((session) => {
                  const series = getSeriesById(data, session.seriesId);
                  return (
                    <li
                      key={session.id}
                      className="tw-flex tw-items-center tw-gap-3 tw-border-b tw-border-slate-700/55 tw-p-4 last:tw-border-0"
                    >
                      <div
                        className={`tw-grid tw-h-10 tw-w-10 tw-shrink-0 tw-place-items-center tw-rounded-xl tw-text-sm tw-font-bold ${
                          session.status === "finished"
                            ? "tw-bg-primary-dim tw-text-primary"
                            : "tw-bg-slate-800 tw-text-slate-500"
                        }`}
                      >
                        {session.group}
                      </div>
                      <div className="tw-min-w-0 tw-flex-1">
                        <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-slate-100">
                          {series?.name ?? "Série"} · Dia {session.group}
                        </p>
                        <p className="tw-mt-0.5 tw-text-xs tw-text-slate-500 tabular-nums">
                          {formatDateTime(session.startedAt)}
                        </p>
                      </div>
                      <span className="tw-text-xs tw-text-slate-500">
                        {session.status === "finished" ? "Concluída" : "Cancelada"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
