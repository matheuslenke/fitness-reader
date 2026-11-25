import { Modal } from "./Modal";
import { getEmbedUrl, isYouTubeShortUrl } from "../lib/utils";
import type { Exercise } from "../types/fitness";

interface VideoModalProps {
  open: boolean;
  exercise: Exercise | null;
  onClose: () => void;
}

export function VideoModal({ open, exercise, onClose }: VideoModalProps) {
  const videoUrl = exercise?.videoUrl ?? "";
  const embed = getEmbedUrl(videoUrl, { autoplay: true });
  const isVertical = isYouTubeShortUrl(videoUrl);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={exercise?.name ?? "Vídeo do exercício"}
      size={isVertical ? "default" : "wide"}
    >
      <div className={isVertical ? "video-player--vertical" : ""}>
        {embed ? (
          <iframe
            title={`Vídeo: ${exercise?.name ?? "exercício"}`}
            className={`video-embed ${isVertical ? "video-embed--vertical" : ""}`}
            src={embed}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="tw-grid tw-min-h-40 tw-place-items-center tw-rounded-2xl tw-bg-slate-900/55 tw-p-4 tw-text-sm tw-text-slate-400">
            Vídeo indisponível. Edite o plano para adicionar um link válido.
          </div>
        )}
      </div>
    </Modal>
  );
}
