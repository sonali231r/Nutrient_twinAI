import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DietInput = z.object({
  goal: z.string(),
  foodPreference: z.string(),
  region: z.string(),
  budget: z.number(),
  dailyCalories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  hydrationL: z.number(),
  allergies: z.array(z.string()).default([]),
  healthNotes: z.string().optional().default(""),
});

const MealSchema = z.object({
  slot: z.string(),
  name: z.string(),
  time: z.string(),
  items: z.array(z.string()),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  estCost: z.number(),
});

const PlanSchema = z.object({
  meals: z.array(MealSchema),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  hydrationL: z.number(),
  estimatedDailyCost: z.number(),
  dailyTips: z.array(z.string()),
  shoppingList: z.array(z.object({ item: z.string(), qty: z.string(), estCost: z.number() })),
});

export type DietPlan = z.infer<typeof PlanSchema>;

export const generateDietPlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DietInput.parse(data))
  .handler(async ({ data }): Promise<{ plan: DietPlan | null; error?: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { plan: null, error: "AI is not configured." };

    // Pull candidate regional foods to ground the model.
    let foodContext = "";
    try {
      const { db } = await import("@/integrations/mongodb/db");
      const foods = await db.searchFood(data.region);
      if (foods.length) {
        foodContext = foods
          .slice(0, 60)
          .map(
            (f) =>
              `${f.name} [${f.category}, ${f.food_type}, ~${f.calories}kcal, ${f.protein_g}g protein, ₹${f.cost_inr}]`,
          )
          .join("\n");
      }
    } catch {
      // proceed without grounding
    }

    try {
      const { generateObject } = await import("ai");
      const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
      const gateway = createLovableAiGatewayProvider(key);
      const model = gateway("google/gemini-3-flash-preview");

      const prompt = `You are an expert Indian dietitian. Build ONE realistic full-day meal plan.

User:
- Goal: ${data.goal}
- Food preference: ${data.foodPreference} (strictly respect this)
- Region: ${data.region} (favor authentic regional dishes, avoid western-only meals)
- Budget: keep total day cost at or under ₹${data.budget}
- Daily targets: ~${data.dailyCalories} kcal, ${data.proteinG}g protein, ${data.carbsG}g carbs, ${data.fatG}g fat, ${data.hydrationL}L water
- Allergies to strictly avoid: ${data.allergies.length ? data.allergies.join(", ") : "none"}
- Health notes: ${data.healthNotes || "none"}

Reference regional foods (prefer these, costs in ₹):
${foodContext || "(use authentic Indian regional dishes)"}

Return exactly 4 meals with slots: "Breakfast", "Lunch", "Evening Snack", "Dinner".
Each meal must list 1-4 food items, realistic macros and an estimated cost in rupees.
Totals should be close to the daily targets and total cost <= ₹${data.budget}.
Provide 3-5 short actionable daily tips and a concise weekly shopping list with estimated costs.`;

      const { object } = await generateObject({
        model,
        schema: PlanSchema,
        prompt,
      });
      return { plan: object };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429"))
        return { plan: null, error: "Rate limit reached. Please try again shortly." };
      if (msg.includes("402"))
        return { plan: null, error: "AI credits exhausted. Add credits in workspace settings." };
      console.error("[generateDietPlan]", msg);
      return { plan: null, error: "Could not generate a plan right now. Please try again." };
    }
  });
