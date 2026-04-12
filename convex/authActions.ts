import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  normalizeUsername,
  validatePassword,
  validateUsername,
} from "./authHelpers";

const HASH_ITERATIONS = 100_000;

type AuthActionResult = {
  sessionId: Id<"sessions">;
  userId: Id<"users">;
  username: string;
};

type CreatedUser = {
  userId: Id<"users">;
  username: string;
};

type CreatedSession = {
  sessionId: Id<"sessions">;
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}

function hexToBytes(value: string): Uint8Array {
  const result = new Uint8Array(value.length / 2);

  for (let index = 0; index < result.length; index += 1) {
    const start = index * 2;
    result[index] = Number.parseInt(value.slice(start, start + 2), 16);
  }

  return result;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const passwordMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(salt),
      iterations: HASH_ITERATIONS,
    },
    passwordMaterial,
    256,
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

function generateSalt(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

function verifyHash(
  computedHash: string,
  expectedHash: string,
): boolean {
  if (computedHash.length !== expectedHash.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < computedHash.length; index += 1) {
    mismatch |= computedHash.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  }

  return mismatch === 0;
}

export const register = action({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<AuthActionResult> => {
    const username = validateUsername(args.username);
    const password = validatePassword(args.password);
    const usernameNormalized = normalizeUsername(username);

    const existingUser: Doc<"users"> | null = await ctx.runQuery(
      internal.auth.getUserByUsernameNormalized,
      {
        usernameNormalized,
      },
    );

    if (existingUser) {
      throw new Error("Esse nome de usuário já está em uso.");
    }

    const alreadyHasUsers = await ctx.runQuery(internal.auth.hasAnyUsers, {});
    const passwordSalt = generateSalt();
    const passwordHash = await hashPassword(password, passwordSalt);
    const user: CreatedUser = await ctx.runMutation(internal.auth.createUser, {
      username,
      usernameNormalized,
      passwordHash,
      passwordSalt,
    });

    await ctx.runMutation(internal.auth.initializeUserAppState, {
      userId: user.userId,
      username,
      claimLegacyData: !alreadyHasUsers,
    });

    const session: CreatedSession = await ctx.runMutation(
      internal.auth.createSession,
      {
        userId: user.userId,
      },
    );

    return {
      sessionId: session.sessionId,
      userId: user.userId,
      username,
    };
  },
});

export const login = action({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<AuthActionResult> => {
    const username = validateUsername(args.username);
    const password = validatePassword(args.password);
    const usernameNormalized = normalizeUsername(username);
    const user: Doc<"users"> | null = await ctx.runQuery(
      internal.auth.getUserByUsernameNormalized,
      {
        usernameNormalized,
      },
    );

    if (!user) {
      throw new Error("Usuário ou senha inválidos.");
    }

    const passwordMatches = verifyHash(
      await hashPassword(password, user.passwordSalt),
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new Error("Usuário ou senha inválidos.");
    }

    await ctx.runMutation(internal.auth.initializeUserAppState, {
      userId: user._id,
      username: user.username,
      claimLegacyData: false,
    });

    const session: CreatedSession = await ctx.runMutation(
      internal.auth.createSession,
      {
        userId: user._id,
      },
    );

    return {
      sessionId: session.sessionId,
      userId: user._id,
      username: user.username,
    };
  },
});
