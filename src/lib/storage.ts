import { defaultExerciseLibrary } from "../data/exercises";
import type {
  AppData,
  ExerciseLibrary,
  Metric,
  ProgressPhoto,
  Series,
} from "../types/fitness";
import { generateId, todayStr } from "./utils";

const STORAGE_KEY = "fitness-tracker-v2";
const LEGACY_STORAGE_KEY = "fitness-tracker-weights";
const LIBRARY_KEY = "fitness-tracker-library";
export const DEFAULT_PROFILE_NAME = "Matheus Lenke Coutinho";

export function ensureProfileExtras(data: AppData): AppData {
  const profile = data.profile ?? {
    name: DEFAULT_PROFILE_NAME,
    metrics: [],
    progressPhotos: [],
  };
  return {
    ...data,
    profile: {
      name: profile.name,
      metrics: Array.isArray(profile.metrics) ? profile.metrics : [],
      progressPhotos: Array.isArray(profile.progressPhotos)
        ? profile.progressPhotos
        : [],
    },
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
  },
): AppData {
  const series: Series = {
    id: generateId(),
    name: payload.name ?? "Nova série",
    startDate: payload.startDate ?? todayStr(),
    endDate: payload.endDate ?? todayStr(),
    status: payload.status ?? "active",
    exerciseWeights: {},
    metrics: [],
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

export function loadExerciseLibrary(): ExerciseLibrary {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ExerciseLibrary;
      if (parsed && Array.isArray(parsed.groups)) return parsed;
    }
  } catch {
    // ignore
  }
  return defaultExerciseLibrary;
}

export function saveExerciseLibrary(lib: ExerciseLibrary): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
}
