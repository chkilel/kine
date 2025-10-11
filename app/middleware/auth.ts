import { authClient } from "~/app/lib/auth-client";

export default defineNuxtRouteMiddleware(async (to) => {
  // Use SSR-aware session fetching
  const { data: session } = await authClient.useSession(useFetch);
  if (!session.value) {
    // Example: protect settings and inbox
    const protectedPaths = ["/settings", "/inbox"];
    if (protectedPaths.some((p) => to.path.startsWith(p))) {
      return navigateTo("/login");
    }
  }
});