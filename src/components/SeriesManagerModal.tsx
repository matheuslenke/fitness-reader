import { useState, useEffect } from "react";
import type { PlanTemplate, Series } from "../types/fitness";
import { todayStr } from "../lib/utils";
import { Modal } from "./Modal";

export interface SeriesManagerSavePayload {
  name: string;
  startDate: string;
  endDate: string;
  status: Series["status"];
  templateId?: string;
}

interface SeriesManagerModalProps {
  open: boolean;
  onClose: () => void;
  series: Series | null;
  currentActiveSeries: Series | null;
  templates: PlanTemplate[];
  defaultTemplateId?: string | null;
  onSave: (payload: SeriesManagerSavePayload) => void;
  onDelete: (id: string) => void;
}

export function SeriesManagerModal({
  open,
  onClose,
  series,
  currentActiveSeries,
  templates,
  defaultTemplateId,
  onSave,
  onDelete,
}: SeriesManagerModalProps) {
  const isEdit = series != null;
  const firstId = templates[0]?.id ?? "";
  const [name, setName] = useState(series?.name ?? "");
  const [startDate, setStartDate] = useState(series?.startDate ?? todayStr());
  const [endDate, setEndDate] = useState(series?.endDate ?? todayStr());
  const [status, setStatus] = useState<Series["status"]>(
    series?.status ?? "active"
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    defaultTemplateId ?? series?.templateId ?? firstId
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const initialTemplateId = defaultTemplateId ?? series?.templateId ?? firstId;
      const initialTemplate = templates.find(
        (template) => template.id === initialTemplateId,
      );
      setName(series?.name ?? initialTemplate?.name ?? "");
      setStartDate(series?.startDate ?? todayStr());
      setEndDate(series?.endDate ?? todayStr());
      setStatus(series?.status ?? "active");
      setSelectedTemplateId(initialTemplateId);
      setValidationMessage(null);
    }
  }, [open, series, firstId, defaultTemplateId, templates]);

  const willReplaceActiveSeries =
    status === "active" &&
    currentActiveSeries != null &&
    currentActiveSeries.id !== series?.id;

  const handleSubmit = () => {
    if (!name.trim()) {
      setValidationMessage("Informe um nome para criar a série.");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setValidationMessage("A data final deve ser igual ou posterior à inicial.");
      return;
    }
    const tid = templates.some((t) => t.id === selectedTemplateId)
      ? selectedTemplateId
      : firstId;
    setValidationMessage(null);
    onSave({
      name: name.trim(),
      startDate,
      endDate,
      status,
      templateId: tid || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar série" : "Nova série"}
    >
      <div className="tw-space-y-4">
        {willReplaceActiveSeries && (
          <div className="tw-rounded-2xl tw-border tw-border-primary/30 tw-bg-primary-dim/50 tw-p-4 tw-text-sm tw-text-slate-200">
            Ao salvar esta série como ativa, &quot;{currentActiveSeries.name}
            &quot; será concluída automaticamente.
          </div>
        )}
        {templates.length > 0 && (
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-1">
              Plano (template)
            </label>
            <select
              className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-slate-400 tw-mb-1">
            Nome
          </label>
          <input
            type="text"
            className="tw-w-full tw-px-4 tw-py-3 tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-text-slate-50"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setValidationMessage(null);
            }}
            placeholder="Ex: Ciclo Jan-Mar 2026"
            aria-invalid={validationMessage != null}
          />
          {validationMessage && (
            <p className="tw-mt-2 tw-text-sm tw-text-red-300" role="alert">
              {validationMessage}
            </p>
          )}
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
        <div className="tw-flex tw-gap-3 tw-pt-2">
          {isEdit && series != null && (
            <button
              type="button"
              className="tw-py-3 tw-px-4 tw-rounded-xl tw-bg-danger/20 tw-text-red-400 tw-font-medium tw-border tw-border-danger/40"
              onClick={() => {
                if (window.confirm("Excluir este treino?")) {
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
            {isEdit ? "Salvar" : "Criar série"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
