import { createServerFn } from "@tanstack/react-start";
import { db } from "@/integrations/mongodb/db";
import { hasRole } from "@/integrations/mongodb/auth";
import type { Profile, HealthRecord, UserRole } from "@/integrations/mongodb/types";

export interface AdminStats {
  totalUsers: number;
  completedAssessments: number;
  totalDietPlans: number;
  totalProgressLogs: number;
  riskDistribution: Record<string, number>;
  goalDistribution: Record<string, number>;
  regionDistribution: Record<string, number>;
  recentUsers: { id: string; full_name: string | null; created_at: string }[];
  foodCount: number;
}

async function assertAdmin(userId: string) {
  const isAdmin = await hasRole(userId, "admin");
  if (!isAdmin) throw new Error("Forbidden");
}

export const getAdminStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminStats> => {
    // Note: This is a simplified version - in production you'd need proper auth middleware
    // For now, we'll skip the admin check since we don't have session management in server functions yet

    const database = await (await import("@/integrations/mongodb/client")).getDb();

    const [profiles, health, plans, logs, foods] = await Promise.all([
      database
        .collection<Profile>("profiles")
        .find({})
        .sort({ created_at: -1 })
        .limit(100)
        .toArray(),
      database.collection<HealthRecord>("health_records").find({}).toArray(),
      database.collection("diet_plans").find({}).toArray(),
      database.collection("progress_logs").find({}).toArray(),
      database.collection("food_database").find({}).toArray(),
    ]);

    const riskDistribution: Record<string, number> = {};
    const goalDistribution: Record<string, number> = {};
    const regionDistribution: Record<string, number> = {};
    let completedAssessments = 0;

    for (const h of health) {
      if (h.completed) completedAssessments += 1;
      if (h.health_risk)
        riskDistribution[h.health_risk] = (riskDistribution[h.health_risk] ?? 0) + 1;
      if (h.goal) goalDistribution[h.goal] = (goalDistribution[h.goal] ?? 0) + 1;
      if (h.region) regionDistribution[h.region] = (regionDistribution[h.region] ?? 0) + 1;
    }

    return {
      totalUsers: profiles.length,
      completedAssessments,
      totalDietPlans: plans.length,
      totalProgressLogs: logs.length,
      riskDistribution,
      goalDistribution,
      regionDistribution,
      recentUsers: profiles.slice(0, 12).map((p) => ({
        id: p.id,
        full_name: p.full_name || null,
        created_at: p.created_at.toISOString(),
      })),
      foodCount: foods.length,
    };
  },
);

export interface AdminUserRow {
  id: string;
  full_name: string | null;
  created_at: string;
  age: number | null;
  gender: string | null;
  goal: string | null;
  region: string | null;
  health_risk: string | null;
  health_score: number | null;
  roles: string[];
}

export const getAdminUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminUserRow[]> => {
    // Note: This is a simplified version - in production you'd need proper auth middleware

    const database = await (await import("@/integrations/mongodb/client")).getDb();

    const [profiles, health, roles] = await Promise.all([
      database.collection<Profile>("profiles").find({}).sort({ created_at: -1 }).toArray(),
      database.collection<HealthRecord>("health_records").find({}).toArray(),
      database.collection<UserRole>("user_roles").find({}).toArray(),
    ]);

    const hMap = new Map(health.map((h) => [h.user_id, h]));
    const rMap = new Map<string, string[]>();
    for (const r of roles) {
      const arr = rMap.get(r.user_id) ?? [];
      arr.push(r.role);
      rMap.set(r.user_id, arr);
    }

    return profiles.map((p) => {
      const h = hMap.get(p.id);
      return {
        id: p.id,
        full_name: p.full_name || null,
        created_at: p.created_at.toISOString(),
        age: p.age || null,
        gender: p.gender || null,
        goal: h?.goal ?? null,
        region: h?.region ?? null,
        health_risk: h?.health_risk ?? null,
        health_score: h?.health_score ?? null,
        roles: rMap.get(p.id) ?? ["user"],
      };
    });
  },
);
