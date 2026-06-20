import { createServerFn } from "@tanstack/react-start";
import type { User, Profile, AppRole } from "./types";

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  profile?: Profile;
  roles?: AppRole[];
}

export interface Session {
  user: User;
  profile?: Profile;
  roles: AppRole[];
}

// Client-side in-memory session
let currentSession: Session | null = null;

const signUpServerFn = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string; fullName?: string }) => input)
  .handler(async ({ data: { email, password, fullName } }): Promise<AuthResult> => {
    const { signUp } = await import("./auth.server");
    return signUp(email, password, fullName);
  });

const signInServerFn = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => input)
  .handler(async ({ data: { email, password } }): Promise<AuthResult> => {
    const { signIn } = await import("./auth.server");
    return signIn(email, password);
  });

const getUserRolesServerFn = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }): Promise<AppRole[]> => {
    const { getUserRoles } = await import("./auth.server");
    return getUserRoles(userId);
  });

export async function signUp(
  email: string,
  password: string,
  fullName?: string,
): Promise<AuthResult> {
  const result = await signUpServerFn({ data: { email, password, fullName } });
  if (result.success && result.user) {
    currentSession = {
      user: result.user,
      profile: result.profile,
      roles: result.roles || ["user"],
    };
  }
  return result;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const result = await signInServerFn({ data: { email, password } });
  if (result.success && result.user) {
    currentSession = {
      user: result.user,
      profile: result.profile,
      roles: result.roles || ["user"],
    };
  }
  return result;
}

export async function signOut(): Promise<void> {
  currentSession = null;
}

export function getSession(): Session | null {
  return currentSession;
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  return getUserRolesServerFn({ data: userId });
}

export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}
