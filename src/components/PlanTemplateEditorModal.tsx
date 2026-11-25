import { useEffect, useMemo, useState } from "react";
import { getEmbedUrl } from "../lib/utils";
import type { PlanTemplate } from "../types/fitness";
import { ActivityIndicator } from "./LoadingScreen";
import { Modal } from "./Modal";

type PlanTemplateEditorModalProps = {
  open: boolean;
  template: PlanTemplate | null;
  onClose: () => void;
  onSave: (template: PlanTemplate) => Promise<void>;
};

function getInitialVideoUrls(template: PlanTemplate | null): Record<string, string> {
  if (template == null) return {};

  return Object.fromEntries(
    template.groups.flatMap((group) =>
      group.exercises.map((exercise) => [exercise.id, exercise.videoUrl]),
    ),
  );
}

export function PlanTemplateEditorModal({
  open,
  template,
  onClose,
  onSave,
}: PlanTemplateEditorModalProps) {
  const [name, setName] = useState("");
  const [activeGroup, setActiveGroup] = useState("");
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || template == null) return;

    setName(template.name);
    setActiveGroup(template.groups[0]?.group ?? "");
    setVideoUrls(getInitialVideoUrls(template));
    setValidationMessage(null);
    setIsSaving(false);
  }, [open, template]);

  const selectedGroup = useMemo(
    () => template?.groups.find((group) => group.group === activeGroup) ?? null,
    [activeGroup, template],
  );

  const videoCount = useMemo(
    () => Object.values(videoUrls).filter((url) => getEmbedUrl(url.trim())).length,
    [videoUrls],
  );

  const exerciseCount = useMemo(
    () =>
      template?.groups.reduce(
        (count, group) => count + group.exercises.length,
        0,
      ) ?? 0,
    [template],
  );

  const handleSave = async () => {
    if (template == null) return;

    const normalizedName = name.trim();
    if (!normalizedName) {
      setValidationMessage("Informe um nome para o plano.");
      return;
    }

    for (const group of template.groups) {
      for (const exercise of group.exercises) {
        const videoUrl = (videoUrls[exercise.id] ?? "").trim();
        if (videoUrl && !getEmbedUrl(videoUrl)) {
          setActiveGroup(group.group);
          setValidationMessage(
            `O link de vídeo de “${exercise.name}” não é válido.`,
          );
          return;
        }
      }
    }

    setIsSaving(true);
    setValidationMessage(null);

    try {
      await onSave({
        ...template,
        name: normalizedName,
        groups: template.groups.map((group) => ({
          ...group,
          exercises: group.exercises.map((exercise) => ({
            ...exercise,
            videoUrl: (videoUrls[exercise.id] ?? "").trim(),
          })),
        })),
      });
      onClose();
    } catch {
      setValidationMessage("Não foi possível salvar o plano.");
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar plano"
      size="wide"
      contentClassName="tw-p-0"
    >
      {template != null && (
        <div>
          <div className="tw-space-y-4 tw-p-4">
            <div className="tw-rounded-2xl tw-bg-primary-dim/45 tw-p-4 tw-shadow-[inset_0_0_0_1px_rgba(190,242,100,0.12)]">
              <p className="tw-text-sm tw-font-semibold tw-text-primary">
                Vídeos compartilhados pelo plano
              </p>
              <p className="tw-mt-1 tw-text-sm tw-text-slate-300 tw-text-pretty">
                Ao salvar, os vídeos também serão atualizados nas séries que usam este plano.
              </p>
            </div>

            <div>
              <label
                className="tw-mb-1 tw-block tw-text-sm tw-font-medium tw-text-slate-300"
                htmlFor="template-name"
              >
                Nome do plano
              </label>
              <input
                id="template-name"
                type="text"
                className="tw-w-full tw-rounded-xl tw-border tw-border-slate-600 tw-bg-background tw-px-4 tw-py-3 tw-text-slate-50"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setValidationMessage(null);
                }}
              />
            </div>

            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
              <div>
                <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-slate-500">
                  Exercícios
                </p>
                <p className="tw-mt-1 tw-text-sm tw-text-slate-300 tabular-nums">
                  {videoCount} de {exerciseCount} com vídeo
                </p>
              </div>
              <div className="tw-flex tw-gap-2 tw-overflow-x-auto tw-p-1">
                {template.groups.map((group) => (
                  <button
                    key={group.group}
                    type="button"
                    className={`touch-target tw-min-w-11 tw-rounded-xl tw-px-3 tw-py-2 tw-font-display tw-text-sm tw-font-bold tw-transition-[background-color,color,transform] active:tw-scale-[0.96] ${
                      group.group === activeGroup
                        ? "tw-bg-active-gradient tw-text-slate-950"
                        : "tw-bg-slate-800/80 tw-text-slate-300"
                    }`}
                    onClick={() => setActiveGroup(group.group)}
                    aria-pressed={group.group === activeGroup}
                  >
                    {group.group}
                  </button>
                ))}
              </div>
            </div>

            <div className="tw-space-y-3">
              {selectedGroup?.exercises.map((exercise) => {
                const currentUrl = videoUrls[exercise.id] ?? "";
                const hasValidVideo = Boolean(getEmbedUrl(currentUrl.trim()));

                return (
                  <article
                    key={exercise.id}
                    className="tw-rounded-2xl tw-bg-slate-900/45 tw-p-4 tw-shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]"
                  >
                    <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                      <div className="tw-min-w-0">
                        <h3 className="tw-font-display tw-font-bold tw-text-slate-50 tw-text-pretty">
                          {exercise.name}
                        </h3>
                        <p className="tw-mt-1 tw-text-xs tw-text-slate-500 tabular-nums">
                          {exercise.sets} × {exercise.reps}
                        </p>
                      </div>
                      <span
                        className={`tw-shrink-0 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-bold ${
                          hasValidVideo
                            ? "tw-bg-primary-dim tw-text-primary"
                            : "tw-bg-slate-800 tw-text-slate-500"
                        }`}
                      >
                        {hasValidVideo ? "Com vídeo" : "Sem vídeo"}
                      </span>
                    </div>
                    <label
                      className="tw-mt-3 tw-block tw-text-xs tw-font-medium tw-text-slate-400"
                      htmlFor={`template-video-${exercise.id}`}
                    >
                      Link do YouTube Shorts, YouTube ou Vimeo
                    </label>
                    <input
                      id={`template-video-${exercise.id}`}
                      type="url"
                      inputMode="url"
                      className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-slate-700 tw-bg-background tw-px-3 tw-py-2.5 tw-text-sm tw-text-slate-50"
                      value={currentUrl}
                      onChange={(event) => {
                        setVideoUrls((currentVideoUrls) => ({
                          ...currentVideoUrls,
                          [exercise.id]: event.target.value,
                        }));
                        setValidationMessage(null);
                      }}
                      placeholder="https://youtube.com/shorts/..."
                    />
                  </article>
                );
              })}
            </div>

            {validationMessage && (
              <p className="tw-text-sm tw-text-red-300" role="alert">
                {validationMessage}
              </p>
            )}
          </div>

          <div className="tw-sticky tw-bottom-0 tw-flex tw-justify-end tw-gap-3 tw-bg-surface/95 tw-p-4 tw-shadow-[0_-12px_30px_rgba(15,23,42,0.35)] tw-backdrop-blur-xl">
            <button
              type="button"
              className="touch-target tw-rounded-xl tw-bg-slate-700/80 tw-px-4 tw-py-3 tw-font-medium tw-text-slate-50 tw-transition-transform active:tw-scale-[0.96]"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="touch-target tw-gap-2 tw-rounded-xl tw-bg-active-gradient tw-px-5 tw-py-3 tw-font-display tw-font-bold tw-text-slate-950 tw-transition-transform active:tw-scale-[0.96] disabled:tw-cursor-wait disabled:tw-opacity-60"
              onClick={() => void handleSave()}
              disabled={isSaving}
              aria-busy={isSaving}
            >
              {isSaving && <ActivityIndicator />}
              {isSaving ? "Salvando…" : "Salvar plano"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
