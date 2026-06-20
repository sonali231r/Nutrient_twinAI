import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/integrations/mongodb/db";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  GENDERS,
  GOALS,
  ACTIVITY_LEVELS,
  FOOD_PREFERENCES,
  REGIONS,
  ALLERGIES,
  BUDGETS,
} from "@/lib/nutrition/constants";
import {
  computeNutrition,
  classifyRisk,
  habitScore,
  type Gender,
  type Goal,
  type ActivityLevel,
} from "@/lib/nutrition/engine";
import { fetchHealthRecord, fetchProfile } from "@/lib/user-data";
import { computePrediction, savePrediction } from "@/lib/predictions";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: () => ({ meta: [{ title: "Health Assessment — NutriTwin AI" }] }),
  component: Assessment,
});

interface FormState {
  full_name: string;
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  goal: string;
  activity_level: string;
  food_preference: string;
  region: string;
  blood_pressure_sys: string;
  blood_pressure_dia: string;
  blood_sugar: string;
  cholesterol: string;
  sleep_hours: string;
  water_intake: string;
  stress_level: number;
  allergies: string[];
  budget: number;
}

const EMPTY: FormState = {
  full_name: "",
  age: "",
  gender: "",
  height_cm: "",
  weight_kg: "",
  goal: "",
  activity_level: "",
  food_preference: "",
  region: "",
  blood_pressure_sys: "120",
  blood_pressure_dia: "80",
  blood_sugar: "90",
  cholesterol: "180",
  sleep_hours: "7",
  water_intake: "2.5",
  stress_level: 5,
  allergies: [],
  budget: 200,
};

const STEPS = ["Personal", "Goal", "Activity", "Food & Region", "Health", "Allergies", "Budget"];

function Assessment() {
  const { user } = useAuth();
  const uid = user?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!uid) return;
    Promise.all([fetchProfile(uid), fetchHealthRecord(uid)]).then(([p, h]) => {
      setForm((f) => ({
        ...f,
        full_name: p?.full_name ?? "",
        age: p?.age?.toString() ?? "",
        gender: p?.gender ?? "",
        height_cm: p?.height_cm?.toString() ?? "",
        weight_kg: p?.weight_kg?.toString() ?? "",
        goal: h?.goal ?? "",
        activity_level: h?.activity_level ?? "",
        food_preference: h?.food_preference ?? "",
        region: h?.region ?? "",
        blood_pressure_sys: h?.blood_pressure_sys?.toString() ?? f.blood_pressure_sys,
        blood_pressure_dia: h?.blood_pressure_dia?.toString() ?? f.blood_pressure_dia,
        blood_sugar: h?.blood_sugar?.toString() ?? f.blood_sugar,
        cholesterol: h?.cholesterol?.toString() ?? f.cholesterol,
        sleep_hours: h?.sleep_hours?.toString() ?? f.sleep_hours,
        water_intake: h?.water_intake?.toString() ?? f.water_intake,
        stress_level: h?.stress_level ?? f.stress_level,
        allergies: h?.allergies ?? [],
        budget: h?.budget ?? f.budget,
      }));
      if (h?.current_step && !h.completed) setStep(Math.min(h.current_step, STEPS.length - 1));
      setLoaded(true);
    });
  }, [uid]);

  const up = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  async function persist(nextStep: number) {
    if (!uid) return;
    await db.updateProfile(uid, {
      full_name: form.full_name || undefined,
      age: form.age ? Number(form.age) : undefined,
      gender: (form.gender || undefined) as Gender | undefined,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
    });

    const existing = await db.getHealthRecord(uid);
    if (existing) {
      await db.updateHealthRecord(uid, {
        goal: form.goal || undefined,
        activity_level: form.activity_level || undefined,
        food_preference: form.food_preference || undefined,
        region: form.region || undefined,
        blood_pressure_sys: numOrNull(form.blood_pressure_sys) || undefined,
        blood_pressure_dia: numOrNull(form.blood_pressure_dia) || undefined,
        blood_sugar: numOrNull(form.blood_sugar) || undefined,
        cholesterol: numOrNull(form.cholesterol) || undefined,
        sleep_hours: numOrNull(form.sleep_hours) || undefined,
        water_intake: numOrNull(form.water_intake) || undefined,
        stress_level: form.stress_level,
        allergies: form.allergies,
        budget: form.budget,
        current_step: nextStep,
      });
    } else {
      await db.createHealthRecord({
        user_id: uid,
        goal: form.goal || undefined,
        activity_level: form.activity_level || undefined,
        food_preference: form.food_preference || undefined,
        region: form.region || undefined,
        blood_pressure_sys: numOrNull(form.blood_pressure_sys) || undefined,
        blood_pressure_dia: numOrNull(form.blood_pressure_dia) || undefined,
        blood_sugar: numOrNull(form.blood_sugar) || undefined,
        cholesterol: numOrNull(form.cholesterol) || undefined,
        sleep_hours: numOrNull(form.sleep_hours) || undefined,
        water_intake: numOrNull(form.water_intake) || undefined,
        stress_level: form.stress_level,
        allergies: form.allergies,
        budget: form.budget,
        current_step: nextStep,
        completed: false,
      });
    }
  }

  function validateStep(): string | null {
    switch (step) {
      case 0:
        if (!form.full_name) return "Enter your full name.";
        if (!form.age || Number(form.age) < 18 || Number(form.age) > 65)
          return "Age must be 18–65.";
        if (!form.gender) return "Select your gender.";
        if (!form.height_cm || Number(form.height_cm) < 120) return "Enter a valid height.";
        if (!form.weight_kg || Number(form.weight_kg) < 30) return "Enter a valid weight.";
        return null;
      case 1:
        return form.goal ? null : "Choose a fitness goal.";
      case 2:
        return form.activity_level ? null : "Choose an activity level.";
      case 3:
        if (!form.food_preference) return "Choose a food preference.";
        if (!form.region) return "Choose a regional preference.";
        return null;
      default:
        return null;
    }
  }

  async function next() {
    const err = validateStep();
    if (err) return toast.error(err);
    setSaving(true);
    const ns = Math.min(step + 1, STEPS.length - 1);
    await persist(ns);
    setSaving(false);
    setStep(ns);
  }

  async function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    if (!uid) return;
    setFinishing(true);
    try {
      await persist(STEPS.length - 1);
      const nutrition = computeNutrition({
        age: Number(form.age),
        gender: form.gender as Gender,
        heightCm: Number(form.height_cm),
        weightKg: Number(form.weight_kg),
        activityLevel: form.activity_level as ActivityLevel,
        goal: form.goal as Goal,
      });
      const risk = classifyRisk({
        age: Number(form.age),
        bmi: nutrition.bmi,
        sleepHours: Number(form.sleep_hours),
        activityLevel: form.activity_level as ActivityLevel,
        stressLevel: form.stress_level,
        bloodPressureSys: Number(form.blood_pressure_sys),
        bloodSugar: Number(form.blood_sugar),
        cholesterol: Number(form.cholesterol),
      });
      const score = habitScore({
        sleepHours: Number(form.sleep_hours),
        waterL: Number(form.water_intake),
        hydrationTargetL: nutrition.hydrationL,
        exerciseMinutes:
          form.activity_level === "sedentary" ? 10 : form.activity_level === "light" ? 25 : 45,
        activityLevel: form.activity_level as ActivityLevel,
        bmi: nutrition.bmi,
        consistencyPct: 60,
      });

      await db.updateHealthRecord(uid, {
        bmi: nutrition.bmi,
        bmr: nutrition.bmr,
        tdee: nutrition.tdee,
        daily_calories: nutrition.dailyCalories,
        protein_g: nutrition.proteinG,
        carbs_g: nutrition.carbsG,
        fat_g: nutrition.fatG,
        fiber_g: nutrition.fiberG,
        hydration_l: nutrition.hydrationL,
        health_risk: risk.level,
        health_score: score,
        completed: true,
        current_step: STEPS.length - 1,
      });

      // baseline progress log
      await db.createProgressLog({
        user_id: uid,
        log_date: new Date(),
        weight_kg: Number(form.weight_kg),
        water_l: Number(form.water_intake),
        sleep_hours: Number(form.sleep_hours),
      });

      // prediction
      const [p, h] = await Promise.all([fetchProfile(uid), fetchHealthRecord(uid)]);
      if (p && h) {
        const pr = computePrediction(p, h);
        if (pr) await savePrediction(uid, pr);
      }

      await queryClient.invalidateQueries();
      toast.success("Assessment complete! Your plan is ready.");
      navigate({ to: "/dashboard" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong saving your assessment.");
    } finally {
      setFinishing(false);
    }
  }

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  if (!loaded) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Health Assessment"
        description="Your answers power every recommendation. Progress saves automatically."
      />

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2">
                <Input value={form.full_name} onChange={(e) => up({ full_name: e.target.value })} />
              </Field>
              <Field label="Age">
                <Input
                  type="number"
                  min={18}
                  max={65}
                  value={form.age}
                  onChange={(e) => up({ age: e.target.value })}
                />
              </Field>
              <Field label="Gender">
                <OptionRow
                  options={GENDERS}
                  value={form.gender}
                  onChange={(v) => up({ gender: v as string })}
                />
              </Field>
              <Field label="Height (cm)">
                <Input
                  type="number"
                  value={form.height_cm}
                  onChange={(e) => up({ height_cm: e.target.value })}
                />
              </Field>
              <Field label="Weight (kg)">
                <Input
                  type="number"
                  value={form.weight_kg}
                  onChange={(e) => up({ weight_kg: e.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <SelectGrid options={GOALS} value={form.goal} onChange={(v) => up({ goal: v })} />
          )}

          {step === 2 && (
            <SelectGrid
              options={ACTIVITY_LEVELS}
              value={form.activity_level}
              onChange={(v) => up({ activity_level: v })}
            />
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Food preference</Label>
                <SelectGrid
                  options={FOOD_PREFERENCES}
                  value={form.food_preference}
                  onChange={(v) => up({ food_preference: v })}
                />
              </div>
              <div>
                <Label className="mb-3 block">Regional preference</Label>
                <SelectGrid
                  options={REGIONS}
                  value={form.region}
                  onChange={(v) => up({ region: v })}
                  cols={4}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Blood pressure — systolic">
                <Input
                  type="number"
                  value={form.blood_pressure_sys}
                  onChange={(e) => up({ blood_pressure_sys: e.target.value })}
                />
              </Field>
              <Field label="Blood pressure — diastolic">
                <Input
                  type="number"
                  value={form.blood_pressure_dia}
                  onChange={(e) => up({ blood_pressure_dia: e.target.value })}
                />
              </Field>
              <Field label="Blood sugar (mg/dL)">
                <Input
                  type="number"
                  value={form.blood_sugar}
                  onChange={(e) => up({ blood_sugar: e.target.value })}
                />
              </Field>
              <Field label="Cholesterol (mg/dL)">
                <Input
                  type="number"
                  value={form.cholesterol}
                  onChange={(e) => up({ cholesterol: e.target.value })}
                />
              </Field>
              <Field label="Sleep (hours/night)">
                <Input
                  type="number"
                  step="0.5"
                  value={form.sleep_hours}
                  onChange={(e) => up({ sleep_hours: e.target.value })}
                />
              </Field>
              <Field label="Water intake (L/day)">
                <Input
                  type="number"
                  step="0.1"
                  value={form.water_intake}
                  onChange={(e) => up({ water_intake: e.target.value })}
                />
              </Field>
              <Field label={`Stress level: ${form.stress_level}/10`} className="sm:col-span-2">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[form.stress_level]}
                  onValueChange={(v) => up({ stress_level: v[0] })}
                />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div>
              <Label className="mb-3 block">Select any allergies (or none)</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ALLERGIES.map((a) => {
                  const active = form.allergies.includes(a.value);
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() =>
                        up({
                          allergies: active
                            ? form.allergies.filter((x) => x !== a.value)
                            : [...form.allergies, a.value],
                        })
                      }
                      className={cn(
                        "rounded-xl border p-4 text-left text-sm font-medium transition",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {a.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => up({ allergies: [] })}
                  className={cn(
                    "rounded-xl border p-4 text-left text-sm font-medium transition",
                    form.allergies.length === 0
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  None
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <Label className="mb-3 block">Daily food budget</Label>
              <SelectGrid
                options={BUDGETS.map((b) => ({ value: b.value, label: b.label, hint: b.hint }))}
                value={form.budget}
                onChange={(v) => up({ budget: Number(v) })}
                cols={4}
              />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0 || saving || finishing}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={finishing}>
                {finishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Finish & generate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function numOrNull(v: string) {
  return v === "" ? null : Number(v);
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function OptionRow({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg border px-4 py-2 text-sm font-medium transition",
            value === o.value
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/40",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SelectGrid({
  options,
  value,
  onChange,
  cols = 3,
}: {
  options: ReadonlyArray<{ value: string | number; label: string; hint?: string }>;
  value: string | number;
  onChange: (v: string) => void;
  cols?: number;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(String(o.value))}
            className={cn(
              "rounded-xl border p-4 text-left transition",
              active
                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                : "border-border hover:border-primary/40",
            )}
          >
            <p className="text-sm font-semibold">{o.label}</p>
            {o.hint && <p className="mt-0.5 text-xs text-muted-foreground">{o.hint}</p>}
          </button>
        );
      })}
    </div>
  );
}
