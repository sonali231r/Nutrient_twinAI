// Shared option lists & labels for the NutriTwin assessment and UI.

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const GOALS = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "weight_gain", label: "Weight Gain" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "fat_loss", label: "Fat Loss" },
  { value: "recomposition", label: "Body Recomposition" },
  { value: "maintenance", label: "Maintenance" },
] as const;

export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", hint: "Little or no exercise" },
  { value: "light", label: "Lightly Active", hint: "1–3 days/week" },
  { value: "moderate", label: "Moderately Active", hint: "3–5 days/week" },
  { value: "very_active", label: "Very Active", hint: "6–7 days/week" },
  { value: "athlete", label: "Athlete", hint: "Intense daily training" },
] as const;

export const FOOD_PREFERENCES = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non_vegetarian", label: "Non-Vegetarian" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "vegan", label: "Vegan" },
] as const;

export const REGIONS = [
  { value: "south_indian", label: "South Indian" },
  { value: "north_indian", label: "North Indian" },
  { value: "andhra", label: "Andhra" },
  { value: "telangana", label: "Telangana" },
  { value: "karnataka", label: "Karnataka" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "kerala", label: "Kerala" },
  { value: "maharashtra", label: "Maharashtra" },
] as const;

export const ALLERGIES = [
  { value: "nuts", label: "Nuts" },
  { value: "dairy", label: "Dairy" },
  { value: "gluten", label: "Gluten" },
  { value: "seafood", label: "Seafood" },
] as const;

export const BUDGETS = [
  { value: 100, label: "₹100 / day", hint: "Essential" },
  { value: 200, label: "₹200 / day", hint: "Balanced" },
  { value: 300, label: "₹300 / day", hint: "Comfortable" },
  { value: 500, label: "₹500 / day", hint: "Premium" },
] as const;

export function labelFor(
  list: ReadonlyArray<{ value: string | number; label: string }>,
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return "—";
  return list.find((o) => o.value === value)?.label ?? String(value);
}
