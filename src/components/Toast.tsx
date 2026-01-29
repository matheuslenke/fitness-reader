import type { ToastState } from "../types/fitness";

interface ToastProps {
  toast: ToastState | null;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type ?? "info"}`}>
      <span>{toast.text}</span>
    </div>
  );
}
