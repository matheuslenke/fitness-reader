import { defaultTemplateLibrary } from "../data/exercises";
import type {
  AppData,
  Exercise,
  ExerciseLibrary,
  Metric,
  PlanTemplate,
  ProgressPhoto,
  Series,
  Session,
  SessionExercise,
  SessionStatus,
  TemplateLibrary,
} from "../types/fitness";
import { generateId, nowIso, todayStr } from "./utils";

const STORAGE_KEY = "fitness-tracker-v2";
const LEGACY_STORAGE_KEY = "fitness-tracker-weights";
const LIBRARY_KEY = "fitness-tracker-library";
const TEMPLATES_KEY = "fitness-tracker-templates";
export const DEFAULT_PROFILE_NAME = "Matheus Lenke Coutinho";

export function ensureProfileExtras(data: AppData): AppData {
  const profile = data.profile ?? {
    name: DEFAULT_PROFILE_NAME,
    metrics: [],
    progressPhotos: [],
  };
  const sessions = Array.isArray(data.sessions) ? data.sessions : [];
  return {
    ...data,
    profile: {
      name: profile.name,
      metrics: Array.isArray(profile.metrics) ? profile.metrics : [],
      progressPhotos: Array.isArray(profile.progressPhotos)
        ? profile.progressPhotos
        : [],
    },
    sessions,
  };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = ensureProfileExtras(JSON.parse(raw) as AppData);
      if (data.profile && Array.isArray(data.series)) return data;
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as {
        weights?: Record<string, { date: string; weight: number }[]>;
      };
      if (old.weights && typeof old.weights === "object") {
        const migrated: AppData = {
          profile: {
            name: DEFAULT_PROFILE_NAME,
            metrics: [],
            progressPhotos: [],
          },
          series: [
            {
              id: generateId(),
              name: "Série 1",
              startDate: todayStr(),
              endDate: todayStr(),
              status: "active",
              exerciseWeights: old.weights,
              metrics: [],
            },
          ],
          sessions: [],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return ensureProfileExtras(migrated);
      }
    }
  } catch {
    // ignore
  }
  return ensureProfileExtras({
    profile: {
      name: DEFAULT_PROFILE_NAME,
      metrics: [],
      progressPhotos: [],
    },
    series: [],
    sessions: [],
  });
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSeriesById(data: AppData, id: string): Series | null {
  return data.series.find((s) => s.id === id) ?? null;
}

export function createSeries(
  data: AppData,
  payload: {
    name?: string;
    startDate?: string;
    endDate?: string;
    status?: Series["status"];
    templateId?: string;
  },
): AppData {
  let exercisesByGroup: Record<string, Exercise[]> | undefined;
  let templateId: string | undefined;
  if (payload.templateId) {
    const lib = loadTemplateLibrary();
    const template = getTemplateById(lib, payload.templateId);
    if (template) {
      templateId = template.id;
      exercisesByGroup = instantiateExercisesFromTemplate(template);
    }
  }
  const series: Series = {
    id: generateId(),
    name: payload.name ?? "Nova série",
    startDate: payload.startDate ?? todayStr(),
    endDate: payload.endDate ?? todayStr(),
    status: payload.status ?? "active",
    exerciseWeights: {},
    metrics: [],
    templateId,
    exercisesByGroup,
  };
  const next: AppData = { ...data, series: [...data.series, series] };
  saveAppData(next);
  return next;
}

export function updateSeries(
  data: AppData,
  id: string,
  payload: Partial<Series>,
): AppData {
  const next: AppData = {
    ...data,
    series: data.series.map((s) => (s.id === id ? { ...s, ...payload } : s)),
  };
  saveAppData(next);
  return next;
}

/** Clone template exercises into an existing series and update it. */
export function applyTemplateToSeries(
  data: AppData,
  seriesId: string,
  templateId: string,
): AppData {
  const lib = loadTemplateLibrary();
  const template = getTemplateById(lib, templateId);
  if (!template) return data;
  const exercisesByGroup = instantiateExercisesFromTemplate(template);
  return updateSeries(data, seriesId, { templateId, exercisesByGroup });
}

export function deleteSeries(data: AppData, id: string): AppData {
  const next: AppData = {
    ...data,
    series: data.series.filter((s) => s.id !== id),
  };
  saveAppData(next);
  return next;
}

export function addProfileMetric(
  data: AppData,
  bodyWeight: number,
  bodyFatPercent: number | null,
): AppData {
  const date = todayStr();
  const metric: Metric = { date, bodyWeight, bodyFatPercent };
  const metrics = [metric, ...(data.profile.metrics ?? [])];
  const next: AppData = {
    ...data,
    profile: { ...data.profile, metrics },
  };
  saveAppData(next);
  return next;
}

export function addSeriesMetric(
  data: AppData,
  seriesId: string,
  bodyWeight: number,
  bodyFatPercent: number | null,
): AppData {
  const series = getSeriesById(data, seriesId);
  if (!series) return data;
  const date = todayStr();
  const metric: Metric = { date, bodyWeight, bodyFatPercent };
  const metrics = [metric, ...(series.metrics ?? [])];
  return updateSeries(data, seriesId, { metrics });
}

export function addProgressPhoto(
  data: AppData,
  photo: Omit<ProgressPhoto, "id">,
): AppData {
  const progressPhotos = [
    ...(data.profile.progressPhotos ?? []),
    { ...photo, id: generateId() },
  ];
  const next: AppData = {
    ...data,
    profile: { ...data.profile, progressPhotos },
  };
  saveAppData(next);
  return next;
}

export function getExerciseHistory(
  series: Series,
  exerciseId: string,
): { date: string; weight: number }[] {
  const weights = series.exerciseWeights?.[exerciseId] ?? [];
  return weights.slice(0, 20);
}

export function getCurrentExerciseWeight(
  series: Series,
  exerciseId: string,
): string {
  const history = getExerciseHistory(series, exerciseId);
  return history.length ? String(history[0]!.weight) : "";
}

export function addExerciseWeightEntry(
  data: AppData,
  seriesId: string,
  exerciseId: string,
  weight: number,
): AppData {
  const series = getSeriesById(data, seriesId);
  if (!series) return data;
  const date = todayStr();
  const exerciseWeights = { ...(series.exerciseWeights ?? {}) };
  const list = [...(exerciseWeights[exerciseId] ?? [])];
  list.unshift({ date, weight });
  exerciseWeights[exerciseId] = list.slice(0, 50);
  return updateSeries(data, seriesId, { exerciseWeights });
}

export interface GlobalMetricsResult {
  weight: number | null;
  bodyFat: number | null;
  exerciseCount: number;
  allMetrics: Metric[];
}

export function getGlobalMetrics(data: AppData): GlobalMetricsResult {
  const metrics = data.profile?.metrics ?? [];
  const latest = metrics[0] ?? null;
  const weight = latest ? latest.bodyWeight : null;
  const bodyFat =
    latest != null && latest.bodyFatPercent != null
      ? latest.bodyFatPercent
      : null;
  let exerciseCount = 0;
  for (const s of data.series) {
    const ew = s.exerciseWeights ?? {};
    for (const id of Object.keys(ew)) {
      if ((ew[id] ?? []).length > 0) exerciseCount++;
    }
  }
  return { weight, bodyFat, exerciseCount, allMetrics: metrics };
}

export function exerciseLibraryToTemplateLibrary(
  lib: ExerciseLibrary,
): TemplateLibrary {
  const groups = Array.isArray(lib.groups) ? lib.groups : [];
  return {
    templates: [
      {
        id: "default",
        name: "Default",
        groups,
      },
    ],
  };
}

export function loadTemplateLibrary(): TemplateLibrary {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TemplateLibrary;
      if (parsed?.templates && Array.isArray(parsed.templates)) return parsed;
    }
    const legacyRaw = localStorage.getItem(LIBRARY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as ExerciseLibrary;
      if (legacy?.groups && Array.isArray(legacy.groups)) {
        const converted = exerciseLibraryToTemplateLibrary(legacy);
        saveTemplateLibrary(converted);
        return converted;
      }
    }
  } catch {
    // ignore
  }
  return defaultTemplateLibrary;
}

export function saveTemplateLibrary(lib: TemplateLibrary): void {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(lib));
}

export function getTemplateById(
  lib: TemplateLibrary,
  id: string,
): PlanTemplate | null {
  return lib.templates.find((t) => t.id === id) ?? null;
}

function deepCloneExercises(exercises: Exercise[]): Exercise[] {
  return exercises.map((e) => ({ ...e }));
}

/** Build exercisesByGroup from a plan template (deep clone). */
export function instantiateExercisesFromTemplate(
  template: PlanTemplate,
): Record<string, Exercise[]> {
  const out: Record<string, Exercise[]> = {};
  for (const g of template.groups) {
    const list = g.exercises ?? [];
    out[g.group] = deepCloneExercises(list);
  }
  return out;
}

export function loadExerciseLibrary(): ExerciseLibrary {
  const lib = loadTemplateLibrary();
  const t = lib.templates[0];
  return {
    groups: t ? t.groups : [],
  };
}

export function saveExerciseLibrary(lib: ExerciseLibrary): void {
  const converted = exerciseLibraryToTemplateLibrary(lib);
  saveTemplateLibrary(converted);
}

export function getSessionById(data: AppData, id: string): Session | null {
  return data.sessions.find((s) => s.id === id) ?? null;
}

function updateSessionInData(
  data: AppData,
  sessionId: string,
  patch: Partial<Session>,
): AppData {
  const next: AppData = {
    ...data,
    sessions: data.sessions.map((s) =>
      s.id === sessionId ? { ...s, ...patch } : s,
    ),
  };
  saveAppData(next);
  return next;
}

export function createSession(
  data: AppData,
  seriesId: string,
  group: string,
): AppData {
  const series = getSeriesById(data, seriesId);
  if (!series) return data;
  const exercisesInGroup = series.exercisesByGroup?.[group] ?? [];
  const exercises: SessionExercise[] = exercisesInGroup.map((ex) => ({
    exerciseId: ex.id,
    weight: null,
    status: "pending" as const,
  }));
  const session: Session = {
    id: generateId(),
    seriesId,
    group,
    status: "ongoing",
    startedAt: nowIso(),
    finishedAt: null,
    exercises,
  };
  const next: AppData = {
    ...data,
    sessions: [session, ...data.sessions],
  };
  saveAppData(next);
  return next;
}

export function updateSessionStatus(
  data: AppData,
  sessionId: string,
  status: SessionStatus,
): AppData {
  const session = getSessionById(data, sessionId);
  if (!session) return data;
  const finishedAt = status === "ongoing" ? null : nowIso();
  let next = updateSessionInData(data, sessionId, { status, finishedAt });
  if (status === "finished") {
    for (const se of session.exercises) {
      if (se.status === "completed" && se.weight != null && se.weight > 0) {
        next = addExerciseWeightEntry(
          next,
          session.seriesId,
          se.exerciseId,
          se.weight,
        );
      }
    }
  }
  return next;
}

export function updateSessionExercise(
  data: AppData,
  sessionId: string,
  exerciseId: string,
  payload: { weight?: number | null; status?: SessionExercise["status"] },
): AppData {
  const session = getSessionById(data, sessionId);
  if (!session) return data;
  const exercises = session.exercises.map((se) => {
    if (se.exerciseId !== exerciseId) return se;
    return {
      ...se,
      ...(payload.weight !== undefined && { weight: payload.weight }),
      ...(payload.status !== undefined && { status: payload.status }),
    };
  });
  return updateSessionInData(data, sessionId, { exercises });
}
