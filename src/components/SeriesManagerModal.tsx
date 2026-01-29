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
          <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-1">
            Nome
          </label>
          <input
            type="text"
            className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ciclo Jan-Mar 2026"
          />
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-1">
              Início
            </label>
            <input
              type="date"
              className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-1">
              Fim
            </label>
            <input
              type="date"
              className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {isEdit && (
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-1">
              Status
            </label>
            <select
              className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50"
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
              className="tw-py-3 tw-px-4 tw-rounded-xl tw-bg-danger/20 tw-text-red-400 tw-font-medium tw-border tw-border-danger/40"
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
            className="tw-flex-1 tw-py-3 tw-rounded-xl tw-bg-slate-700/80 tw-text-slate-50 tw-font-medium"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="tw-flex-1 tw-py-3 tw-rounded-xl tw-bg-active-gradient tw-text-slate-900 tw-font-display tw-font-bold"
            onClick={handleSubmit}
          >
            {isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
