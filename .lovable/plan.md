# NutriTwin AI — Build Plan (v1)

A production-ready AI nutrition platform built natively on Lovable's stack. Real working predictions and AI features via deterministic engines + Lovable AI — no Python/MongoDB/Render services (those can't run here), but functionally equivalent.

## Stack (adapted from your spec)

- **Frontend:** TanStack Start, React, TypeScript, Tailwind, shadcn/ui, Recharts (Chart.js isn't SSR-friendly here)
- **Backend:** TanStack server functions (replaces Express)
- **Database + Auth + Storage:** Lovable Cloud (replaces MongoDB Atlas; JWT/bcrypt handled by managed auth)
- **AI:** Lovable AI Gateway (chatbot, diet generation, fridge image recognition) — replaces FastAPI/XGBoost/TensorFlow
- **"ML models":** real predictive engines in TypeScript server functions (BMI/BMR/TDEE, risk scoring, weight projection) + AI-assisted recommendations

## What v1 includes (your selected slices)

Auth + roles (User, Admin) · Health Assessment · Dashboard · AI Diet Generator (regional + budget) · AI Nutrition Chatbot · Predictions + Progress Tracker · Admin dashboard.
(Nutritionist role, fridge scanner, downloadable Python dataset/training scripts deferred to a later milestone — see end.)

## Design direction

Modern health-tech aesthetic: calm clinical-but-warm palette (deep teal/emerald primary, soft neutrals, amber/red risk accents), generous whitespace, rounded cards, subtle motion. Distinctive type pairing (e.g. Outfit display + Figtree body) via @fontsource. All colors as semantic tokens in `src/styles.css`.

---

## Phase 1 — Foundation

- Enable Lovable Cloud (database, auth, storage).
- Email/password + Google sign-in. Auth pages: login, register, forgot password, reset password.
- `user_roles` table with `app_role` enum (`user`, `admin`) + `has_role()` security-definer function (roles never on profile table).
- Database schema (with GRANTs + RLS scoped to `auth.uid()`):
  - `profiles` — personal info (name, age, gender, height, weight)
  - `health_records` — goal, activity, food preference, region, BP, sugar, cholesterol, sleep, water, stress, allergies, budget + auto-saved partial state
  - `diet_plans` — generated meal plans (JSON)
  - `progress_logs` — weight/calories/water/sleep/exercise per day
  - `predictions` — 30/60/90/180-day projections + risk
  - `food_database` / `regional_foods` — seeded Indian foods (idli, dosa, ragi mudde, jowar roti, khichdi, poha, upma, dal, fish curry, paneer, etc.) with macros, region, veg/non-veg, cost
  - `notifications`, `system_logs`
- `_authenticated/` route layout (integration-managed gate); `_authenticated/_admin` nested layout gated by `has_role('admin')`.

## Phase 2 — Landing page

Public route with Hero, Features, How it works, AI features, Testimonials, FAQs, CTA. Per-route SEO `head()`.

## Phase 3 — Calculation engine (server functions)

Deterministic engine computing BMI, BMR (Mifflin-St Jeor), TDEE (activity multiplier), daily calories (goal-adjusted deficit/surplus), protein/carbs/fats/fiber, hydration. Pure, testable functions in `src/lib/nutrition`.

## Phase 4 — Health Assessment

Multi-step form (Personal → Fitness Goal → Activity → Food/Region → Health → Allergies → Budget) with progress indicator, Zod validation, and auto-save to `health_records` after each step. On completion, runs the calculation engine + risk model and seeds the dashboard.

## Phase 5 — Dashboard

- Metric cards: weight, BMI, calories, protein, water, sleep, health score.
- Charts (Recharts): weekly + monthly weight trend, calorie trend, health trend, risk trend.
- Health score (out of 100) from sleep/water/exercise/diet quality/consistency (AI Habit Score).

## Phase 6 — AI Diet Generator

Server function combining the nutrition engine + rule engine + regional food DB + budget optimizer, with Lovable AI for natural meal composition and daily tips. Output: breakfast, lunch, evening snacks, dinner with calories/macros, hydration, meal timings, daily tips, shopping list. Respects veg/non-veg/vegan/eggetarian, region, allergies, and ₹100/200/300/500 budget. Saves to `diet_plans`.

## Phase 7 — AI Nutrition Chatbot

Streaming chat (server route `/api/chat` + `useChat`) with the user's profile/health context injected. Markdown rendering. Handles queries like "Can I eat rice at night?", "protein-rich vegetarian foods", "I have diabetes, what to avoid".

## Phase 8 — Predictions + Progress Tracker

- **Progress Tracker:** log weight, calories, water, sleep, exercise; consistency streak; history charts.
- **Future Prediction / AI Body Twin:** weight projection (gradient-style trend regression over logged + target data) for 30/60/90/180 days, plus risk-trajectory narrative ("if habits continue, obesity risk may increase ~12%"). Saved to `predictions`.

## Phase 9 — Admin dashboard

Under `_admin`: platform analytics (user counts, signups, risk distribution), user management (list/search/role), dataset/food-DB monitoring, system logs. Read via privileged server functions that verify `has_role('admin')`.

## Phase 10 — Polish & verify

Responsive/mobile pass, loading/empty/error states, toast handling for AI 402/429 errors, build + preview verification of each page.

---

## Technical notes

- All Supabase writes/reads via `createServerFn` (RLS as user); admin reads via role-checked server functions.
- AI calls server-side only; `LOVABLE_API_KEY` never exposed.
- New tables always get GRANTs + RLS in the same migration.

## Deferred to later milestones (not in v1)

- Nutritionist role (assigned users, approve/modify plans).
- AI Refrigerator Scanner (image → ingredients → meals via Lovable AI vision + storage).
- OTP verification.
- Downloadable Python synthetic-data generator (100k records) + model-training scripts as artifacts.
- Architecture diagrams + API documentation pages.

Tell me to proceed and I'll start with Phase 1, or adjust any phase ordering first.
