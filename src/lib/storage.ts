import { defaultTemplateLibrary } from "../data/exercises";
import type {
  AppData,
  AppSnapshot,
  Exercise,
  ExerciseLibrary,
  Metric,
  PlanTemplate,
  ProgressPhoto,
  Series,
  Session,
  SessionExercise,
  SessionSetProgress,
  SessionStatus,
  TemplateLibrary,
} from "../types/fitness";
import {
  generateId,
  getSuggestedRepetitionCount,
  nowIso,
  todayStr,
} from "./utils";

export const DEFAULT_PROFILE_NAME = "Matheus Lenke Coutinho";

export function buildDefaultAppData(): AppData {
  return {
    profile: {
      name: DEFAULT_PROFILE_NAME,
      metrics: [],
      progressPhotos: [],
    },
    series: [],
    sessions: [],
  };
}

export function buildDefaultSnapshot(): AppSnapshot {
  return {
    ...buildDefaultAppData(),
    templateLibrary: defaultTemplateLibrary,
  };
}

export function ensureProfileExtras(data: AppData): AppData {
  const fallback = buildDefaultAppData();
  const profile = data.profile ?? fallback.profile;
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

export function ensureAppSnapshot(
  snapshot: Partial<AppSnapshot> | null | undefined,
): AppSnapshot {
  const fallback = buildDefaultSnapshot();
  const data = ensureProfileExtras({
    profile: snapshot?.profile ?? fallback.profile,
    series: Array.isArray(snapshot?.series) ? snapshot.series : fallback.series,
    sessions: Array.isArray(snapshot?.sessions)
      ? snapshot.sessions
      : fallback.sessions,
  });

  return {
    ...data,
    series: normalizeSeriesStatuses(data.series),
    templateLibrary: normalizeTemplateLibrary(snapshot?.templateLibrary),
  };
}

function normalizeTemplateLibrary(
  templateLibrary: TemplateLibrary | null | undefined,
): TemplateLibrary {
  if (
    templateLibrary != null &&
    Array.isArray(templateLibrary.templates)
  ) {
    const builtInTemplatesById = new Map(
      defaultTemplateLibrary.templates.map((template) => [template.id, template]),
    );
    const templatesWithBuiltInCreationDates = templateLibrary.templates.map(
      (template) => {
        const builtInTemplate = builtInTemplatesById.get(template.id);
        if (template.createdAt || !builtInTemplate?.createdAt) return template;

        return { ...template, createdAt: builtInTemplate.createdAt };
      },
    );
    const existingTemplateIds = new Set(
      templatesWithBuiltInCreationDates.map((template) => template.id),
    );
    const missingBuiltInTemplates = defaultTemplateLibrary.templates.filter(
      (template) => !existingTemplateIds.has(template.id),
    );

    return {
      templates: [
        ...templatesWithBuiltInCreationDates,
        ...missingBuiltInTemplates,
      ],
    };
  }
  return defaultTemplateLibrary;
}

export function getSeriesById(data: AppData, id: string): Series | null {
  return data.series.find((series) => series.id === id) ?? null;
}

function getPreferredActiveSeriesId(series: Series[]): string | null {
  let preferredSeries: Series | null = null;

  for (const candidateSeries of series) {
    if (candidateSeries.status !== "active") {
      continue;
    }

    if (
      preferredSeries == null ||
      candidateSeries.startDate > preferredSeries.startDate ||
      (candidateSeries.startDate === preferredSeries.startDate &&
        candidateSeries.endDate >= preferredSeries.endDate)
    ) {
      preferredSeries = candidateSeries;
    }
  }

  return preferredSeries?.id ?? null;
}

function normalizeSeriesStatuses(series: Series[]): Series[] {
  const preferredActiveSeriesId = getPreferredActiveSeriesId(series);

  if (preferredActiveSeriesId == null) {
    return series;
  }

  let activeSeriesCount = 0;
  for (const currentSeries of series) {
    if (currentSeries.status === "active") {
      activeSeriesCount++;
    }
  }

  if (activeSeriesCount <= 1) {
    return series;
  }

  return series.map((currentSeries) => {
    if (
      currentSeries.status !== "active" ||
      currentSeries.id === preferredActiveSeriesId
    ) {
      return currentSeries;
    }

    return {
      ...currentSeries,
      status: "completed",
    };
  });
}

function resolveCompletionEndDate(
  currentEndDate: string,
  completedOn: string,
): string {
  return currentEndDate < completedOn ? currentEndDate : completedOn;
}

function completeOtherActiveSeries(
  series: Series[],
  nextActiveSeriesId: string,
  completedOn: string = todayStr(),
): Series[] {
  return series.map((currentSeries) => {
    if (
      currentSeries.id === nextActiveSeriesId ||
      currentSeries.status !== "active"
    ) {
      return currentSeries;
    }

    return {
      ...currentSeries,
      status: "completed",
      endDate: resolveCompletionEndDate(currentSeries.endDate, completedOn),
    };
  });
}

export function createSeries(
  snapshot: AppSnapshot,
  payload: {
    name?: string;
    startDate?: string;
    endDate?: string;
    status?: Series["status"];
    templateId?: string;
  },
): AppSnapshot {
  let exercisesByGroup: Record<string, Exercise[]> | undefined;
  let templateId: string | undefined;

  if (payload.templateId) {
    const template = getTemplateById(snapshot.templateLibrary, payload.templateId);
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

  const nextSeries = [...snapshot.series, series];

  return {
    ...snapshot,
    series:
      series.status === "active"
        ? completeOtherActiveSeries(nextSeries, series.id)
        : normalizeSeriesStatuses(nextSeries),
  };
}

export function updateSeries(
  snapshot: AppSnapshot,
  id: string,
  payload: Partial<Series>,
): AppSnapshot {
  const nextSeries = snapshot.series.map((series) =>
    series.id === id ? { ...series, ...payload } : series,
  );

  return {
    ...snapshot,
    series:
      payload.status === "active"
        ? completeOtherActiveSeries(nextSeries, id)
        : normalizeSeriesStatuses(nextSeries),
  };
}

export function applyTemplateToSeries(
  snapshot: AppSnapshot,
  seriesId: string,
  templateId: string,
): AppSnapshot {
  const template = getTemplateById(snapshot.templateLibrary, templateId);
  if (!template) return snapshot;
  const exercisesByGroup = instantiateExercisesFromTemplate(template);
  return updateSeries(snapshot, seriesId, {
    templateId,
    exercisesByGroup,
  });
}

export function deleteSeries(snapshot: AppSnapshot, id: string): AppSnapshot {
  return {
    ...snapshot,
    series: normalizeSeriesStatuses(
      snapshot.series.filter((series) => series.id !== id),
    ),
  };
}

export function addProfileMetric(
  snapshot: AppSnapshot,
  bodyWeight: number,
  bodyFatPercent: number | null,
): AppSnapshot {
  const metric: Metric = {
    date: todayStr(),
    bodyWeight,
    bodyFatPercent,
  };

  return {
    ...snapshot,
    profile: {
      ...snapshot.profile,
      metrics: [metric, ...(snapshot.profile.metrics ?? [])],
    },
  };
}

export function addSeriesMetric(
  snapshot: AppSnapshot,
  seriesId: string,
  bodyWeight: number,
  bodyFatPercent: number | null,
): AppSnapshot {
  const series = getSeriesById(snapshot, seriesId);
  if (!series) return snapshot;

  const metric: Metric = {
    date: todayStr(),
    bodyWeight,
    bodyFatPercent,
  };

  return updateSeries(snapshot, seriesId, {
    metrics: [metric, ...(series.metrics ?? [])],
  });
}

export function addProgressPhoto(
  snapshot: AppSnapshot,
  photo: Omit<ProgressPhoto, "id">,
): AppSnapshot {
  return {
    ...snapshot,
    profile: {
      ...snapshot.profile,
      progressPhotos: [
        ...(snapshot.profile.progressPhotos ?? []),
        { ...photo, id: generateId() },
      ],
    },
  };
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
  return history.length > 0 ? String(history[0]!.weight) : "";
}

export function addExerciseWeightEntry(
  snapshot: AppSnapshot,
  seriesId: string,
  exerciseId: string,
  weight: number,
): AppSnapshot {
  const series = getSeriesById(snapshot, seriesId);
  if (!series) return snapshot;

  const exerciseWeights = { ...(series.exerciseWeights ?? {}) };
  const list = [...(exerciseWeights[exerciseId] ?? [])];
  list.unshift({ date: todayStr(), weight });
  exerciseWeights[exerciseId] = list.slice(0, 50);

  return updateSeries(snapshot, seriesId, { exerciseWeights });
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
  for (const series of data.series) {
    const exerciseWeights = series.exerciseWeights ?? {};
    for (const exerciseId of Object.keys(exerciseWeights)) {
      if ((exerciseWeights[exerciseId] ?? []).length > 0) {
        exerciseCount++;
      }
    }
  }

  return { weight, bodyFat, exerciseCount, allMetrics: metrics };
}

export function exerciseLibraryToTemplateLibrary(
  library: ExerciseLibrary,
): TemplateLibrary {
  const groups = Array.isArray(library.groups) ? library.groups : [];
  return {
    templates: [
      {
        id: "default",
        name: "Default",
        createdAt: todayStr(),
        groups,
      },
    ],
  };
}

export function replaceAppData(
  snapshot: AppSnapshot,
  data: AppData,
): AppSnapshot {
  const nextData = ensureProfileExtras(data);
  return {
    ...snapshot,
    ...nextData,
    series: normalizeSeriesStatuses(nextData.series),
  };
}

export function replaceTemplateLibrary(
  snapshot: AppSnapshot,
  templateLibrary: TemplateLibrary,
): AppSnapshot {
  const importedAt = todayStr();
  const templateLibraryWithCreationDates: TemplateLibrary = {
    templates: templateLibrary.templates.map((template) =>
      template.createdAt ? template : { ...template, createdAt: importedAt },
    ),
  };

  return {
    ...snapshot,
    templateLibrary: normalizeTemplateLibrary(templateLibraryWithCreationDates),
  };
}

export function updatePlanTemplate(
  snapshot: AppSnapshot,
  updatedTemplate: PlanTemplate,
): AppSnapshot {
  const existingTemplate = getTemplateById(
    snapshot.templateLibrary,
    updatedTemplate.id,
  );
  if (existingTemplate == null) return snapshot;

  const videoUrls = new Map(
    updatedTemplate.groups.flatMap((group) =>
      group.exercises.map((exercise) => [exercise.id, exercise.videoUrl]),
    ),
  );

  const series = snapshot.series.map((currentSeries) => {
    if (currentSeries.templateId !== updatedTemplate.id) return currentSeries;

    if (currentSeries.exercisesByGroup == null) {
      return {
        ...currentSeries,
        exercisesByGroup: instantiateExercisesFromTemplate(updatedTemplate),
      };
    }

    const exercisesByGroup = Object.fromEntries(
      Object.entries(currentSeries.exercisesByGroup).map(
        ([group, exercises]) => [
          group,
          exercises.map((exercise) => {
            const videoUrl = videoUrls.get(exercise.id);
            return videoUrl == null ? exercise : { ...exercise, videoUrl };
          }),
        ],
      ),
    );

    return { ...currentSeries, exercisesByGroup };
  });

  return {
    ...snapshot,
    series,
    templateLibrary: {
      templates: snapshot.templateLibrary.templates.map((template) =>
        template.id === updatedTemplate.id ? updatedTemplate : template,
      ),
    },
  };
}

export function getTemplateById(
  templateLibrary: TemplateLibrary,
  id: string,
): PlanTemplate | null {
  return templateLibrary.templates.find((template) => template.id === id) ?? null;
}

function deepCloneExercises(exercises: Exercise[]): Exercise[] {
  return exercises.map((exercise) => ({ ...exercise }));
}

export function instantiateExercisesFromTemplate(
  template: PlanTemplate,
): Record<string, Exercise[]> {
  const exercisesByGroup: Record<string, Exercise[]> = {};
  for (const group of template.groups) {
    exercisesByGroup[group.group] = deepCloneExercises(group.exercises ?? []);
  }
  return exercisesByGroup;
}

export function getSessionById(data: AppData, id: string): Session | null {
  return data.sessions.find((session) => session.id === id) ?? null;
}

function updateSessionInSnapshot(
  snapshot: AppSnapshot,
  sessionId: string,
  patch: Partial<Session>,
): AppSnapshot {
  return {
    ...snapshot,
    sessions: snapshot.sessions.map((session) =>
      session.id === sessionId ? { ...session, ...patch } : session,
    ),
  };
}

function createSessionSetProgress(exercise: Exercise): SessionSetProgress[] {
  const setCountMatch = exercise.sets.match(/\d+/);
  const parsedSetCount = setCountMatch ? Number(setCountMatch[0]) : 1;
  const setCount = Math.min(20, Math.max(1, parsedSetCount));
  const suggestedRepetitionCount = getSuggestedRepetitionCount(exercise.reps);

  return Array.from({ length: setCount }, () => ({
    repetitions: suggestedRepetitionCount,
    completed: false,
  }));
}

export function createSession(
  snapshot: AppSnapshot,
  seriesId: string,
  group: string,
): AppSnapshot {
  const series = getSeriesById(snapshot, seriesId);
  if (!series) return snapshot;

  const exercisesInGroup = series.exercisesByGroup?.[group] ?? [];
  const exercises: SessionExercise[] = exercisesInGroup.map((exercise) => ({
    exerciseId: exercise.id,
    weight: series.exerciseWeights?.[exercise.id]?.[0]?.weight ?? null,
    status: "pending",
    setProgress: createSessionSetProgress(exercise),
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

  return {
    ...snapshot,
    sessions: [session, ...snapshot.sessions],
  };
}

export function updateSessionStatus(
  snapshot: AppSnapshot,
  sessionId: string,
  status: SessionStatus,
): AppSnapshot {
  const session = getSessionById(snapshot, sessionId);
  if (!session) return snapshot;
  if (session.status === status) return snapshot;

  const finishedAt = status === "ongoing" ? null : nowIso();
  let nextSnapshot = updateSessionInSnapshot(snapshot, sessionId, {
    status,
    finishedAt,
  });

  if (status !== "finished") {
    return nextSnapshot;
  }

  for (const exercise of session.exercises) {
    if (exercise.status === "completed" && exercise.weight != null && exercise.weight > 0) {
      nextSnapshot = addExerciseWeightEntry(
        nextSnapshot,
        session.seriesId,
        exercise.exerciseId,
        exercise.weight,
      );
    }
  }

  return nextSnapshot;
}

export function updateSessionExercise(
  snapshot: AppSnapshot,
  sessionId: string,
  exerciseId: string,
  payload: {
    weight?: number | null;
    status?: SessionExercise["status"];
    setProgress?: SessionSetProgress[];
  },
): AppSnapshot {
  const session = getSessionById(snapshot, sessionId);
  if (!session) return snapshot;

  const exercises = session.exercises.map((exercise) => {
    if (exercise.exerciseId !== exerciseId) return exercise;
    return {
      ...exercise,
      ...(payload.weight !== undefined ? { weight: payload.weight } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.setProgress !== undefined
        ? { setProgress: payload.setProgress }
        : {}),
    };
  });

  return updateSessionInSnapshot(snapshot, sessionId, { exercises });
}
