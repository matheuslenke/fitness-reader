import type { ExerciseLibrary, TemplateLibrary } from "../types/fitness";

import exercisesJson from "../../exercises.json";
import consultoriaIaCycle1Week2Json from "../../imports/consultoria-ia-cycle-1-week-2.json";
import matheusTrainingJson from "../../imports/matheus-training-2026-07.json";
import ptrainerAnnualDelivery6Json from "../../imports/ptrainer-annual-delivery-6-2026-06.json";

const legacy = exercisesJson as ExerciseLibrary;

export const defaultExerciseLibrary = legacy;

const DEFAULT_TEMPLATE_ID = "default";
const consultoriaIaCycle1Week2Library =
  consultoriaIaCycle1Week2Json as TemplateLibrary;
const matheusTrainingLibrary = matheusTrainingJson as TemplateLibrary;
const ptrainerAnnualDelivery6Library =
  ptrainerAnnualDelivery6Json as TemplateLibrary;

export const defaultTemplateLibrary: TemplateLibrary = {
  templates: [
    {
      id: DEFAULT_TEMPLATE_ID,
      name: "Default",
      createdAt: "2026-01-29",
      groups: Array.isArray(legacy.groups) ? legacy.groups : [],
    },
    ...consultoriaIaCycle1Week2Library.templates,
    ...matheusTrainingLibrary.templates,
    ...ptrainerAnnualDelivery6Library.templates,
  ],
};
