interface ProfileHeaderProps {
  name: string;
  username: string;
  onLogout: () => void;
}

export function ProfileHeader({
  name,
  username,
  onLogout,
}: ProfileHeaderProps) {
  return (
    <div className="tw-py-6 tw-px-4">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-flex-1 tw-text-center">
          <h1 className="tw-font-display tw-text-2xl tw-font-extrabold tw-bg-active-gradient tw-bg-clip-text tw-text-transparent">
            {name}
          </h1>
          <p className="tw-text-sm tw-text-slate-400 tw-mt-1">
            @{username}
          </p>
        </div>

        <button
          type="button"
          className="touch-target tw-rounded-full tw-border tw-border-slate-500/50 tw-bg-slate-900/50 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-slate-200"
          onClick={onLogout}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
