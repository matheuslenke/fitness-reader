export function getEmbedUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0]?.split("/")[0] ?? "";
      return `https://player.vimeo.com/video/${id}`;
    }
    if (url.includes("youtube.com/shorts/")) {
      const id = url.split("shorts/")[1]?.split("?")[0] ?? "";
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtube.com") && url.includes("v=")) {
      const id = new URL(url).searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
  } catch {
    // ignore
  }
  return "";
}

export function formatDate(str: string | undefined): string {
  if (!str) return "";
  const parts = str.split("-");
  const d = parts[2];
  const m = parts[1];
  const y = parts[0];
  return `${d ?? ""}/${m ?? ""}/${y ?? ""}`;
}

export function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return Math.max(0, Math.round((b - a) / (24 * 60 * 60 * 1000)));
}

export function generateId(): string {
  return "s-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} ${time}`;
  } catch {
    return iso;
  }
}
