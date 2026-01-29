import { useState, useEffect } from "react";
import type { Series } from "../types/fitness";
import { todayStr } from "../lib/utils";
import { Modal } from "./Modal";

interface SeriesManagerModalProps {
  open: boolean;
  onClose: () => void;
  series: Series | null;
  onSave: (payload: {
    name: string;
    startDate: string;
    endDate: string;
    status: Series["status"];
  }) => void;
  onDelete: (id: string) => void;
}

export function SeriesManagerModal({
  open,
  onClose,
  series,
  onSave,
  onDelete,
}: SeriesManagerModalProps) {
  const isEdit = series != null;
  const [name, setName] = useState(series?.name ?? "");
  const [startDate, setStartDate] = useState(series?.startDate ?? todayStr());
  const [endDate, setEndDate] = useState(series?.endDate ?? todayStr());
  const [status, setStatus] = useState<Series["status"]>(
    series?.status ?? "active"
  );

  useEffect(() => {
    if (open) {
      setName(series?.name ?? "");
      setStartDate(series?.startDate ?? todayStr());
      setEndDate(series?.endDate ?? todayStr());
      setStatus(series?.status ?? "active");
    }
  }, [open, series]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), startDate, endDate, status });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar série" : "Nova série"}
    >
      <div className="tw-space-y-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-zinc-600 tw-dark:tw-text-zinc-400 tw-mb-1">
            Nome
          </label>
          <input
            type="text"
            className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-zinc-300 tw-dark:tw-border-zinc-600 tw-dark:tw-bg-zinc-900 tw-dark:tw-text-zinc-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ciclo Jan-Mar 2026"
          />
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-zinc-600 tw-dark:tw-text-zinc-400 tw-mb-1">
              Início
            </label>
            <input
              type="date"
              className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-zinc-300 tw-dark:tw-border-zinc-600 tw-dark:tw-bg-zinc-900 tw-dark:tw-text-zinc-100"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-zinc-600 tw-dark:tw-text-zinc-400 tw-mb-1">
              Fim
            </label>
            <input
              type="date"
              className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-zinc-300 tw-dark:tw-border-zinc-600 tw-dark:tw-bg-zinc-900 tw-dark:tw-text-zinc-100"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {isEdit && (
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-zinc-600 tw-dark:tw-text-zinc-400 tw-mb-1">
              Status
            </label>
            <select
              className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-zinc-300 tw-dark:tw-border-zinc-600 tw-dark:tw-bg-zinc-900 tw-dark:tw-text-zinc-100"
              value={status}
              onChange={(e) => setStatus(e.target.value as Series["status"])}
            >
              <option value="active">Ativa</option>
              <option value="completed">Concluída</option>
              <option value="archived">Arquivada</option>
            </select>
          </div>
        )}
        <div className="tw-flex tw-gap-3 tw-pt-2">
          {isEdit && series != null && (
            <button
              type="button"
              className="tw-py-3 tw-px-4 tw-rounded-xl tw-bg-red-100 tw-text-red-600 tw-dark:tw-bg-red-900/30 tw-dark:tw-text-red-400 tw-font-medium"
              onClick={() => {
                if (window.confirm("Excluir esta série?")) {
                  onDelete(series.id);
                  onClose();
                }
              }}
            >
              Excluir
            </button>
          )}
          <button
            type="button"
            className="tw-flex-1 tw-py-3 tw-rounded-xl tw-bg-zinc-200 tw-dark:tw-bg-zinc-700 tw-font-medium"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="tw-flex-1 tw-py-3 tw-rounded-xl tw-bg-emerald-600 tw-text-white tw-font-medium"
            onClick={handleSubmit}
          >
            {isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
