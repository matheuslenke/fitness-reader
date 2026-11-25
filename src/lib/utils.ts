type EmbedOptions = {
  autoplay?: boolean;
  background?: boolean;
};

export const MAX_REPETITION_COUNT = 999;

export function getSuggestedRepetitionCount(repetitions: string): number {
  const suggestedCountMatch = repetitions.match(/\d+/);
  if (!suggestedCountMatch) return 0;

  return Math.min(MAX_REPETITION_COUNT, Number(suggestedCountMatch[0]));
}

function withPlaybackOptions(
  embedUrl: string,
  provider: "youtube" | "vimeo",
  options: EmbedOptions,
  videoId: string,
): string {
  if (options.background) {
    const query =
      provider === "youtube"
        ? new URLSearchParams({
            autoplay: "1",
            mute: "1",
            playsinline: "1",
            controls: "0",
            loop: "1",
            playlist: videoId,
            rel: "0",
            modestbranding: "1",
            disablekb: "1",
          })
        : new URLSearchParams({
            background: "1",
            autoplay: "1",
            muted: "1",
            playsinline: "1",
            loop: "1",
            controls: "0",
            autopause: "0",
          });
    return `${embedUrl}?${query.toString()}`;
  }

  if (!options.autoplay) return embedUrl;

  const query =
    provider === "youtube"
      ? "autoplay=1&mute=1&playsinline=1&rel=0"
      : "autoplay=1&muted=1&playsinline=1";
  return `${embedUrl}?${query}`;
}

export function isYouTubeShortUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");
    return (
      (hostname === "youtube.com" || hostname === "m.youtube.com") &&
      parsedUrl.pathname.startsWith("/shorts/")
    );
  } catch {
    return false;
  }
}

export function getEmbedUrl(
  url: string | null | undefined,
  options: EmbedOptions = {},
): string {
  if (!url) return "";
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "vimeo.com") {
      const id = parsedUrl.pathname.split("/").filter(Boolean)[0] ?? "";
      return id
        ? withPlaybackOptions(
            `https://player.vimeo.com/video/${id}`,
            "vimeo",
            options,
            id,
          )
        : "";
    }

    if (hostname === "youtu.be") {
      const id = parsedUrl.pathname.split("/").filter(Boolean)[0] ?? "";
      return id
        ? withPlaybackOptions(
            `https://www.youtube.com/embed/${id}`,
            "youtube",
            options,
            id,
          )
        : "";
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsedUrl.pathname.startsWith("/shorts/")) {
        const id = parsedUrl.pathname.split("/").filter(Boolean)[1] ?? "";
        return id
          ? withPlaybackOptions(
              `https://www.youtube.com/embed/${id}`,
              "youtube",
              options,
              id,
            )
          : "";
      }

      const id = parsedUrl.searchParams.get("v");
      return id
        ? withPlaybackOptions(
            `https://www.youtube.com/embed/${id}`,
            "youtube",
            options,
            id,
          )
        : "";
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
