import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function Modal({ open, onClose, children, title }: ModalProps) {
  if (!open) return null;
  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-end sm:tw-items-center tw-justify-center">
      <div
        className="tw-absolute tw-inset-0 tw-bg-black/60 tw-dark:tw-bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="tw-relative tw-w-full tw-max-w-lg tw-max-h-[90vh] tw-overflow-auto tw-rounded-t-2xl sm:tw-rounded-2xl tw-bg-white tw-dark:tw-bg-zinc-800 tw-shadow-xl tw-animate-in tw-slide-in-from-bottom sm:tw-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {title != null && (
          <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-zinc-200 tw-dark:tw-border-zinc-700 tw-bg-white tw-dark:tw-bg-zinc-800">
            <h2 className="tw-text-lg tw-font-semibold">{title}</h2>
            <button
              type="button"
              className="touch-target tw-min-w-[44px] tw-min-h-[44px] tw-rounded-full tw-text-2xl tw-leading-none tw-text-zinc-500 hover:tw-bg-zinc-100 tw-dark:hover:tw-bg-zinc-700"
              onClick={onClose}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        )}
        <div className="tw-p-4">{children}</div>
      </div>
    </div>
  );
}
