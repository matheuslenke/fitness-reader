import type { AppData, Session } from "../types/fitness";
import { getSeriesById } from "../lib/storage";
import { formatDateTime } from "../lib/utils";

interface SessionsPageProps {
  data: AppData;
  onBack?: () => void;
  onSelectSession: (sessionId: string) => void;
  onCancelSession: (sessionId: string) => void;
}

const SESSION_STATUS_LABEL: Record<Session["status"], string> = {
  ongoing: "Em andamento",
  finished: "Concluída",
  canceled: "Cancelada",
};

const SESSION_STATUS_CLASS: Record<Session["status"], string> = {
  ongoing: "tw-bg-primary-dim tw-text-primary tw-border tw-border-primary/30",
  finished: "tw-bg-slate-700/50 tw-text-slate-300 tw-border tw-border-slate-600/50",
  canceled: "tw-bg-slate-700/30 tw-text-slate-400 tw-border tw-border-slate-600/30",
};

export function SessionsPage({
  data,
  onBack,
  onSelectSession,
  onCancelSession,
}: SessionsPageProps) {
  const sessions = data.sessions ?? [];

  return (
    <div className="page-enter tw-min-h-full">
      <header className="tw-sticky tw-top-0 tw-z-10 tw-pt-[var(--safe-top)] tw-px-4 tw-py-3 tw-bg-gradient-to-b tw-from-background tw-to-background/95 tw-border-b tw-border-slate-700/50 tw-flex tw-items-center tw-gap-2">
        {onBack != null && (
          <button
            type="button"
            className="touch-target tw-text-primary tw-font-medium"
            onClick={onBack}
          >
            ← Voltar
          </button>
        )}
        <h1 className="tw-flex-1 tw-font-display tw-text-lg tw-font-bold tw-text-slate-50">
          Sessões
        </h1>
      </header>
      <main className="tw-p-4 tw-space-y-4">
        {sessions.length === 0 ? (
          <div className="tw-bg-surface tw-rounded-2xl tw-p-6 tw-text-center tw-border tw-border-slate-700/50">
            <p className="tw-text-slate-400">
              Nenhuma sessão. Entre em uma série e use &quot;Iniciar agora&quot; para
              registrar um treino.
            </p>
          </div>
        ) : (
          <ul className="tw-space-y-3">
            {sessions.map((session) => {
              const series = getSeriesById(data, session.seriesId);
              const seriesName = series?.name ?? "Série";
              return (
                <li
                  key={session.id}
                  className="tw-bg-surface tw-rounded-2xl tw-p-4 tw-border tw-border-slate-700/50"
                >
                  <div className="tw-flex tw-items-start tw-justify-between tw-gap-2">
                    <div className="tw-min-w-0 tw-flex-1">
                      <h3 className="tw-font-display tw-font-bold tw-text-slate-50">
                        {seriesName} – Dia {session.group}
                      </h3>
                      <p className="tw-text-sm tw-text-slate-400 tw-mt-0.5">
                        Início: {formatDateTime(session.startedAt)}
                      </p>
                      {session.finishedAt != null && (
                        <p className="tw-text-sm tw-text-slate-400">
                          Fim: {formatDateTime(session.finishedAt)}
                        </p>
                      )}
                      <span
                        className={`tw-inline-block tw-mt-2 tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full tw-font-medium ${
                          SESSION_STATUS_CLASS[session.status]
                        }`}
                      >
                        {SESSION_STATUS_LABEL[session.status]}
                      </span>
                    </div>
                    <div className="tw-flex tw-flex-col tw-gap-1 tw-shrink-0">
                      {session.status === "ongoing" && (
                        <>
                          <button
                            type="button"
                            className="touch-target tw-px-3 tw-py-1.5 tw-rounded-xl tw-bg-active-gradient tw-text-slate-900 tw-text-sm tw-font-medium"
                            onClick={() => onSelectSession(session.id)}
                          >
                            Continuar
                          </button>
                          <button
                            type="button"
                            className="touch-target tw-px-3 tw-py-1.5 tw-rounded-xl tw-border tw-border-slate-500/50 tw-text-slate-400 tw-text-sm"
                            onClick={() => onCancelSession(session.id)}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {session.status !== "ongoing" && (
                        <button
                          type="button"
                          className="touch-target tw-px-3 tw-py-1.5 tw-rounded-xl tw-bg-slate-700/80 tw-text-slate-50 tw-text-sm"
                          onClick={() => onSelectSession(session.id)}
                        >
                          Ver
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
