import { useSession } from "next-auth/react";

export type AuthStatus = "guest" | "authenticated" | "loading";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
}

export function useAuth(): { status: AuthStatus; user: AuthUser | null } {
  const { data, status } = useSession();

  if (status === "loading") {
    return { status: "loading", user: null };
  }

  if (status !== "authenticated" || !data?.user) {
    return { status: "guest", user: null };
  }

  const user = data.user as AuthUser & { id?: string };

  if (!user.id) {
    return { status: "guest", user: null };
  }

  return {
    status: "authenticated",
    user: {
      id: user.id,
      name: user.name ?? "",
      email: user.email,
    },
  };
}
