import type { AppSnapshot, Session, ViewKey } from "../types/fitness";
import { getSeriesById, getSessionById } from "./storage";

const NAVIGATION_STORAGE_PREFIX = "fitness-reader.navigation.v1";

export type StoredNavigationState = {
  view: ViewKey;
  selectedSeriesId: string | null;
  selectedSessionId: string | null;
  activeGroup: string;
};

const VIEW_KEYS = new Set<ViewKey>([
  "landing",
  "series",
  "metrics",
  "profile",
  "more",
  "history",
  "sessions",
  "session-tracker",
]);

function getNavigationStorageKey(userId: string): string {
  return `${NAVIGATION_STORAGE_PREFIX}.${userId}`;
}

function isViewKey(value: unknown): value is ViewKey {
  return typeof value === "string" && VIEW_KEYS.has(value as ViewKey);
}

function isStoredNavigationState(value: unknown): value is StoredNavigationState {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isViewKey(candidate.view) &&
    (typeof candidate.selectedSeriesId === "string" ||
      candidate.selectedSeriesId === null) &&
    (typeof candidate.selectedSessionId === "string" ||
      candidate.selectedSessionId === null) &&
    typeof candidate.activeGroup === "string"
  );
}

export function getDefaultNavigationState(): StoredNavigationState {
  return {
    view: "landing",
    selectedSeriesId: null,
    selectedSessionId: null,
    activeGroup: "A",
  };
}

export function readStoredNavigationState(
  userId: string,
): StoredNavigationState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getNavigationStorageKey(userId));

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);
    return isStoredNavigationState(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function writeStoredNavigationState(
  userId: string,
  navigation: StoredNavigationState,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getNavigationStorageKey(userId),
      JSON.stringify(navigation),
    );
  } catch {
    // Storage may be unavailable in private browsing. Runtime navigation still works.
  }
}

export function getOngoingSession(snapshot: AppSnapshot): Session | null {
  return snapshot.sessions.find((session) => session.status === "ongoing") ?? null;
}

function getGroupsForSeries(
  snapshot: AppSnapshot,
  seriesId: string | null,
): string[] {
  const series = seriesId ? getSeriesById(snapshot, seriesId) : null;

  if (
    series?.exercisesByGroup != null &&
    Object.keys(series.exercisesByGroup).length > 0
  ) {
    return Object.keys(series.exercisesByGroup);
  }

  return (
    snapshot.templateLibrary.templates[0]?.groups?.map((group) => group.group) ??
    ["A", "B", "C", "D", "E"]
  );
}

function resolveActiveGroup(
  snapshot: AppSnapshot,
  seriesId: string | null,
  activeGroup: string,
): string {
  const groups = getGroupsForSeries(snapshot, seriesId);
  return groups.includes(activeGroup) ? activeGroup : groups[0] ?? "A";
}

export function normalizeNavigationState(
  snapshot: AppSnapshot,
  navigation: StoredNavigationState,
): StoredNavigationState {
  if (navigation.view === "metrics") {
    return {
      ...navigation,
      view: "profile",
      selectedSeriesId: null,
      selectedSessionId: null,
      activeGroup: resolveActiveGroup(snapshot, null, navigation.activeGroup),
    };
  }

  if (navigation.view === "session-tracker") {
    const session = navigation.selectedSessionId
      ? getSessionById(snapshot, navigation.selectedSessionId)
      : null;
    const series = session ? getSeriesById(snapshot, session.seriesId) : null;

    if (!session || !series) {
      return { ...getDefaultNavigationState(), view: "sessions" };
    }

    return {
      view: "session-tracker",
      selectedSeriesId: session.seriesId,
      selectedSessionId: session.id,
      activeGroup: resolveActiveGroup(snapshot, session.seriesId, session.group),
    };
  }

  if (navigation.view === "series" || navigation.view === "history") {
    const series = navigation.selectedSeriesId
      ? getSeriesById(snapshot, navigation.selectedSeriesId)
      : null;

    if (!series) {
      return getDefaultNavigationState();
    }

    return {
      ...navigation,
      selectedSessionId: null,
      activeGroup: resolveActiveGroup(
        snapshot,
        navigation.selectedSeriesId,
        navigation.activeGroup,
      ),
    };
  }

  return {
    view: navigation.view,
    selectedSeriesId: null,
    selectedSessionId: null,
    activeGroup: resolveActiveGroup(snapshot, null, navigation.activeGroup),
  };
}
