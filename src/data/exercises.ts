import type { ExerciseLibrary } from "../types/fitness";

import exercisesJson from "../../exercises.json";

export const defaultExerciseLibrary = exercisesJson as ExerciseLibrary;
