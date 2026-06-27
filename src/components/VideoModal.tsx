import { Modal } from "./Modal";
import { getEmbedUrl } from "../lib/utils";
import type { Exercise } from "../types/fitness";

interface VideoModalProps {
  open: boolean;
  exercise: Exercise | null;
  onClose: () => void;
}

export function VideoModal({ open, exercise, onClose }: VideoModalProps) {
  const embed = getEmbedUrl(exercise?.videoUrl);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={exercise?.name ?? "Vídeo do exercício"}
      size="wide"
    >
      {embed ? (
        <iframe
          title={`Vídeo: ${exercise?.name ?? "exercício"}`}
          className="video-embed tw-w-full"
          src={embed}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      ) : (
        <p className="tw-p-4 tw-text-slate-400">
          Vídeo não disponível.
        </p>
      )}
    </Modal>
  );
}
