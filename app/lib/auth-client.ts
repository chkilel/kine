import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
  // If your auth server runs on the same domain and uses /api/auth, no baseURL is needed.
  // Otherwise, specify: baseURL: "http://localhost:3000/api/auth"
});