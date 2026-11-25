type LoadingPhase = "session" | "data";

type LoadingScreenProps = {
  phase: LoadingPhase;
};

type ActivityIndicatorProps = {
  className?: string;
  label?: string;
  size?: "small" | "medium";
};

const LOADING_CONTENT: Record<
  LoadingPhase,
  { title: string; description: string; status: string }
> = {
  session: {
    title: "Preparando seu treino",
    description: "Validando seu acesso para manter seus dados protegidos.",
    status: "Conectando à sua conta",
  },
  data: {
    title: "Sincronizando seu progresso",
    description: "Buscando sua série, cargas e sessões mais recentes.",
    status: "Carregando seus dados",
  },
};

export function ActivityIndicator({
  className = "",
  label,
  size = "small",
}: ActivityIndicatorProps) {
  return (
    <span
      className={`activity-indicator activity-indicator--${size} ${className}`}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle className="activity-indicator__track" cx="12" cy="12" r="9" />
        <path
          className="activity-indicator__arc"
          d="M12 3a9 9 0 0 1 8.55 6.2"
        />
      </svg>
    </span>
  );
}

function LoadingMark() {
  return (
    <div className="loading-mark" aria-hidden>
      <span className="loading-mark__glow" />
      <svg viewBox="0 0 80 80">
        <path
          className="loading-mark__bar"
          d="M22 40h36M18 29v22M11 33v14m51-18v22m7-18v14M27 33v14m26-14v14"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function LoadingPreview() {
  return (
    <div className="loading-preview" aria-hidden>
      <div className="loading-preview__header">
        <div>
          <span className="loading-skeleton loading-skeleton--eyebrow" />
          <span className="loading-skeleton loading-skeleton--title" />
        </div>
        <span className="loading-skeleton loading-skeleton--avatar" />
      </div>

      <div className="loading-preview__hero">
        <span className="loading-skeleton loading-skeleton--label" />
        <span className="loading-skeleton loading-skeleton--hero-title" />
        <span className="loading-skeleton loading-skeleton--copy" />
        <div className="loading-preview__progress">
          <span />
        </div>
        <span className="loading-skeleton loading-skeleton--button" />
      </div>

      <div className="loading-preview__metrics">
        <span className="loading-skeleton loading-skeleton--metric" />
        <span className="loading-skeleton loading-skeleton--metric" />
        <span className="loading-skeleton loading-skeleton--metric" />
      </div>
    </div>
  );
}

export function LoadingScreen({ phase }: LoadingScreenProps) {
  const content = LOADING_CONTENT[phase];

  return (
    <main
      className="loading-screen"
      role="status"
      aria-live="polite"
      aria-label={content.status}
    >
      <span className="loading-screen__glow loading-screen__glow--primary" aria-hidden />
      <span className="loading-screen__glow loading-screen__glow--secondary" aria-hidden />

      <div className="loading-screen__layout">
        <section className="loading-screen__message">
          <p className="loading-screen__brand">Fitness Reader</p>
          <LoadingMark />
          <h1>{content.title}</h1>
          <p className="loading-screen__description">{content.description}</p>

          <div className="loading-screen__status">
            <ActivityIndicator size="medium" />
            <span>{content.status}</span>
          </div>

          <div className="loading-screen__progress" aria-hidden>
            <span />
          </div>
        </section>

        <LoadingPreview />
      </div>

      <p className="loading-screen__footnote">
        Seu treino continua exatamente de onde você parou.
      </p>
    </main>
  );
}
