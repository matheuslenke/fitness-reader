import { Modal } from "./Modal";
import { getEmbedUrl } from "../lib/utils";

interface VideoModalProps {
  open: boolean;
  url: string | null;
  onClose: () => void;
}

export function VideoModal({ open, url, onClose }: VideoModalProps) {
  const embed = getEmbedUrl(url ?? undefined);
  return (
    <Modal open={open} onClose={onClose} title="Vídeo">
      {embed ? (
        <iframe
          title="Video"
          className="video-embed tw-rounded-lg tw-w-full"
          src={embed}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      ) : (
        <p className="tw-text-zinc-500 tw-dark:tw-text-zinc-400">
          Vídeo não disponível.
        </p>
      )}
    </Modal>
  );
}
