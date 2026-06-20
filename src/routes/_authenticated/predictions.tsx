import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchProfile, fetchHealthRecord, fetchLatestPrediction } from "@/lib/user-data";
import { computePrediction, savePrediction } from "@/lib/predictions";

export const Route = createFileRoute("/_authenticated/predictions")({
  head: () => ({ meta: [{ title: "Body Twin & Predictions — NutriTwin AI" }] }),
  component: Predictions,
});

const RISK_VARIANT: Record<string, string> = {
  Healthy: "bg-success/15 text-success",
  "Mild Risk": "bg-primary/10 text-primary",
  "Moderate Risk": "bg-warning/20 text-warning-foreground",
  "High Risk": "bg-destructive/10 text-destructive",
};

function Predictions() {
  const { user } = useAuth();
  const uid = user?.id;
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const healthQ = useQuery({
    queryKey: ["health", uid],
    queryFn: () => fetchHealthRecord(uid!),
    enabled: !!uid,
  });
  const predQ = useQuery({
    queryKey: ["prediction", uid],
    queryFn: () => fetchLatestPrediction(uid!),
    enabled: !!uid,
  });
  const health = healthQ.data;
  const pred = predQ.data;

  async function regenerate() {
    if (!uid) return;
    setBusy(true);
    try {
      const [p, h] = await Promise.all([fetchProfile(uid), fetchHealthRecord(uid)]);
      if (!p || !h) {
        toast.error("Complete your assessment first.");
        return;
      }
      const result = computePrediction(p, h);
      if (!result) {
        toast.error("Not enough data to predict. Update your assessment.");
        return;
      }
      await savePrediction(uid, result);
      await queryClient.invalidateQueries({ queryKey: ["prediction", uid] });
      toast.success("Prediction updated.");
    } finally {
      setBusy(false);
    }
  }

  if (healthQ.isLoading || predQ.isLoading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!health?.completed) {
    return (
      <AppShell>
        <PageHeader title="Body Twin & Predictions" />
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-muted-foreground">
              Complete your assessment to unlock predictions.
            </p>
            <Button asChild>
              <Link to="/assessment">Go to assessment</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const series = pred
    ? [
        { label: "Now", weight: Number(pred.current_weight) },
        { label: "30d", weight: Number(pred.weight_30d) },
        { label: "60d", weight: Number(pred.weight_60d) },
        { label: "90d", weight: Number(pred.weight_90d) },
        { label: "180d", weight: Number(pred.weight_180d) },
      ]
    : [];

  const change = pred ? Number(pred.weight_180d) - Number(pred.current_weight) : 0;
  const Trend = change < -0.5 ? TrendingDown : change > 0.5 ? TrendingUp : Minus;

  return (
    <AppShell>
      <PageHeader
        title="AI Body Twin"
        description="A digital simulation of where your current habits are taking you."
      >
        <Button onClick={regenerate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Recalculate
        </Button>
      </PageHeader>

      {!pred ? (
        <Card className="bg-hero-mesh">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Sparkles className="h-8 w-8 text-primary" />
            <h3 className="font-display text-lg font-semibold">Generate your body twin</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              We'll project your weight and health risk over the next 6 months based on your
              metrics.
            </p>
            <Button onClick={regenerate} disabled={busy}>
              Generate now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="flex items-start gap-4 p-6">
              <Trend className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h3 className="font-display text-lg font-semibold">Your 6-month trajectory</h3>
                <p className="mt-1 text-sm text-muted-foreground">{pred.narrative}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Horizon label="Now" value={pred.current_weight} />
            <Horizon label="30 days" value={pred.weight_30d} base={pred.current_weight} />
            <Horizon label="60 days" value={pred.weight_60d} base={pred.current_weight} />
            <Horizon label="90 days" value={pred.weight_90d} base={pred.current_weight} />
            <Horizon label="180 days" value={pred.weight_180d} base={pred.current_weight} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projected weight</CardTitle>
              <CardDescription>Based on your calorie balance and habits</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ left: -12, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="twin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <ReferenceLine
                    y={Number(pred.current_weight)}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#twin)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <RiskCard title="Current risk" level={pred.risk_now} />
            <RiskCard title="Projected risk (180d)" level={pred.risk_180d} future />
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Horizon({
  label,
  value,
  base,
}: {
  label: string;
  value: number | null;
  base?: number | null;
}) {
  const v = Number(value ?? 0);
  const delta = base != null ? v - Number(base) : 0;
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-semibold">{v.toFixed(1)} kg</p>
        {base != null && (
          <p
            className={`text-xs ${delta < 0 ? "text-success" : delta > 0 ? "text-warning-foreground" : "text-muted-foreground"}`}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} kg
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RiskCard({
  title,
  level,
  future,
}: {
  title: string;
  level: string | null;
  future?: boolean;
}) {
  const safe = level === "Healthy" || level === "Mild Risk";
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${RISK_VARIANT[level ?? ""] ?? "bg-muted"}`}
        >
          {safe ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <Badge className={`mt-1 ${RISK_VARIANT[level ?? ""] ?? ""}`} variant="secondary">
            {level ?? "—"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
