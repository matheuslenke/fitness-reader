export interface Metric {
  date: string;
  bodyWeight: number;
  bodyFatPercent: number | null;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  note: string;
  src: string;
}

export interface Profile {
  name: string;
  metrics: Metric[];
  progressPhotos?: ProgressPhoto[];
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export type SeriesStatus = "active" | "completed" | "archived";

/**
 * Training block (program instance). An instance of a plan template with its own
 * dates, weights, and editable exercise list. The library acts as a template.
 */
export interface Series {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SeriesStatus;
  exerciseWeights: Record<string, WeightEntry[]>;
  metrics?: Metric[];
  /** Id of the plan template this block was created from, if any. */
  templateId?: string;
  /** Exercises per day/group (e.g. "A", "B"). Copied from template, editable per instance. */
  exercisesByGroup?: Record<string, Exercise[]>;
}

export type SessionStatus = "ongoing" | "finished" | "canceled";

export type SessionExerciseStatus = "pending" | "completed" | "skipped";

export interface SessionExercise {
  exerciseId: string;
  weight: number | null;
  status: SessionExerciseStatus;
}

export interface Session {
  id: string;
  seriesId: string;
  group: string;
  status: SessionStatus;
  startedAt: string;
  finishedAt: string | null;
  exercises: SessionExercise[];
}

export interface AppData {
  profile: Profile;
  series: Series[];
  sessions: Session[];
}

export interface Exercise {
  id: string;
  name: string;
  videoUrl: string;
  sets: string;
  reps: string;
  group: string;
  load?: string | null;
}

export interface ExerciseGroup {
  group: string;
  focus?: string;
  exercises: Exercise[];
}

/** Legacy shape for imported JSON: single set of groups (one implicit template). */
export interface ExerciseLibrary {
  groups: ExerciseGroup[];
  exercises?: Exercise[];
}

/**
 * Plan template: reusable blueprint (e.g. "5-day ABCDE") with exercises per day/group.
 */
export interface PlanTemplate {
  id: string;
  name: string;
  groups: ExerciseGroup[];
  metadata?: PlanMetadata;
}

/**
 * Template library: collection of plan templates. Imported from JSON.
 */
export interface TemplateLibrary {
  templates: PlanTemplate[];
}

export interface TrainingParameters {
  repetitionsGeneral: string | null;
  cadence: string | null;
  rest: string | null;
}

export interface TrainingInstructions {
  generalNotes: string[];
  consultingGuidance: string[];
}

export interface QuestionnaireContext {
  goal: string;
  height: string;
  currentWeight: string;
  trainingBackground: string;
  plannedFrequency: string;
  trainingLocation: string;
  bodyDiscomfortsOrGoals: string;
  medicalConditionsOrLimitations: string;
  nutritionFollowUp: string;
  relevantNotes: string;
  anabolicOrHormonalUse: string;
  age: string;
  dietDifficulty: string;
}

export interface SourceMetadata {
  trainerName: string;
  planName: string;
  studentSince: string;
  lastTrainingReceived: string;
  lastPurchaseDate: string;
}

export interface PlanMetadata {
  athleteName: string;
  product: string;
  purchaseDate: string;
  deliveryNumber: string;
  deliveryDate: string;
  trainingParameters: TrainingParameters;
  instructions: TrainingInstructions;
  questionnaireContext: QuestionnaireContext;
  sourceMetadata: SourceMetadata;
}

export interface AppSnapshot extends AppData {
  templateLibrary: TemplateLibrary;
}

export type ViewKey =
  | "landing"
  | "series"
  | "metrics"
  | "profile"
  | "more"
  | "history"
  | "sessions"
  | "session-tracker";

export type ToastType = "info" | "success" | "error";

export interface ToastState {
  text: string;
  type: ToastType;
}
