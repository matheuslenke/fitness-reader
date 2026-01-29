import type { ExerciseLibrary, TemplateLibrary } from "../types/fitness";

import exercisesJson from "../../exercises.json";

const legacy = exercisesJson as ExerciseLibrary;

export const defaultExerciseLibrary = legacy;

const DEFAULT_TEMPLATE_ID = "default";

export const defaultTemplateLibrary: TemplateLibrary = {
  templates: [
    {
      id: DEFAULT_TEMPLATE_ID,
      name: "Default",
      groups: Array.isArray(legacy.groups) ? legacy.groups : [],
    },
  ],
};
