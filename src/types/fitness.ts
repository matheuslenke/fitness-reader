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

export interface Series {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SeriesStatus;
  exerciseWeights: Record<string, WeightEntry[]>;
  metrics?: Metric[];
}

export interface AppData {
  profile: Profile;
  series: Series[];
}

export interface Exercise {
  id: string;
  name: string;
  videoUrl: string;
  sets: string;
  reps: string;
  group: string;
}

export interface ExerciseGroup {
  group: string;
  exercises: Exercise[];
}

export interface ExerciseLibrary {
  groups: ExerciseGroup[];
  exercises?: Exercise[];
}

export type ViewKey = "landing" | "series" | "metrics" | "history";

export type ToastType = "info" | "success" | "error";

export interface ToastState {
  text: string;
  type: ToastType;
}
