import { useState, useEffect } from "react";
import { Modal } from "./Modal";

interface MetricsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (bodyWeight: number, bodyFatPercent: number | null) => void;
  initialWeight: number | null;
  initialBodyFat: number | null;
}

export function MetricsModal({
  open,
  onClose,
  onSave,
  initialWeight,
  initialBodyFat,
}: MetricsModalProps) {
  const [bodyWeight, setBodyWeight] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");

  useEffect(() => {
    if (open) {
      setBodyWeight(initialWeight != null ? String(initialWeight) : "");
      setBodyFatPercent(initialBodyFat != null ? String(initialBodyFat) : "");
    }
  }, [open, initialWeight, initialBodyFat]);

  const handleSave = () => {
    const w = bodyWeight.trim();
    if (w && !Number.isNaN(Number(w))) {
      onSave(
        Number(w),
        bodyFatPercent.trim() === ""
          ? null
          : Number.isNaN(Number(bodyFatPercent))
            ? null
            : Number(bodyFatPercent)
      );
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Peso e gordura corporal">
      <div className="tw-space-y-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-1">
            Peso (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50"
            value={bodyWeight}
            onChange={(e) => setBodyWeight(e.target.value)}
            placeholder="Ex: 78"
          />
        </div>
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-1">
            Gordura corporal (%)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            max={100}
            className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50"
            value={bodyFatPercent}
            onChange={(e) => setBodyFatPercent(e.target.value)}
            placeholder="Opcional"
          />
        </div>
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
