export type PrimaryTab =
  | "home"
  | "workout"
  | "sessions"
  | "profile"
  | "more";

interface AppTabBarProps {
  active: PrimaryTab;
  onChange: (tab: PrimaryTab) => void;
}

type IconName = PrimaryTab;

function TabIcon({ name }: { name: IconName }) {
  const commonProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...commonProps}>
        <path d="m3 11 9-8 9 8" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    );
  }

  if (name === "workout") {
    return (
      <svg {...commonProps}>
        <path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11" />
      </svg>
    );
  }

  if (name === "sessions") {
    return (
      <svg {...commonProps}>
        <path d="M7 3h10v4H7z" />
        <path d="M5 5v16h14V5" />
        <path d="m8.5 13 2 2 5-5" />
      </svg>
    );
  }

  if (name === "profile") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21c.6-4.2 3-6.3 7-6.3s6.4 2.1 7 6.3" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

const tabs: Array<{ id: PrimaryTab; label: string }> = [
  { id: "home", label: "Início" },
  { id: "workout", label: "Treino" },
  { id: "sessions", label: "Sessões" },
  { id: "profile", label: "Perfil" },
  { id: "more", label: "Mais" },
];

export function AppTabBar({ active, onChange }: AppTabBarProps) {
  return (
    <nav className="app-tab-bar" aria-label="Navegação principal">
      <div className="app-tab-bar__inner">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`app-tab-bar__item ${isActive ? "is-active" : ""}`}
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="app-tab-bar__icon">
                <TabIcon name={tab.id} />
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
