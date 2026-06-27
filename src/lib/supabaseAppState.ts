import type { User } from "@supabase/supabase-js";
import type { AppSnapshot } from "../types/fitness";
import { buildDefaultSnapshot, ensureAppSnapshot } from "./storage";
import { requireSupabase } from "./supabase";

type FitnessAppStateRow = {
  profile: unknown;
  series: unknown;
  sessions: unknown;
  template_library: unknown;
};

function getUserDisplayName(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown>;
  const fullName = metadata.full_name;
  const name = metadata.name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return user.email ?? "Atleta";
}

function buildDefaultSnapshotForUser(user: User): AppSnapshot {
  const snapshot = buildDefaultSnapshot();

  return {
    ...snapshot,
    profile: {
      ...snapshot.profile,
      name: getUserDisplayName(user),
    },
  };
}

function snapshotToRow(userId: string, snapshot: AppSnapshot) {
  const nextSnapshot = ensureAppSnapshot(snapshot);

  return {
    user_id: userId,
    profile: nextSnapshot.profile,
    series: nextSnapshot.series,
    sessions: nextSnapshot.sessions,
    template_library: nextSnapshot.templateLibrary,
  };
}

function rowToSnapshot(row: FitnessAppStateRow): AppSnapshot {
  return ensureAppSnapshot({
    profile: row.profile,
    series: row.series,
    sessions: row.sessions,
    templateLibrary: row.template_library,
  } as Partial<AppSnapshot>);
}

export async function readSupabaseAppState(user: User): Promise<AppSnapshot> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("fitness_app_state")
    .select("profile, series, sessions, template_library")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return rowToSnapshot(data as FitnessAppStateRow);
  }

  const snapshot = buildDefaultSnapshotForUser(user);
  return await writeSupabaseAppState(user.id, snapshot);
}

export async function writeSupabaseAppState(
  userId: string,
  snapshot: AppSnapshot,
): Promise<AppSnapshot> {
  const client = requireSupabase();
  const nextSnapshot = ensureAppSnapshot(snapshot);
  const { data, error } = await client
    .from("fitness_app_state")
    .upsert(snapshotToRow(userId, nextSnapshot), { onConflict: "user_id" })
    .select("profile, series, sessions, template_library")
    .single();

  if (error) {
    throw error;
  }

  return rowToSnapshot(data as FitnessAppStateRow);
}
