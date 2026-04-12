import { useCallback, useMemo, useState } from "react";

export type AuthMode = "login" | "register";

type AuthSubmitPayload = {
  mode: AuthMode;
  username: string;
  password: string;
};

type AuthPageProps = {
  errorMessage: string | null;
  isSubmitting: boolean;
  onAuthenticate: (payload: AuthSubmitPayload) => Promise<void>;
};

const AUTH_COPY: Record<
  AuthMode,
  { title: string; subtitle: string; button: string; toggle: string }
> = {
  login: {
    title: "Entrar na conta",
    subtitle: "Seu treino fica salvo por usuário no banco de dados.",
    button: "Entrar",
    toggle: "Criar conta",
  },
  register: {
    title: "Criar conta",
    subtitle: "A primeira conta pode assumir os dados já existentes deste app.",
    button: "Criar conta",
    toggle: "Já tenho conta",
  },
};

export function AuthPage({
  errorMessage,
  isSubmitting,
  onAuthenticate,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);

  const copy = useMemo(() => AUTH_COPY[mode], [mode]);

  const handleModeChange = useCallback((nextMode: AuthMode) => {
    setMode(nextMode);
    setLocalErrorMessage(null);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLocalErrorMessage(null);

      if (!username.trim()) {
        setLocalErrorMessage("Informe seu nome de usuário.");
        return;
      }

      if (!password) {
        setLocalErrorMessage("Informe sua senha.");
        return;
      }

      if (mode === "register" && password !== confirmPassword) {
        setLocalErrorMessage("A confirmação de senha não confere.");
        return;
      }

      await onAuthenticate({
        mode,
        username,
        password,
      });
    },
    [confirmPassword, mode, onAuthenticate, password, username],
  );

  const nextMode: AuthMode = mode === "login" ? "register" : "login";
  const activeErrorMessage = localErrorMessage ?? errorMessage;

  return (
    <main className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-px-4 tw-py-10">
      <div className="glass-panel tw-w-full tw-max-w-md tw-rounded-[2rem] tw-p-6 tw-space-y-6 page-enter">
        <div className="tw-text-center tw-space-y-2">
          <p className="tw-text-xs tw-uppercase tw-tracking-[0.35em] tw-text-lime-300/80">
            Fitness Reader
          </p>
          <h1 className="tw-font-display tw-text-3xl tw-font-black tw-text-slate-50">
            {copy.title}
          </h1>
          <p className="tw-text-sm tw-text-slate-400">{copy.subtitle}</p>
        </div>

        <form className="tw-space-y-4" onSubmit={handleSubmit}>
          <label className="tw-block tw-space-y-2">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.25em] tw-text-slate-400">
              Usuário
            </span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="matheus"
              className="tw-w-full tw-rounded-2xl tw-border tw-border-slate-600/60 tw-bg-slate-950/60 tw-px-4 tw-py-3 tw-text-slate-50 placeholder:tw-text-slate-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-lime-300/40"
              disabled={isSubmitting}
            />
          </label>

          <label className="tw-block tw-space-y-2">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.25em] tw-text-slate-400">
              Senha
            </span>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="tw-w-full tw-rounded-2xl tw-border tw-border-slate-600/60 tw-bg-slate-950/60 tw-px-4 tw-py-3 tw-text-slate-50 placeholder:tw-text-slate-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-lime-300/40"
              disabled={isSubmitting}
            />
          </label>

          {mode === "register" && (
            <label className="tw-block tw-space-y-2">
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.25em] tw-text-slate-400">
                Confirmar senha
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                className="tw-w-full tw-rounded-2xl tw-border tw-border-slate-600/60 tw-bg-slate-950/60 tw-px-4 tw-py-3 tw-text-slate-50 placeholder:tw-text-slate-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-lime-300/40"
                disabled={isSubmitting}
              />
            </label>
          )}

          {activeErrorMessage && (
            <div className="tw-rounded-2xl tw-border tw-border-red-500/40 tw-bg-red-500/10 tw-px-4 tw-py-3 tw-text-sm tw-text-red-100">
              {activeErrorMessage}
            </div>
          )}

          <button
            type="submit"
            className="touch-target tw-w-full tw-rounded-2xl tw-bg-active-gradient tw-px-4 tw-py-3 tw-font-display tw-text-base tw-font-black tw-text-slate-950 disabled:tw-opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : copy.button}
          </button>
        </form>

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-text-sm tw-text-slate-400">
          <span>
            {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}
          </span>
          <button
            type="button"
            className="tw-font-semibold tw-text-lime-300"
            onClick={() => handleModeChange(nextMode)}
            disabled={isSubmitting}
          >
            {copy.toggle}
          </button>
        </div>
      </div>
    </main>
  );
}
