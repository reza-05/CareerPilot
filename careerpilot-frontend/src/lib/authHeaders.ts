import type { User } from "firebase/auth";

export async function buildAuthHeaders(user: User | null | undefined, extra?: HeadersInit) {
  const headers = new Headers(extra);

  if (user?.uid) {
    headers.set("x-user-id", user.uid);
  }

  try {
    const token = await user?.getIdToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    // Keep the request usable in local development; production backend can still require Firebase auth.
  }

  return headers;
}
