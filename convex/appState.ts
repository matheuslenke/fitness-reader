import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  addExerciseWeightEntry as addExerciseWeightEntryToSnapshot,
  addProgressPhoto as addProgressPhotoToSnapshot,
  addProfileMetric,
  addSeriesMetric,
  applyTemplateToSeries,
  buildDefaultSnapshot,
  createSeries,
  createSession,
  deleteSeries as deleteSeriesFromSnapshot,
  ensureAppSnapshot,
  instantiateExercisesFromTemplate,
  replaceAppData as replaceAppDataInSnapshot,
  replaceTemplateLibrary as replaceTemplateLibraryInSnapshot,
  updateSeries,
  updateSessionExercise as updateSessionExerciseInSnapshot,
  updateSessionStatus,
  getSeriesById,
} from "../src/lib/storage";
import type {
  AppSnapshot,
  PlanMetadata,
  PlanTemplate,
  Series,
  TemplateLibrary,
} from "../src/types/fitness";
import {
  appDataValidator,
  progressPhotoInputValidator,
  sessionExercisePatchValidator,
  seriesFormValidator,
  templateLibraryValidator,
  trainerPlanImportValidator,
} from "./validators";
import { v } from "convex/values";
import { buildUserAppStateKey, getAuthenticatedUser } from "./authHelpers";

type StateReader = QueryCtx | MutationCtx;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, "-");
}

function buildImportedTemplateId(payload: {
  plan: { product: string; delivery_number: string; delivery_date: string };
}): string {
  return [
    "trainer-plan",
    slugify(payload.plan.product),
    slugify(payload.plan.delivery_number),
    slugify(payload.plan.delivery_date),
  ]
    .filter(Boolean)
    .join("-");
}

function buildImportedSeriesId(templateId: string): string {
  return `series-${templateId}`;
}

function buildTemplateName(payload: {
  plan: { product: string; delivery_number: string };
}): string {
  return `${payload.plan.product} · Entrega ${payload.plan.delivery_number}`;
}

function buildExerciseVideoLookup(
  snapshot: AppSnapshot,
): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const template of snapshot.templateLibrary.templates) {
    for (const group of template.groups) {
      for (const exercise of group.exercises) {
        if (!exercise.videoUrl) continue;
        const key = normalizeText(exercise.name);
        if (!lookup.has(key)) {
          lookup.set(key, exercise.videoUrl);
        }
      }
    }
  }

  return lookup;
}

function upsertTemplate(
  templateLibrary: TemplateLibrary,
  template: PlanTemplate,
): TemplateLibrary {
  const existingIndex = templateLibrary.templates.findIndex(
    (currentTemplate) => currentTemplate.id === template.id,
  );

  if (existingIndex === -1) {
    return {
      templates: [...templateLibrary.templates, template],
    };
  }

  return {
    templates: templateLibrary.templates.map((currentTemplate) =>
      currentTemplate.id === template.id ? template : currentTemplate,
    ),
  };
}

function upsertSeries(snapshot: AppSnapshot, series: Series): AppSnapshot {
  const existingIndex = snapshot.series.findIndex(
    (currentSeries) =>
      currentSeries.id === series.id || currentSeries.templateId === series.templateId,
  );

  if (existingIndex === -1) {
    const nextSnapshot = {
      ...snapshot,
      series: [series, ...snapshot.series],
    };

    if (series.status !== "active") {
      return nextSnapshot;
    }

    return updateSeries(nextSnapshot, series.id, {
      status: "active",
    });
  }

  const existingSeries = snapshot.series[existingIndex]!;
  const nextSeries: Series = {
    ...existingSeries,
    ...series,
    exerciseWeights: existingSeries.exerciseWeights,
    metrics: existingSeries.metrics ?? [],
  };

  const nextSnapshot = {
    ...snapshot,
    series: snapshot.series.map((currentSeries, index) =>
      index === existingIndex ? nextSeries : currentSeries,
    ),
  };

  if (nextSeries.status !== "active") {
    return nextSnapshot;
  }

  return updateSeries(nextSnapshot, nextSeries.id, {
    status: "active",
  });
}

function buildDefaultSnapshotForUser(username: string): AppSnapshot {
  const snapshot = buildDefaultSnapshot();

  return {
    ...snapshot,
    profile: {
      ...snapshot.profile,
      name: username,
    },
  };
}

async function readState(
  ctx: StateReader,
  userId: Id<"users">,
  username: string,
): Promise<AppSnapshot> {
  const key = buildUserAppStateKey(userId);
  const document = await ctx.db
    .query("appState")
    .withIndex("by_key", (queryBuilder) => queryBuilder.eq("key", key))
    .unique();

  if (!document) {
    return buildDefaultSnapshotForUser(username);
  }

  return ensureAppSnapshot(document);
}

async function writeState(
  ctx: MutationCtx,
  userId: Id<"users">,
  snapshot: AppSnapshot,
): Promise<AppSnapshot> {
  const nextSnapshot = ensureAppSnapshot(snapshot);
  const key = buildUserAppStateKey(userId);
  const document = await ctx.db
    .query("appState")
    .withIndex("by_key", (queryBuilder) => queryBuilder.eq("key", key))
    .unique();

  const value = {
    key,
    profile: nextSnapshot.profile,
    series: nextSnapshot.series,
    sessions: nextSnapshot.sessions,
    templateLibrary: nextSnapshot.templateLibrary,
  };

  if (document) {
    await ctx.db.patch(document._id, value);
  } else {
    await ctx.db.insert("appState", value);
  }

  return nextSnapshot;
}

export const get = query({
  args: {
    authSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    return await readState(ctx, auth.userId, auth.user.username);
  },
});

export const saveSeries = mutation({
  args: {
    authSessionId: v.string(),
    seriesId: v.optional(v.string()),
    payload: seriesFormValidator,
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);

    if (!args.seriesId) {
      return await writeState(
        ctx,
        auth.userId,
        createSeries(snapshot, args.payload),
      );
    }

    const currentSeries = getSeriesById(snapshot, args.seriesId);
    if (!currentSeries) {
      return snapshot;
    }

    let nextSnapshot = snapshot;
    if (
      args.payload.templateId &&
      args.payload.templateId !== currentSeries.templateId
    ) {
      nextSnapshot = applyTemplateToSeries(
        nextSnapshot,
        args.seriesId,
        args.payload.templateId,
      );
    }

    nextSnapshot = updateSeries(nextSnapshot, args.seriesId, {
      name: args.payload.name,
      startDate: args.payload.startDate,
      endDate: args.payload.endDate,
      status: args.payload.status,
    });

    return await writeState(ctx, auth.userId, nextSnapshot);
  },
});

export const deleteSeries = mutation({
  args: {
    authSessionId: v.string(),
    seriesId: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);
    return await writeState(
      ctx,
      auth.userId,
      deleteSeriesFromSnapshot(snapshot, args.seriesId),
    );
  },
});

export const saveMetric = mutation({
  args: {
    authSessionId: v.string(),
    bodyWeight: v.number(),
    bodyFatPercent: v.union(v.number(), v.null()),
    seriesId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    let snapshot = await readState(ctx, auth.userId, auth.user.username);
    snapshot = addProfileMetric(snapshot, args.bodyWeight, args.bodyFatPercent);

    if (args.seriesId) {
      snapshot = addSeriesMetric(
        snapshot,
        args.seriesId,
        args.bodyWeight,
        args.bodyFatPercent,
      );
    }

    return await writeState(ctx, auth.userId, snapshot);
  },
});

export const addProgressPhoto = mutation({
  args: {
    authSessionId: v.string(),
    photo: progressPhotoInputValidator,
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);
    return await writeState(
      ctx,
      auth.userId,
      addProgressPhotoToSnapshot(snapshot, args.photo),
    );
  },
});

export const addExerciseWeightEntry = mutation({
  args: {
    authSessionId: v.string(),
    seriesId: v.string(),
    exerciseId: v.string(),
    weight: v.number(),
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);
    return await writeState(
      ctx,
      auth.userId,
      addExerciseWeightEntryToSnapshot(
        snapshot,
        args.seriesId,
        args.exerciseId,
        args.weight,
      ),
    );
  },
});

export const replaceAppData = mutation({
  args: {
    authSessionId: v.string(),
    data: appDataValidator,
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);
    return await writeState(
      ctx,
      auth.userId,
      replaceAppDataInSnapshot(snapshot, args.data),
    );
  },
});

export const replaceTemplateLibrary = mutation({
  args: {
    authSessionId: v.string(),
    templateLibrary: templateLibraryValidator,
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);
    return await writeState(
      ctx,
      auth.userId,
      replaceTemplateLibraryInSnapshot(snapshot, args.templateLibrary),
    );
  },
});

export const startSession = mutation({
  args: {
    authSessionId: v.string(),
    seriesId: v.string(),
    group: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);
    const nextSnapshot = createSession(snapshot, args.seriesId, args.group);
    const latestSessionId = nextSnapshot.sessions[0]?.id ?? null;
    await writeState(ctx, auth.userId, nextSnapshot);
    return { sessionId: latestSessionId };
  },
});

export const setSessionStatus = mutation({
  args: {
    authSessionId: v.string(),
    sessionId: v.string(),
    status: v.union(
      v.literal("ongoing"),
      v.literal("finished"),
      v.literal("canceled"),
    ),
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);
    return await writeState(
      ctx,
      auth.userId,
      updateSessionStatus(snapshot, args.sessionId, args.status),
    );
  },
});

export const updateSessionExercise = mutation({
  args: {
    authSessionId: v.string(),
    sessionId: v.string(),
    exerciseId: v.string(),
    payload: sessionExercisePatchValidator,
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);
    return await writeState(
      ctx,
      auth.userId,
      updateSessionExerciseInSnapshot(
        snapshot,
        args.sessionId,
        args.exerciseId,
        args.payload,
      ),
    );
  },
});

export const importTrainerPlan = mutation({
  args: {
    authSessionId: v.string(),
    payload: trainerPlanImportValidator,
  },
  handler: async (ctx, args) => {
    const auth = await getAuthenticatedUser(ctx, args.authSessionId);
    const snapshot = await readState(ctx, auth.userId, auth.user.username);
    const templateId = buildImportedTemplateId(args.payload);
    const templateName = buildTemplateName(args.payload);
    const exerciseVideoLookup = buildExerciseVideoLookup(snapshot);

    const metadata: PlanMetadata = {
      athleteName: args.payload.athlete.name,
      product: args.payload.plan.product,
      purchaseDate: args.payload.plan.purchase_date,
      deliveryNumber: args.payload.plan.delivery_number,
      deliveryDate: args.payload.plan.delivery_date,
      trainingParameters: {
        repetitionsGeneral: args.payload.training_parameters.repetitions_general,
        cadence: args.payload.training_parameters.cadence,
        rest: args.payload.training_parameters.rest,
      },
      instructions: {
        generalNotes: args.payload.instructions.general_notes,
        consultingGuidance: args.payload.instructions.consulting_guidance,
      },
      questionnaireContext: {
        goal: args.payload.questionnaire_context.goal,
        height: args.payload.questionnaire_context.height,
        currentWeight: args.payload.questionnaire_context.current_weight,
        trainingBackground: args.payload.questionnaire_context.training_background,
        plannedFrequency: args.payload.questionnaire_context.planned_frequency,
        trainingLocation: args.payload.questionnaire_context.training_location,
        bodyDiscomfortsOrGoals:
          args.payload.questionnaire_context.body_discomforts_or_goals,
        medicalConditionsOrLimitations:
          args.payload.questionnaire_context.medical_conditions_or_limitations,
        nutritionFollowUp: args.payload.questionnaire_context.nutrition_follow_up,
        relevantNotes: args.payload.questionnaire_context.relevant_notes,
        anabolicOrHormonalUse:
          args.payload.questionnaire_context.anabolic_or_hormonal_use,
        age: args.payload.questionnaire_context.age,
        dietDifficulty: args.payload.questionnaire_context.diet_difficulty,
      },
      sourceMetadata: {
        trainerName: args.payload.source_metadata.trainer_name,
        planName: args.payload.source_metadata.plan_name,
        studentSince: args.payload.source_metadata.student_since,
        lastTrainingReceived: args.payload.source_metadata.last_training_received,
        lastPurchaseDate: args.payload.source_metadata.last_purchase_date,
      },
    };

    const template: PlanTemplate = {
      id: templateId,
      name: templateName,
      metadata,
      groups: args.payload.groups.map((group, groupIndex) => ({
        group: group.group,
        focus: group.focus,
        exercises: group.exercises.map((exercise, exerciseIndex) => ({
          id: [
            templateId,
            slugify(group.group || String(groupIndex + 1)),
            String(exerciseIndex + 1).padStart(2, "0"),
            slugify(exercise.name).slice(0, 48),
          ].join("-"),
          name: exercise.name,
          videoUrl: exerciseVideoLookup.get(normalizeText(exercise.name)) ?? "",
          sets: exercise.sets ?? "",
          reps: exercise.repetitions,
          group: group.group,
          load: exercise.load,
        })),
      })),
    };

    const nextTemplateLibrary = upsertTemplate(snapshot.templateLibrary, template);
    let nextSnapshot: AppSnapshot = {
      ...snapshot,
      profile: {
        ...snapshot.profile,
        name: args.payload.athlete.name,
      },
      templateLibrary: nextTemplateLibrary,
    };

    nextSnapshot = upsertSeries(nextSnapshot, {
      id: buildImportedSeriesId(template.id),
      name: template.name,
      startDate: args.payload.plan.delivery_date,
      endDate: args.payload.plan.delivery_date,
      status: "active",
      exerciseWeights:
        nextSnapshot.series.find(
          (series) => series.id === buildImportedSeriesId(template.id),
        )?.exerciseWeights ?? {},
      metrics:
        nextSnapshot.series.find(
          (series) => series.id === buildImportedSeriesId(template.id),
        )?.metrics ?? [],
      templateId: template.id,
      exercisesByGroup: instantiateExercisesFromTemplate(template),
    });

    return await writeState(ctx, auth.userId, nextSnapshot);
  },
});
