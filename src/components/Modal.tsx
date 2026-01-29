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
        className="tw-absolute tw-inset-0 tw-bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="tw-relative tw-w-full tw-max-w-lg tw-max-h-[90vh] tw-overflow-auto tw-rounded-t-2xl sm:tw-rounded-2xl tw-bg-surface tw-border tw-border-slate-700/50 tw-shadow-xl tw-animate-in tw-slide-in-from-bottom sm:tw-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {title != null && (
          <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-slate-700/50 tw-bg-surface">
            <h2 className="tw-font-display tw-text-lg tw-font-bold tw-text-slate-50">{title}</h2>
            <button
              type="button"
              className="touch-target tw-min-w-[44px] tw-min-h-[44px] tw-rounded-full tw-text-2xl tw-leading-none tw-text-slate-400 hover:tw-bg-slate-700/80"
              onClick={onClose}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        )}
        <div className="tw-p-4 tw-text-slate-50">{children}</div>
      </div>
    </div>
  );
}
