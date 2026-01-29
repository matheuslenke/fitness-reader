import { useState, useEffect } from "react";
import type { Exercise, Series } from "../types/fitness";
import { getExerciseHistory } from "../lib/storage";
import { Modal } from "./Modal";

interface WeightModalProps {
  open: boolean;
  exercise: Exercise | null;
  series: Series | null;
  currentWeight: string;
  onClose: () => void;
  onSave: (exerciseId: string, weight: number) => void;
}

export function WeightModal({
  open,
  exercise,
  series,
  currentWeight,
  onClose,
  onSave,
}: WeightModalProps) {
  const [value, setValue] = useState(currentWeight);
  const history =
    exercise != null && series != null
      ? getExerciseHistory(series, exercise.id)
      : [];

  useEffect(() => {
    if (open) setValue(currentWeight);
  }, [open, currentWeight]);

  const handleSave = () => {
    const n = value.trim();
    if (n && !Number.isNaN(Number(n)) && exercise != null) {
      onSave(exercise.id, Number(n));
      onClose();
    }
  };

  if (exercise == null) return null;
  return (
    <Modal open={open} onClose={onClose} title={exercise.name}>
      <div className="tw-space-y-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-1">
            Carga (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            className="tw-w-full tw-px-4 tw-py-3 tw-text-lg tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: 50"
          />
        </div>
        {history.length > 0 && (
          <div>
            <p className="tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-2">
              Histórico recente
            </p>
            <ul className="tw-space-y-1 tw-text-sm tw-text-slate-300">
              {history.slice(0, 5).map((entry, i) => (
                <li key={i}>
                  {entry.date}: {entry.weight} kg
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="tw-flex tw-gap-3 tw-pt-2">
          <button
            type="button"
            className="tw-flex-1 tw-py-3 tw-rounded-xl tw-bg-slate-700/80 tw-text-slate-50 tw-font-medium"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="tw-flex-1 tw-py-3 tw-rounded-xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold"
            onClick={handleSave}
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}
