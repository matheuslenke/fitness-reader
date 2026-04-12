import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { buildDefaultSnapshot, ensureAppSnapshot } from "../src/lib/storage";
import {
  buildUserAppStateKey,
  LEGACY_APP_STATE_KEY,
} from "./authHelpers";

export const getSession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId as Id<"sessions">);

    if (!session) {
      return null;
    }

    const user = await ctx.db.get(session.userId);

    if (!user) {
      return null;
    }

    return {
      sessionId: args.sessionId,
      userId: user._id,
      username: user.username,
    };
  },
});

export const logout = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId as Id<"sessions">);

    if (!session) {
      return { success: true };
    }

    await ctx.db.delete(session._id);
    return { success: true };
  },
});

export const getUserByUsernameNormalized = internalQuery({
  args: {
    usernameNormalized: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username_normalized", (queryBuilder) =>
        queryBuilder.eq("usernameNormalized", args.usernameNormalized),
      )
      .unique();
  },
});

export const hasAnyUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const firstUser = await ctx.db.query("users").first();
    return firstUser != null;
  },
});

export const createUser = internalMutation({
  args: {
    username: v.string(),
    usernameNormalized: v.string(),
    passwordHash: v.string(),
    passwordSalt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      username: args.username,
      usernameNormalized: args.usernameNormalized,
      passwordHash: args.passwordHash,
      passwordSalt: args.passwordSalt,
      createdAt: new Date().toISOString(),
    });

    return {
      userId,
      username: args.username,
    };
  },
});

export const createSession = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      createdAt: new Date().toISOString(),
    });

    return {
      sessionId,
    };
  },
});

export const initializeUserAppState = internalMutation({
  args: {
    userId: v.id("users"),
    username: v.string(),
    claimLegacyData: v.boolean(),
  },
  handler: async (ctx, args) => {
    const key = buildUserAppStateKey(args.userId);
    const existingState = await ctx.db
      .query("appState")
      .withIndex("by_key", (queryBuilder) => queryBuilder.eq("key", key))
      .unique();

    if (existingState) {
      return existingState._id;
    }

    let snapshot = buildDefaultSnapshot();
    let shouldKeepExistingProfileName = false;

    if (args.claimLegacyData) {
      const legacyState = await ctx.db
        .query("appState")
        .withIndex("by_key", (queryBuilder) =>
          queryBuilder.eq("key", LEGACY_APP_STATE_KEY),
        )
        .unique();

      if (legacyState) {
        snapshot = ensureAppSnapshot(legacyState);
        shouldKeepExistingProfileName = true;
      }
    }

    const nextSnapshot = ensureAppSnapshot({
      ...snapshot,
      profile: {
        ...snapshot.profile,
        name: shouldKeepExistingProfileName ? snapshot.profile.name : args.username,
      },
    });

    return await ctx.db.insert("appState", {
      key,
      profile: nextSnapshot.profile,
      series: nextSnapshot.series,
      sessions: nextSnapshot.sessions,
      templateLibrary: nextSnapshot.templateLibrary,
    });
  },
});
