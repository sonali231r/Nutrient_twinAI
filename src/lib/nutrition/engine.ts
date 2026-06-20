// NutriTwin AI — deterministic nutrition & health engine.
// Pure functions: BMI, BMR (Mifflin-St Jeor), TDEE, macro targets,
// hydration, health-risk classification, habit score, weight projection.

export type Gender = "male" | "female" | "other";
export type Goal =
  | "weight_loss"
  | "weight_gain"
  | "muscle_gain"
  | "fat_loss"
  | "recomposition"
  | "maintenance";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "athlete";

export interface MetricsInput {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface NutritionResult {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  hydrationL: number;
}

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

// Calorie adjustment relative to TDEE per goal.
const GOAL_CALORIE_DELTA: Record<Goal, number> = {
  weight_loss: -0.2,
  fat_loss: -0.18,
  weight_gain: 0.15,
  muscle_gain: 0.12,
  recomposition: -0.05,
  maintenance: 0,
};

// Grams of protein per kg of bodyweight per goal.
const GOAL_PROTEIN_PER_KG: Record<Goal, number> = {
  weight_loss: 1.8,
  fat_loss: 2.0,
  weight_gain: 1.6,
  muscle_gain: 2.0,
  recomposition: 2.0,
  maintenance: 1.4,
};

export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function calcBmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  if (m <= 0) return 0;
  return round(weightKg / (m * m), 1);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function calcBmr(input: MetricsInput): number {
  const { weightKg, heightCm, age, gender } = input;
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const adj = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  return round(base + adj);
}

export function computeNutrition(input: MetricsInput): NutritionResult {
  const bmi = calcBmi(input.weightKg, input.heightCm);
  const bmr = calcBmr(input);
  const tdee = round(bmr * ACTIVITY_MULTIPLIER[input.activityLevel]);
  const dailyCalories = Math.max(1200, round(tdee * (1 + GOAL_CALORIE_DELTA[input.goal])));

  const proteinG = round(GOAL_PROTEIN_PER_KG[input.goal] * input.weightKg);
  const fatG = round((dailyCalories * 0.27) / 9);
  const proteinCals = proteinG * 4;
  const fatCals = fatG * 9;
  const carbsG = Math.max(0, round((dailyCalories - proteinCals - fatCals) / 4));
  const fiberG = round((dailyCalories / 1000) * 14);
  const hydrationL = round(Math.max(2, input.weightKg * 0.033), 1);

  return {
    bmi,
    bmiCategory: bmiCategory(bmi),
    bmr,
    tdee,
    dailyCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    hydrationL,
  };
}

export interface RiskInput {
  age: number;
  bmi: number;
  sleepHours: number;
  activityLevel: ActivityLevel;
  stressLevel: number; // 1-10
  bloodPressureSys: number;
  bloodSugar: number;
  cholesterol: number;
}

export type RiskLevel = "Healthy" | "Mild Risk" | "Moderate Risk" | "High Risk";

// Weighted risk scoring mimicking a gradient-boosted classifier's output bands.
export function classifyRisk(input: RiskInput): { level: RiskLevel; score: number } {
  let score = 0;
  // BMI
  if (input.bmi >= 30) score += 3;
  else if (input.bmi >= 25) score += 1.5;
  else if (input.bmi < 18.5) score += 1;
  // Blood pressure
  if (input.bloodPressureSys >= 140) score += 3;
  else if (input.bloodPressureSys >= 130) score += 1.5;
  // Blood sugar
  if (input.bloodSugar >= 180) score += 3;
  else if (input.bloodSugar >= 126) score += 2;
  else if (input.bloodSugar >= 100) score += 0.8;
  // Cholesterol
  if (input.cholesterol >= 240) score += 2.5;
  else if (input.cholesterol >= 200) score += 1.2;
  // Sleep
  if (input.sleepHours < 5 || input.sleepHours > 9) score += 1.5;
  else if (input.sleepHours < 6) score += 0.7;
  // Stress
  if (input.stressLevel >= 8) score += 2;
  else if (input.stressLevel >= 6) score += 1;
  // Activity
  if (input.activityLevel === "sedentary") score += 1.5;
  else if (input.activityLevel === "light") score += 0.5;
  // Age
  if (input.age >= 55) score += 1.2;
  else if (input.age >= 45) score += 0.6;

  let level: RiskLevel;
  if (score >= 8) level = "High Risk";
  else if (score >= 5) level = "Moderate Risk";
  else if (score >= 2.5) level = "Mild Risk";
  else level = "Healthy";

  return { level, score: round(score, 1) };
}

export interface HabitInput {
  sleepHours: number;
  waterL: number;
  hydrationTargetL: number;
  exerciseMinutes: number; // weekly avg/day or daily
  activityLevel: ActivityLevel;
  bmi: number;
  consistencyPct: number; // 0-100 logging consistency
}

// AI Habit Score out of 100.
export function habitScore(input: HabitInput): number {
  let s = 0;
  // Sleep (25)
  s += Math.max(0, 25 - Math.abs(7.5 - input.sleepHours) * 6);
  // Water (20)
  s += Math.min(20, (input.waterL / Math.max(1, input.hydrationTargetL)) * 20);
  // Exercise (20)
  s += Math.min(20, (input.exerciseMinutes / 45) * 20);
  // Diet quality proxy via BMI band (15)
  s += input.bmi >= 18.5 && input.bmi < 25 ? 15 : input.bmi < 30 ? 9 : 4;
  // Consistency (20)
  s += (input.consistencyPct / 100) * 20;
  return Math.max(0, Math.min(100, Math.round(s)));
}

export interface WeightProjection {
  d30: number;
  d60: number;
  d90: number;
  d180: number;
}

// Projects weight using daily calorie balance (7700 kcal ~ 1kg).
// dailyDelta = dailyCalories - tdee (negative => loss).
export function projectWeight(currentWeight: number, dailyCalorieDelta: number): WeightProjection {
  const kgPerDay = dailyCalorieDelta / 7700;
  // Adherence/metabolic-adaptation dampening over time.
  const at = (days: number) => {
    const damp = 1 - Math.min(0.35, days / 1200);
    return round(Math.max(35, currentWeight + kgPerDay * days * damp), 1);
  };
  return { d30: at(30), d60: at(60), d90: at(90), d180: at(180) };
}
