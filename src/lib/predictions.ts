import { db } from "@/integrations/mongodb/db";
import {
  projectWeight,
  classifyRisk,
  type ActivityLevel,
  type RiskLevel,
} from "@/lib/nutrition/engine";
import type { HealthRecordRow, ProfileRow } from "@/lib/user-data";

export interface PredictionResult {
  current_weight: number;
  weight_30d: number;
  weight_60d: number;
  weight_90d: number;
  weight_180d: number;
  risk_now: RiskLevel;
  risk_180d: RiskLevel;
  narrative: string;
}

function bmiFor(weight: number, heightCm: number) {
  const m = heightCm / 100;
  return m > 0 ? weight / (m * m) : 0;
}

export function computePrediction(
  profile: ProfileRow,
  health: HealthRecordRow,
): PredictionResult | null {
  if (!profile.weight_kg || !profile.height_cm || !health.tdee || !health.daily_calories) {
    return null;
  }
  const current = Number(profile.weight_kg);
  const delta = Number(health.daily_calories) - Number(health.tdee);
  const proj = projectWeight(current, delta);

  const riskInput = {
    age: profile.age ?? 30,
    bmi: Number(health.bmi ?? bmiFor(current, Number(profile.height_cm))),
    sleepHours: Number(health.sleep_hours ?? 7),
    activityLevel: (health.activity_level as ActivityLevel) ?? "moderate",
    stressLevel: Number(health.stress_level ?? 5),
    bloodPressureSys: Number(health.blood_pressure_sys ?? 120),
    bloodSugar: Number(health.blood_sugar ?? 90),
    cholesterol: Number(health.cholesterol ?? 180),
  };
  const riskNow = classifyRisk(riskInput);
  const futureBmi = bmiFor(proj.d180, Number(profile.height_cm));
  const riskFuture = classifyRisk({ ...riskInput, bmi: futureBmi });

  const weightChange = proj.d180 - current;
  const dir = weightChange < -0.5 ? "lose" : weightChange > 0.5 ? "gain" : "maintain";
  const obesityShift = Math.round((futureBmi - riskInput.bmi) * 4);
  const narrative =
    dir === "maintain"
      ? `If your current habits continue, your weight stays around ${current.toFixed(1)} kg over the next 6 months. Maintain consistency to keep your risk profile stable.`
      : `If your current habits continue, you are projected to ${dir} about ${Math.abs(weightChange).toFixed(1)} kg in 6 months. ${
          obesityShift > 0
            ? `Your obesity-risk indicators may rise by roughly ${obesityShift}%.`
            : obesityShift < 0
              ? `Your obesity-risk indicators may improve by roughly ${Math.abs(obesityShift)}%.`
              : "Your risk profile should stay broadly stable."
        }`;

  return {
    current_weight: Math.round(current * 10) / 10,
    weight_30d: proj.d30,
    weight_60d: proj.d60,
    weight_90d: proj.d90,
    weight_180d: proj.d180,
    risk_now: riskNow.level,
    risk_180d: riskFuture.level,
    narrative,
  };
}

export async function savePrediction(userId: string, result: PredictionResult) {
  await db.createPrediction({
    user_id: userId,
    current_weight: result.current_weight,
    weight_30d: result.weight_30d,
    weight_60d: result.weight_60d,
    weight_90d: result.weight_90d,
    weight_180d: result.weight_180d,
    risk_now: result.risk_now,
    risk_180d: result.risk_180d,
    narrative: result.narrative,
  });
}
