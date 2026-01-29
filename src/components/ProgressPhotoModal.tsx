import { useState, useEffect } from "react";
import { todayStr } from "../lib/utils";
import { Modal } from "./Modal";

interface ProgressPhotoPayload {
  date: string;
  note: string;
  src: string;
}

interface ProgressPhotoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (photo: ProgressPhotoPayload) => void;
}

export function ProgressPhotoModal({
  open,
  onClose,
  onSave,
}: ProgressPhotoModalProps) {
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(todayStr());
      setNote("");
      setFile(null);
      setPreview(null);
    }
  }, [open]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSave = () => {
    if (file == null) return;
    const reader = new FileReader();
    reader.onload = () => {
      onSave({ date, note, src: reader.result as string });
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!open) return null;
  return (
    <Modal open onClose={onClose} title="Nova foto de progresso">
      <div className="tw-space-y-4">
        <div>
          <label className="tw-text-xs tw-uppercase tw-text-slate-400">
            Data
          </label>
          <input
            type="date"
            className="tw-w-full tw-rounded-2xl tw-px-3 tw-py-2 tw-mt-1 tw-bg-background tw-border tw-border-slate-600 tw-text-slate-50 tw-text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="tw-text-xs tw-uppercase tw-text-slate-400">
            Nota
          </label>
          <input
            type="text"
            className="tw-w-full tw-rounded-2xl tw-px-3 tw-py-2 tw-mt-1 tw-bg-background tw-border tw-border-slate-600 tw-text-slate-50 tw-text-sm"
            placeholder="Ex: Foco no core"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div>
          <label className="tw-text-xs tw-uppercase tw-text-slate-400">
            Imagem
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="tw-w-full tw-mt-2 tw-text-xs tw-text-slate-400"
          />
          {preview != null && (
            <img
              src={preview}
              alt="Preview"
              className="tw-mt-2 tw-w-full tw-rounded-2xl tw-border tw-border-slate-600 tw-object-cover tw-h-36"
            />
          )}
        </div>
        <div className="tw-flex tw-gap-3">
          <button
            type="button"
            className="tw-flex-1 tw-rounded-xl tw-bg-slate-700/80 tw-text-slate-50 tw-py-3 tw-font-medium"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="tw-flex-1 tw-rounded-xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold tw-py-3"
            onClick={handleSave}
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}
