import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export const LEGACY_APP_STATE_KEY = "primary";

type AuthContext = MutationCtx | QueryCtx;

export type AuthenticatedUser = {
  session: Doc<"sessions">;
  user: Doc<"users">;
  userId: Id<"users">;
};

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): string {
  const trimmed = value.trim();
  const normalized = normalizeUsername(trimmed);

  if (!/^[a-z0-9._-]{3,24}$/.test(normalized)) {
    throw new Error(
      "Use um nome de usuário com 3 a 24 caracteres: letras, números, ponto, hífen ou underscore.",
    );
  }

  return trimmed;
}

export function validatePassword(value: string): string {
  if (value.length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }

  return value;
}

export function buildUserAppStateKey(userId: Id<"users">): string {
  return `user:${userId}`;
}

export async function getAuthenticatedUser(
  ctx: AuthContext,
  sessionId: string,
): Promise<AuthenticatedUser> {
  const session = await ctx.db.get(sessionId as Id<"sessions">);

  if (!session) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const user = await ctx.db.get(session.userId);

  if (!user) {
    throw new Error("Usuário não encontrado para esta sessão.");
  }

  return {
    session,
    user,
    userId: user._id,
  };
}
