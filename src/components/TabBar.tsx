interface TabBarProps {
  active: string;
  onChange: (group: string) => void;
}

const GROUPS = ["A", "B", "C", "D", "E"];

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="tw-flex tw-gap-1 tw-p-2 tw-bg-zinc-200 tw-dark:tw-bg-zinc-800 tw-rounded-2xl">
      {GROUPS.map((g) => (
        <button
          key={g}
          type="button"
          className={`touch-target tw-flex-1 tw-py-2.5 tw-rounded-xl tw-font-medium tw-transition-colors ${
            active === g
              ? "tw-bg-white tw-dark:tw-bg-zinc-700 tw-shadow tw-text-emerald-600 tw-dark:tw-text-emerald-400"
              : "tw-text-zinc-600 tw-dark:tw-text-zinc-400"
          }`}
          onClick={() => onChange(g)}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
