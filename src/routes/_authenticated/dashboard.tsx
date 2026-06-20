import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Weight,
  Activity,
  Flame,
  Beef,
  Droplets,
  Moon,
  HeartPulse,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchProfile,
  fetchHealthRecord,
  fetchProgressLogs,
  fetchLatestPrediction,
} from "@/lib/user-data";
import { labelFor, GOALS } from "@/lib/nutrition/constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NutriTwin AI" }] }),
  component: Dashboard,
});

const RISK_ACCENT: Record<string, "success" | "warning" | "destructive" | "primary"> = {
  Healthy: "success",
  "Mild Risk": "primary",
  "Moderate Risk": "warning",
  "High Risk": "destructive",
};

function Dashboard() {
  const { user } = useAuth();
  const uid = user?.id;

  const profileQ = useQuery({
    queryKey: ["profile", uid],
    queryFn: () => fetchProfile(uid!),
    enabled: !!uid,
  });
  const healthQ = useQuery({
    queryKey: ["health", uid],
    queryFn: () => fetchHealthRecord(uid!),
    enabled: !!uid,
  });
  const logsQ = useQuery({
    queryKey: ["progress", uid],
    queryFn: () => fetchProgressLogs(uid!),
    enabled: !!uid,
  });
  const predQ = useQuery({
    queryKey: ["prediction", uid],
    queryFn: () => fetchLatestPrediction(uid!),
    enabled: !!uid,
  });

  const profile = profileQ.data;
  const health = healthQ.data;
  const logs = logsQ.data ?? [];
  const pred = predQ.data;

  const loading = profileQ.isLoading || healthQ.isLoading;

  if (loading) {
    return (
      <AppShell>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!health?.completed) {
    return (
      <AppShell>
        <PageHeader title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ""}`} />
        <Card className="bg-hero-mesh">
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold">
                Let's build your nutrition twin
              </h2>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Complete your health assessment so NutriTwin can calculate your calorie and macro
                targets, score your habits and predict your future health trajectory.
              </p>
            </div>
            <Button asChild>
              <Link to="/assessment">
                Start health assessment <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const weightSeries = logs
    .filter((l) => l.weight_kg != null)
    .map((l) => ({ date: l.log_date.slice(5), weight: Number(l.weight_kg) }));
  const calorieSeries = logs
    .filter((l) => l.calories != null)
    .map((l) => ({ date: l.log_date.slice(5), calories: Number(l.calories) }));

  const latestWeight = weightSeries.length
    ? weightSeries[weightSeries.length - 1].weight
    : profile?.weight_kg;
  const latestLog = logs[logs.length - 1];

  const predSeries = pred
    ? [
        { label: "Now", weight: Number(pred.current_weight) },
        { label: "30d", weight: Number(pred.weight_30d) },
        { label: "60d", weight: Number(pred.weight_60d) },
        { label: "90d", weight: Number(pred.weight_90d) },
        { label: "180d", weight: Number(pred.weight_180d) },
      ]
    : [];

  return (
    <AppShell>
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="Your live health snapshot and trends."
      >
        <Button asChild variant="outline">
          <Link to="/progress">Log today</Link>
        </Button>
        <Button asChild>
          <Link to="/diet">Generate diet</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Weight"
          value={latestWeight ? Number(latestWeight).toFixed(1) : "—"}
          unit="kg"
          icon={Weight}
        />
        <StatCard
          label="BMI"
          value={health.bmi ?? "—"}
          icon={Activity}
          hint={health.bmi ? bmiHint(Number(health.bmi)) : ""}
        />
        <StatCard
          label="Daily Calories"
          value={health.daily_calories ?? "—"}
          unit="kcal"
          icon={Flame}
          accent="warning"
        />
        <StatCard label="Protein Target" value={health.protein_g ?? "—"} unit="g" icon={Beef} />
        <StatCard
          label="Hydration"
          value={latestLog?.water_l ?? "—"}
          unit={`/ ${health.hydration_l ?? "—"} L`}
          icon={Droplets}
        />
        <StatCard
          label="Sleep"
          value={latestLog?.sleep_hours ?? health.sleep_hours ?? "—"}
          unit="hrs"
          icon={Moon}
        />
        <StatCard
          label="Health Score"
          value={health.health_score ?? "—"}
          unit="/100"
          icon={HeartPulse}
          accent="success"
        />
        <StatCard
          label="Risk Level"
          value={health.health_risk ?? "—"}
          icon={HeartPulse}
          accent={RISK_ACCENT[health.health_risk ?? ""] ?? "primary"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weight trend</CardTitle>
            <CardDescription>Your logged weight over time</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {weightSeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightSeries} margin={{ left: -16, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#wg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Log your weight a few times to see your trend." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calorie intake</CardTitle>
            <CardDescription>Daily logged calories vs target</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {calorieSeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={calorieSeries} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Log your calories to track intake." />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Future body twin</CardTitle>
              <CardDescription>Projected weight trajectory</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link to="/predictions">
                Details <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="h-64">
            {predSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predSeries} margin={{ left: -16, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    fill="url(#pg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground">No prediction yet.</p>
                <Button asChild size="sm">
                  <Link to="/predictions">Generate prediction</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Badge variant="secondary" className="text-xs">
          Goal: {labelFor(GOALS, health.goal)}
        </Badge>
      </div>
    </AppShell>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

function bmiHint(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal range";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
