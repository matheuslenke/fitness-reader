interface ProfileHeaderProps {
  name: string;
}

export function ProfileHeader({ name }: ProfileHeaderProps) {
  return (
    <div className="tw-text-center tw-py-6 tw-px-4">
      <h1 className="tw-text-2xl tw-font-bold tw-bg-gradient-to-r tw-from-emerald-600 tw-to-teal-500 tw-bg-clip-text tw-text-transparent">
        {name}
      </h1>
      <p className="tw-text-sm tw-text-zinc-500 tw-dark:tw-text-zinc-400 tw-mt-1">
        Treino
      </p>
    </div>
  );
}
