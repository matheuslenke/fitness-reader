import { v } from "convex/values";

export const metricValidator = v.object({
  date: v.string(),
  bodyWeight: v.number(),
  bodyFatPercent: v.union(v.number(), v.null()),
});

export const progressPhotoValidator = v.object({
  id: v.string(),
  date: v.string(),
  note: v.string(),
  src: v.string(),
});

export const progressPhotoInputValidator = v.object({
  date: v.string(),
  note: v.string(),
  src: v.string(),
});

export const profileValidator = v.object({
  name: v.string(),
  metrics: v.array(metricValidator),
  progressPhotos: v.optional(v.array(progressPhotoValidator)),
});

export const weightEntryValidator = v.object({
  date: v.string(),
  weight: v.number(),
});

export const exerciseValidator = v.object({
  id: v.string(),
  name: v.string(),
  videoUrl: v.string(),
  sets: v.string(),
  reps: v.string(),
  group: v.string(),
  load: v.optional(v.union(v.string(), v.null())),
});

export const exerciseGroupValidator = v.object({
  group: v.string(),
  focus: v.optional(v.string()),
  exercises: v.array(exerciseValidator),
});

export const seriesValidator = v.object({
  id: v.string(),
  name: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  status: v.union(
    v.literal("active"),
    v.literal("completed"),
    v.literal("archived"),
  ),
  exerciseWeights: v.record(v.string(), v.array(weightEntryValidator)),
  metrics: v.optional(v.array(metricValidator)),
  templateId: v.optional(v.string()),
  exercisesByGroup: v.optional(v.record(v.string(), v.array(exerciseValidator))),
});

export const sessionExerciseValidator = v.object({
  exerciseId: v.string(),
  weight: v.union(v.number(), v.null()),
  status: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("skipped"),
  ),
});

export const sessionValidator = v.object({
  id: v.string(),
  seriesId: v.string(),
  group: v.string(),
  status: v.union(
    v.literal("ongoing"),
    v.literal("finished"),
    v.literal("canceled"),
  ),
  startedAt: v.string(),
  finishedAt: v.union(v.string(), v.null()),
  exercises: v.array(sessionExerciseValidator),
});

export const planTemplateValidator = v.object({
  id: v.string(),
  name: v.string(),
  groups: v.array(exerciseGroupValidator),
  metadata: v.optional(
    v.object({
      athleteName: v.string(),
      product: v.string(),
      purchaseDate: v.string(),
      deliveryNumber: v.string(),
      deliveryDate: v.string(),
      trainingParameters: v.object({
        repetitionsGeneral: v.union(v.string(), v.null()),
        cadence: v.union(v.string(), v.null()),
        rest: v.union(v.string(), v.null()),
      }),
      instructions: v.object({
        generalNotes: v.array(v.string()),
        consultingGuidance: v.array(v.string()),
      }),
      questionnaireContext: v.object({
        goal: v.string(),
        height: v.string(),
        currentWeight: v.string(),
        trainingBackground: v.string(),
        plannedFrequency: v.string(),
        trainingLocation: v.string(),
        bodyDiscomfortsOrGoals: v.string(),
        medicalConditionsOrLimitations: v.string(),
        nutritionFollowUp: v.string(),
        relevantNotes: v.string(),
        anabolicOrHormonalUse: v.string(),
        age: v.string(),
        dietDifficulty: v.string(),
      }),
      sourceMetadata: v.object({
        trainerName: v.string(),
        planName: v.string(),
        studentSince: v.string(),
        lastTrainingReceived: v.string(),
        lastPurchaseDate: v.string(),
      }),
    }),
  ),
});

export const templateLibraryValidator = v.object({
  templates: v.array(planTemplateValidator),
});

export const appDataValidator = v.object({
  profile: profileValidator,
  series: v.array(seriesValidator),
  sessions: v.array(sessionValidator),
});

export const exerciseLibraryValidator = v.object({
  groups: v.array(exerciseGroupValidator),
  exercises: v.optional(v.array(exerciseValidator)),
});

export const appStateFields = {
  key: v.string(),
  profile: profileValidator,
  series: v.array(seriesValidator),
  sessions: v.array(sessionValidator),
  templateLibrary: templateLibraryValidator,
};

export const userFields = {
  username: v.string(),
  usernameNormalized: v.string(),
  passwordHash: v.string(),
  passwordSalt: v.string(),
  createdAt: v.string(),
};

export const sessionFields = {
  userId: v.id("users"),
  createdAt: v.string(),
};

export const seriesFormValidator = v.object({
  name: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  status: v.union(
    v.literal("active"),
    v.literal("completed"),
    v.literal("archived"),
  ),
  templateId: v.optional(v.string()),
});

export const sessionExercisePatchValidator = v.object({
  weight: v.optional(v.union(v.number(), v.null())),
  status: v.optional(
    v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("skipped"),
    ),
  ),
});

export const trainerPlanImportValidator = v.object({
  athlete: v.object({
    name: v.string(),
  }),
  plan: v.object({
    product: v.string(),
    purchase_date: v.string(),
    delivery_number: v.string(),
    delivery_date: v.string(),
  }),
  training_parameters: v.object({
    repetitions_general: v.union(v.string(), v.null()),
    cadence: v.union(v.string(), v.null()),
    rest: v.union(v.string(), v.null()),
  }),
  groups: v.array(
    v.object({
      group: v.string(),
      focus: v.string(),
      exercises: v.array(
        v.object({
          name: v.string(),
          sets: v.union(v.string(), v.null()),
          repetitions: v.string(),
          load: v.union(v.string(), v.null()),
        }),
      ),
    }),
  ),
  instructions: v.object({
    general_notes: v.array(v.string()),
    consulting_guidance: v.array(v.string()),
  }),
  questionnaire_context: v.object({
    goal: v.string(),
    height: v.string(),
    current_weight: v.string(),
    training_background: v.string(),
    planned_frequency: v.string(),
    training_location: v.string(),
    body_discomforts_or_goals: v.string(),
    medical_conditions_or_limitations: v.string(),
    nutrition_follow_up: v.string(),
    relevant_notes: v.string(),
    anabolic_or_hormonal_use: v.string(),
    age: v.string(),
    diet_difficulty: v.string(),
  }),
  source_metadata: v.object({
    trainer_name: v.string(),
    plan_name: v.string(),
    student_since: v.string(),
    last_training_received: v.string(),
    last_purchase_date: v.string(),
  }),
});
