import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

// Initialize Better Auth with SQLite (better-sqlite3)
// Ensure BETTER_AUTH_SECRET and BETTER_AUTH_URL are set in your environment
export const auth = betterAuth({
  database: new Database("./sqlite.db"),
  emailAndPassword: {
    enabled: true,
  },
});