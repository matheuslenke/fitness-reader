import { defineSchema, defineTable } from "convex/server";
import { appStateFields, sessionFields, userFields } from "./validators";

export default defineSchema({
  users: defineTable(userFields).index(
    "by_username_normalized",
    ["usernameNormalized"],
  ),
  sessions: defineTable(sessionFields).index("by_user_id", ["userId"]),
  appState: defineTable(appStateFields).index("by_key", ["key"]),
});
