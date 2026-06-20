import { db } from "@/integrations/mongodb/db";
import type { Profile, HealthRecord, ProgressLog, Prediction } from "@/integrations/mongodb/types";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  height_cm: number | null;
  weight_kg: number | null;
}

export interface HealthRecordRow {
  id: string;
  user_id: string;
  goal: string | null;
  activity_level: string | null;
  food_preference: string | null;
  region: string | null;
  blood_pressure_sys: number | null;
  blood_pressure_dia: number | null;
  blood_sugar: number | null;
  cholesterol: number | null;
  sleep_hours: number | null;
  water_intake: number | null;
  stress_level: number | null;
  allergies: string[] | null;
  budget: number | null;
  bmi: number | null;
  bmr: number | null;
  tdee: number | null;
  daily_calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  hydration_l: number | null;
  health_risk: string | null;
  health_score: number | null;
  current_step: number;
  completed: boolean;
}

export interface ProgressRow {
  id: string;
  log_date: string;
  weight_kg: number | null;
  calories: number | null;
  water_l: number | null;
  sleep_hours: number | null;
  exercise_minutes: number | null;
}

export interface PredictionRow {
  id: string;
  current_weight: number | null;
  weight_30d: number | null;
  weight_60d: number | null;
  weight_90d: number | null;
  weight_180d: number | null;
  risk_now: string | null;
  risk_180d: string | null;
  narrative: string | null;
  created_at: string;
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const profile = await db.getProfile(userId);
  if (!profile) return null;
  return {
    id: profile.id,
    full_name: profile.full_name || null,
    age: profile.age || null,
    gender: profile.gender || null,
    height_cm: profile.height_cm || null,
    weight_kg: profile.weight_kg || null,
  };
}

export async function fetchHealthRecord(userId: string): Promise<HealthRecordRow | null> {
  const health = await db.getHealthRecord(userId);
  if (!health) return null;
  return {
    id: health.id,
    user_id: health.user_id,
    goal: health.goal || null,
    activity_level: health.activity_level || null,
    food_preference: health.food_preference || null,
    region: health.region || null,
    blood_pressure_sys: health.blood_pressure_sys || null,
    blood_pressure_dia: health.blood_pressure_dia || null,
    blood_sugar: health.blood_sugar || null,
    cholesterol: health.cholesterol || null,
    sleep_hours: health.sleep_hours || null,
    water_intake: health.water_intake || null,
    stress_level: health.stress_level || null,
    allergies: health.allergies || null,
    budget: health.budget || null,
    bmi: health.bmi || null,
    bmr: health.bmr || null,
    tdee: health.tdee || null,
    daily_calories: health.daily_calories || null,
    protein_g: health.protein_g || null,
    carbs_g: health.carbs_g || null,
    fat_g: health.fat_g || null,
    fiber_g: health.fiber_g || null,
    hydration_l: health.hydration_l || null,
    health_risk: health.health_risk || null,
    health_score: health.health_score || null,
    current_step: health.current_step,
    completed: health.completed,
  };
}

export async function fetchProgressLogs(userId: string): Promise<ProgressRow[]> {
  const logs = await db.getProgressLogs(userId);
  return logs.map((log) => ({
    id: log.id,
    log_date: log.log_date.toISOString(),
    weight_kg: log.weight_kg || null,
    calories: log.calories || null,
    water_l: log.water_l || null,
    sleep_hours: log.sleep_hours || null,
    exercise_minutes: log.exercise_minutes || null,
  }));
}

export async function fetchDietPlans(userId: string) {
  const plans = await db.getDietPlans(userId);
  return plans.slice(0, 10);
}

export async function fetchLatestPrediction(userId: string): Promise<PredictionRow | null> {
  const prediction = await db.getPrediction(userId);
  if (!prediction) return null;
  return {
    id: prediction.id,
    current_weight: prediction.current_weight || null,
    weight_30d: prediction.weight_30d || null,
    weight_60d: prediction.weight_60d || null,
    weight_90d: prediction.weight_90d || null,
    weight_180d: prediction.weight_180d || null,
    risk_now: prediction.risk_now || null,
    risk_180d: prediction.risk_180d || null,
    narrative: prediction.narrative || null,
    created_at: prediction.created_at.toISOString(),
  };
}
