import type { ProgressPhoto } from "../types/fitness";
import { formatDate } from "../lib/utils";

interface ProgressGalleryProps {
  photos: ProgressPhoto[];
  onAdd: () => void;
}

export function ProgressGallery({ photos, onAdd }: ProgressGalleryProps) {
  return (
    <div className="tw-px-4 tw-space-y-3">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-font-display tw-text-lg tw-font-bold tw-text-slate-50">Progresso</h2>
        <button
          type="button"
          className="touch-target tw-px-3 tw-py-1.5 tw-rounded-full tw-border tw-border-slate-500/50 tw-text-slate-50 tw-text-xs tw-uppercase tw-tracking-wider"
          onClick={onAdd}
        >
          Adicionar foto
        </button>
      </div>
      {photos.length === 0 ? (
        <div className="glass-panel tw-px-4 tw-py-6 tw-rounded-3xl tw-text-center tw-text-sm tw-text-slate-400">
          Registre fotos do progresso semanalmente para comparar evolução.
        </div>
      ) : (
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          {photos.slice(0, 4).map((photo) => (
            <div
              key={photo.id}
              className="photo-card tw-bg-surface tw-border tw-border-slate-700/50 tw-shadow-lg"
            >
              <img
                src={photo.src}
                alt={`Progresso ${photo.date}`}
                className="tw-w-full tw-h-32 tw-object-cover"
              />
              <div className="tw-p-2 tw-text-xs tw-text-slate-100 tw-bg-black/40 tw-backdrop-blur-sm">
                <p>{formatDate(photo.date)}</p>
                {photo.note != null && photo.note !== "" && (
                  <p className="tw-text-[0.6rem] tw-text-slate-200">
                    {photo.note}
                  </p>
                )}
              </div>
            </div>
          ))}
          {photos.length > 4 && (
            <div className="photo-card tw-flex tw-items-center tw-justify-center glass-panel">
              <span className="tw-text-sm tw-font-display tw-font-bold tw-text-slate-50">
                +{photos.length - 4} a mais
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
