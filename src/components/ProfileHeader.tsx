interface ProfileHeaderProps {
  name: string;
}

export function ProfileHeader({ name }: ProfileHeaderProps) {
  return (
    <div className="tw-text-center tw-py-6 tw-px-4">
      <h1 className="tw-font-display tw-text-2xl tw-font-extrabold tw-bg-active-gradient tw-bg-clip-text tw-text-transparent">
        {name}
      </h1>
      <p className="tw-text-sm tw-text-slate-400 tw-mt-1">
        Treino
      </p>
    </div>
  );
}
