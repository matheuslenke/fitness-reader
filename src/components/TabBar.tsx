interface TabBarProps {
  groups: string[];
  active: string;
  onChange: (group: string) => void;
}

export function TabBar({ groups, active, onChange }: TabBarProps) {
  const list = groups.length > 0 ? groups : ["A", "B", "C", "D", "E"];
  return (
    <div className="app-card tw-flex tw-gap-1 tw-p-2 tw-rounded-2xl tw-overflow-x-auto">
      {list.map((g) => (
        <button
          key={g}
          type="button"
          className={`touch-target tw-min-w-12 tw-flex-1 tw-py-2.5 tw-rounded-xl tw-font-display tw-font-bold tw-transition-[color,background-color,transform] active:tw-scale-[0.96] ${
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
