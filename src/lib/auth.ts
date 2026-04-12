export const AUTH_STORAGE_KEY = "fitness-reader.auth-session";

export type StoredAuthSession = {
  sessionId: string;
  userId: string;
  username: string;
};

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.sessionId === "string" &&
    typeof candidate.userId === "string" &&
    typeof candidate.username === "string"
  );
}

export function readStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);
    return isStoredAuthSession(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function writeStoredAuthSession(session: StoredAuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
