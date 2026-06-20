import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Utensils,
  Sparkles,
  Loader2,
  Coffee,
  Sun,
  Cookie,
  Moon,
  ShoppingCart,
  Lightbulb,
  Droplets,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/integrations/mongodb/db";
import type { DietPlan as MongoDietPlan, Json } from "@/integrations/mongodb/types";
import { fetchHealthRecord } from "@/lib/user-data";
import { generateDietPlan, type DietPlan } from "@/lib/diet.functions";
import { labelFor, REGIONS, FOOD_PREFERENCES, BUDGETS } from "@/lib/nutrition/constants";

export const Route = createFileRoute("/_authenticated/diet")({
  head: () => ({ meta: [{ title: "AI Diet Generator — NutriTwin AI" }] }),
  component: DietGenerator,
});

const SLOT_ICON: Record<string, typeof Coffee> = {
  Breakfast: Coffee,
  Lunch: Sun,
  "Evening Snack": Cookie,
  Dinner: Moon,
};

function DietGenerator() {
  const { user } = useAuth();
  const uid = user?.id;
  const queryClient = useQueryClient();
  const generate = useServerFn(generateDietPlan);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const healthQ = useQuery({
    queryKey: ["health", uid],
    queryFn: () => fetchHealthRecord(uid!),
    enabled: !!uid,
  });
  const plansQ = useQuery({
    queryKey: ["diet-plans", uid],
    queryFn: async () => {
      const plans = await db.getDietPlans(uid!);
      return plans.slice(0, 5);
    },
    enabled: !!uid,
  });
  const health = healthQ.data;

  async function onGenerate() {
    if (!uid) return;
    if (!health?.completed) {
      toast.error("Complete your health assessment first.");
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const res = await generate({
        data: {
          goal: health.goal ?? "maintenance",
          foodPreference: health.food_preference ?? "vegetarian",
          region: health.region ?? "south_indian",
          budget: health.budget ?? 200,
          dailyCalories: Number(health.daily_calories ?? 2000),
          proteinG: Number(health.protein_g ?? 100),
          carbsG: Number(health.carbs_g ?? 250),
          fatG: Number(health.fat_g ?? 60),
          hydrationL: Number(health.hydration_l ?? 2.5),
          allergies: health.allergies ?? [],
          healthNotes: `Risk level: ${health.health_risk ?? "unknown"}, blood sugar ${health.blood_sugar ?? "?"}, BP ${health.blood_pressure_sys ?? "?"}.`,
        },
      });
      if (res.error || !res.plan) {
        toast.error(res.error ?? "Could not generate plan.");
        return;
      }
      setPlan(res.plan);
      await db.createDietPlan({
        user_id: uid,
        plan: res.plan as unknown as Json,
        total_calories: res.plan.totalCalories,
        budget: health.budget || undefined,
        region: health.region || undefined,
        food_preference: health.food_preference || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["diet-plans", uid] });
      toast.success("Your personalized plan is ready!");
    } finally {
      setLoading(false);
    }
  }

  if (healthQ.isLoading) {
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
        title="AI Diet Generator"
        description="Personalized regional Indian meal plans tuned to your goals, budget and health."
      >
        <Button onClick={onGenerate} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate plan
        </Button>
      </PageHeader>

      {!health?.completed && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-muted-foreground">
              Complete your health assessment to unlock diet generation.
            </p>
            <Button asChild>
              <Link to="/assessment">Go to assessment</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {health?.completed && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="secondary">{labelFor(FOOD_PREFERENCES, health.food_preference)}</Badge>
          <Badge variant="secondary">{labelFor(REGIONS, health.region)}</Badge>
          <Badge variant="secondary">{labelFor(BUDGETS, health.budget ?? 0)}</Badge>
          <Badge variant="secondary">{health.daily_calories} kcal target</Badge>
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Composing your regional meal plan…</p>
          </CardContent>
        </Card>
      )}

      {plan && <PlanView plan={plan} />}

      {!plan && !loading && health?.completed && (
        <Card className="bg-hero-mesh">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Utensils className="h-8 w-8 text-primary" />
            <h3 className="font-display text-lg font-semibold">Ready when you are</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Hit “Generate plan” to get a full day of breakfast, lunch, snacks and dinner with
              macros, hydration, daily tips and a shopping list.
            </p>
          </CardContent>
        </Card>
      )}

      {(plansQ.data?.length ?? 0) > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold">Recent plans</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plansQ.data!.map((p: MongoDietPlan) => (
              <button
                key={p.id}
                onClick={() => setPlan(p.plan as DietPlan)}
                className="rounded-xl border border-border p-4 text-left transition hover:border-primary/40"
              >
                <p className="text-sm font-semibold">
                  {Math.round(Number(p.total_calories ?? 0))} kcal day
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()} · {labelFor(REGIONS, p.region)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function PlanView({ plan }: { plan: DietPlan }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Calories" value={`${Math.round(plan.totalCalories)} kcal`} icon={Sun} />
        <Metric label="Protein" value={`${Math.round(plan.totalProtein)} g`} icon={Utensils} />
        <Metric label="Hydration" value={`${plan.hydrationL} L`} icon={Droplets} />
        <Metric
          label="Day cost"
          value={`₹${Math.round(plan.estimatedDailyCost)}`}
          icon={IndianRupee}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plan.meals.map((meal, i) => {
          const Icon = SLOT_ICON[meal.slot] ?? Utensils;
          return (
            <Card key={i}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{meal.slot}</CardTitle>
                    <CardDescription>{meal.time}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{Math.round(meal.calories)} kcal</Badge>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{meal.name}</p>
                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                  {meal.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>P {Math.round(meal.protein)}g</span>
                  <span>· C {Math.round(meal.carbs)}g</span>
                  <span>· F {Math.round(meal.fat)}g</span>
                  <span>· ₹{Math.round(meal.estCost)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-warning-foreground" /> Daily tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {plan.dailyTips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" /> Shopping list
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {plan.shoppingList.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between border-b border-border/60 pb-1.5 last:border-0"
                >
                  <span>
                    {s.item} <span className="text-muted-foreground">· {s.qty}</span>
                  </span>
                  <span className="text-muted-foreground">₹{Math.round(s.estCost)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Sun }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-display text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
