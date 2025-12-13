// src/lib/auth.ts
export type AuthStatus = "guest" | "authenticated";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
}

export function useAuth(): { status: AuthStatus; user: AuthUser | null } {
  // Phase 1: always guest; we’ll replace with real auth later
  return { status: "guest", user: null };
}