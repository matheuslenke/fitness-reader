interface TabBarProps {
  groups: string[];
  active: string;
  onChange: (group: string) => void;
}

export function TabBar({ groups, active, onChange }: TabBarProps) {
  const list = groups.length > 0 ? groups : ["A", "B", "C", "D", "E"];
  return (
    <div className="tw-flex tw-gap-1 tw-p-2 tw-bg-background/80 tw-rounded-2xl tw-border tw-border-slate-700/50">
      {list.map((g) => (
        <button
          key={g}
          type="button"
          className={`touch-target tw-flex-1 tw-py-2.5 tw-rounded-xl tw-font-display tw-font-bold tw-transition-colors ${
            active === g
              ? "tw-bg-active-gradient tw-text-slate-900 tw-shadow"
              : "tw-text-slate-400"
          }`}
          onClick={() => onChange(g)}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
