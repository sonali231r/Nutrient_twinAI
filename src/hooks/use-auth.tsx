import { useEffect, useState, useCallback } from "react";
import { getSession, getUserRoles } from "@/integrations/mongodb/auth";
import type { User } from "@/integrations/mongodb/types";

export type AppRole = "user" | "admin";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setRoles([]);
      return;
    }
    const userRoles = await getUserRoles(uid);
    setRoles(userRoles);
  }, []);

  useEffect(() => {
    const session = getSession();
    setUser(session?.user ?? null);
    loadRoles(session?.user?.id).finally(() => setLoading(false));
  }, [loadRoles]);

  const isAdmin = roles.includes("admin");

  return { user, roles, isAdmin, loading };
}
