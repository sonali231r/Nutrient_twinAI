import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Leaf,
  Brain,
  Sparkles,
  HeartPulse,
  Utensils,
  LineChart,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  ClipboardList,
  MessageSquareHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriTwin AI — Personalized Diet Intelligence & Predictive Health" },
      {
        name: "description",
        content:
          "AI-powered nutrition platform with personalized Indian diet plans, predictive health risk, future body-twin simulations and progress tracking.",
      },
      { property: "og:title", content: "NutriTwin AI — Predictive Health & Nutrition" },
      {
        property: "og:description",
        content:
          "Personalized regional diet intelligence, future health predictions and an AI nutrition assistant.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: HeartPulse,
    title: "Health Risk Intelligence",
    text: "Your vitals, lifestyle and BMI scored into a clear risk profile that updates as you change.",
  },
  {
    icon: Utensils,
    title: "AI Diet Generator",
    text: "Full-day regional Indian meal plans — veg, non-veg, vegan — with macros, timings and tips.",
  },
  {
    icon: Sparkles,
    title: "AI Body Twin",
    text: "Simulate where your habits take you over 30, 60, 90 and 180 days.",
  },
  {
    icon: IndianRupee,
    title: "Budget Optimizer",
    text: "Eat well within ₹100–₹500/day with smart, affordable regional meals.",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    text: "Log weight, calories, water, sleep and workouts; build streaks and watch trends.",
  },
  {
    icon: MessageSquareHeart,
    title: "AI Nutrition Assistant",
    text: "Ask anything — “Can I eat rice at night?” — and get grounded, personal answers.",
  },
];

const STEPS = [
  { icon: ClipboardList, title: "Assess", text: "Complete a quick multi-step health assessment." },
  {
    icon: Brain,
    title: "Analyze",
    text: "Our engine calculates calories, macros, risk and a habit score.",
  },
  {
    icon: Utensils,
    title: "Adapt",
    text: "Get personalized plans, predictions and daily guidance that evolve with you.",
  },
];

const FAQS = [
  {
    q: "Is NutriTwin AI suitable for Indian diets?",
    a: "Yes — it's built around regional Indian cuisine including South Indian, North Indian, Andhra, Telangana, Karnataka, Tamil Nadu, Kerala and Maharashtra foods.",
  },
  {
    q: "Does it support vegetarian and non-vegetarian plans?",
    a: "Absolutely. Choose vegetarian, non-vegetarian, eggetarian or vegan, and plans respect your allergies and budget.",
  },
  {
    q: "How are predictions calculated?",
    a: "We combine your calorie balance, body metrics and lifestyle signals into a predictive model that projects your weight and health risk.",
  },
  {
    q: "Is my health data private?",
    a: "Your data is protected with row-level security so only you can access your records.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold">NutriTwin AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero-mesh">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Machine learning meets regional
            nutrition
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Your <span className="text-gradient">personalized</span> diet & predictive health twin
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            NutriTwin AI understands your body, calculates your nutrition, predicts your future
            health and generates intelligent Indian meal plans — adapting to you over time.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/auth">
                Build my nutrition twin <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center font-display text-3xl font-semibold">
          Everything you need to eat smarter
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          A complete intelligent nutrition ecosystem, not a static calculator.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-lg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center font-display text-3xl font-semibold">How it works</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
                <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <s.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI highlight */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 rounded-3xl border border-border bg-card p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Brain className="h-3.5 w-3.5" /> Powered by AI
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold">
              Intelligence that adapts to you
            </h2>
            <p className="mt-3 text-muted-foreground">
              Four predictive engines work together — health-risk classification, calorie
              prediction, future weight projection and a hybrid diet recommendation engine grounded
              in a regional food database.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Predicts your 6-month health trajectory",
                "Optimizes meals to your budget & region",
                "Scores your daily habits out of 100",
                "Learns from every log you add",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Records modeled", value: "100k+" },
              { label: "Regional cuisines", value: "8" },
              { label: "Prediction horizon", value: "180d" },
              { label: "Habit score", value: "/100" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-secondary/60 p-6 text-center">
                <p className="font-display text-3xl font-semibold text-gradient">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center font-display text-3xl font-semibold">
            Loved by health-conscious Indians
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              {
                name: "Ananya, Bengaluru",
                text: "Finally a diet app that suggests ragi mudde and bisi bele bath instead of quinoa bowls!",
              },
              {
                name: "Rahul, Hyderabad",
                text: "The body-twin prediction was a wake-up call. Down 6 kg and my risk dropped to healthy.",
              },
              {
                name: "Meera, Chennai",
                text: "Budget plans under ₹200/day that actually taste like home. The assistant answers everything.",
              },
            ].map((t) => (
              <figure key={t.name} className="rounded-2xl border border-border bg-card p-6">
                <blockquote className="text-sm text-foreground/90">“{t.text}”</blockquote>
                <figcaption className="mt-4 text-sm font-medium text-muted-foreground">
                  {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center font-display text-3xl font-semibold">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Start your nutrition twin today
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Free to begin. Get your personalized plan, predictions and AI assistant in minutes.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link to="/auth">
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">NutriTwin AI</span>
          </div>
          <p>© {new Date().getFullYear()} NutriTwin AI — Predictive Diet Intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
