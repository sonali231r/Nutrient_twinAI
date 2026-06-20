export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "user" | "admin";
export type GenderType = "male" | "female" | "other";

export interface Profile {
  _id: string;
  id: string; // UUID for compatibility
  full_name?: string;
  age?: number;
  gender?: GenderType;
  height_cm?: number;
  weight_kg?: number;
  created_at: Date;
  updated_at: Date;
}

export interface HealthRecord {
  _id: string;
  id: string; // UUID for compatibility
  user_id: string;
  goal?: string;
  activity_level?: string;
  food_preference?: string;
  region?: string;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  blood_sugar?: number;
  cholesterol?: number;
  sleep_hours?: number;
  water_intake?: number;
  stress_level?: number;
  allergies?: string[];
  budget?: number;
  bmi?: number;
  bmr?: number;
  tdee?: number;
  daily_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  hydration_l?: number;
  health_risk?: string;
  health_score?: number;
  current_step: number;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DietPlan {
  _id: string;
  id: string; // UUID for compatibility
  user_id: string;
  plan: Json;
  total_calories?: number;
  budget?: number;
  region?: string;
  food_preference?: string;
  created_at: Date;
}

export interface FoodDatabase {
  _id: string;
  id: string; // UUID for compatibility
  name: string;
  region?: string;
  category?: string;
  food_type?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  cost_inr?: number;
  tags?: string[];
  created_at: Date;
}

export interface Notification {
  _id: string;
  id: string; // UUID for compatibility
  user_id: string;
  title: string;
  message?: string;
  read: boolean;
  created_at: Date;
}

export interface Prediction {
  _id: string;
  id: string; // UUID for compatibility
  user_id: string;
  current_weight?: number;
  weight_30d?: number;
  weight_60d?: number;
  weight_90d?: number;
  weight_180d?: number;
  risk_now?: string;
  risk_180d?: string;
  narrative?: string;
  created_at: Date;
}

export interface ProgressLog {
  _id: string;
  id: string; // UUID for compatibility
  user_id: string;
  log_date: Date;
  weight_kg?: number;
  calories?: number;
  water_l?: number;
  sleep_hours?: number;
  exercise_minutes?: number;
  created_at: Date;
}

export interface SystemLog {
  _id: string;
  id: string; // UUID for compatibility
  user_id?: string;
  action: string;
  detail?: string;
  created_at: Date;
}

export interface UserRole {
  _id: string;
  id: string; // UUID for compatibility
  user_id: string;
  role: AppRole;
  created_at: Date;
}

export interface User {
  _id: string;
  id: string; // UUID for compatibility
  email: string;
  password_hash: string;
  full_name?: string;
  created_at: Date;
  updated_at: Date;
}
