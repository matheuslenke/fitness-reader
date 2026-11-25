import { ActivityIndicator } from "./LoadingScreen";

type AuthPageProps = {
  errorMessage: string | null;
  isSubmitting: boolean;
  onSignInWithGoogle: () => Promise<void>;
};

export function AuthPage({
  errorMessage,
  isSubmitting,
  onSignInWithGoogle,
}: AuthPageProps) {
  return (
    <main className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-px-4 tw-py-10">
      <div className="glass-panel tw-w-full tw-max-w-md tw-rounded-[2rem] tw-p-6 tw-space-y-6 page-enter">
        <div className="tw-text-center tw-space-y-2">
          <p className="tw-text-xs tw-uppercase tw-tracking-[0.35em] tw-text-lime-300/80">
            Fitness Reader
          </p>
          <h1 className="tw-font-display tw-text-3xl tw-font-black tw-text-slate-50">
            Entrar com Google
          </h1>
          <p className="tw-text-sm tw-text-slate-400">
            Seus treinos ficam salvos na sua conta e acompanham você em qualquer
            dispositivo.
          </p>
        </div>

        {errorMessage && (
          <div className="tw-rounded-2xl tw-border tw-border-red-500/40 tw-bg-red-500/10 tw-px-4 tw-py-3 tw-text-sm tw-text-red-100">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          className="touch-target tw-w-full tw-gap-3 tw-rounded-2xl tw-bg-slate-50 tw-px-4 tw-py-3 tw-font-display tw-text-base tw-font-black tw-text-slate-950 tw-transition-transform active:tw-scale-[0.96] disabled:tw-cursor-wait disabled:tw-opacity-70"
          onClick={() => {
            void onSignInWithGoogle();
          }}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator />
          ) : (
            <span
              aria-hidden
              className="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-white tw-text-sm"
            >
              G
            </span>
          )}
          {isSubmitting ? "Abrindo Google..." : "Continuar com Google"}
        </button>
      </div>
    </main>
  );
}
