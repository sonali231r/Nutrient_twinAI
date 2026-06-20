import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader2, Flame, Weight, Droplets, Moon, Dumbbell, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/integrations/mongodb/db";
import type { ProgressLog } from "@/integrations/mongodb/types";
import { fetchHealthRecord, fetchProgressLogs } from "@/lib/user-data";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress Tracker — NutriTwin AI" }] }),
  component: ProgressTracker,
});

const today = () => new Date().toISOString().slice(0, 10);

function ProgressTracker() {
  const { user } = useAuth();
  const uid = user?.id;
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState({
    weight_kg: "",
    calories: "",
    water_l: "",
    sleep_hours: "",
    exercise_minutes: "",
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
  const logs = logsQ.data ?? [];
  const health = healthQ.data;

  async function save() {
    if (!uid) return;
    const payload: Omit<ProgressLog, "_id" | "id" | "created_at"> = {
      user_id: uid,
      log_date: new Date(today()),
    };
    if (entry.weight_kg) payload.weight_kg = Number(entry.weight_kg);
    if (entry.calories) payload.calories = Number(entry.calories);
    if (entry.water_l) payload.water_l = Number(entry.water_l);
    if (entry.sleep_hours) payload.sleep_hours = Number(entry.sleep_hours);
    if (entry.exercise_minutes) payload.exercise_minutes = Number(entry.exercise_minutes);
    if (Object.keys(payload).length <= 2) {
      toast.error("Enter at least one value.");
      return;
    }
    setSaving(true);
    try {
      await db.createProgressLog(payload);
      setSaving(false);
      setEntry({ weight_kg: "", calories: "", water_l: "", sleep_hours: "", exercise_minutes: "" });
      queryClient.invalidateQueries({ queryKey: ["progress", uid] });
      toast.success("Logged for today!");
    } catch (error) {
      setSaving(false);
      toast.error("Failed to log progress.");
    }
  }

  const last14 = logs.slice(-14);
  const weightData = last14
    .filter((l) => l.weight_kg != null)
    .map((l) => ({ d: l.log_date.slice(5), v: Number(l.weight_kg) }));
  const calorieData = last14
    .filter((l) => l.calories != null)
    .map((l) => ({ d: l.log_date.slice(5), v: Number(l.calories) }));
  const waterData = last14
    .filter((l) => l.water_l != null)
    .map((l) => ({ d: l.log_date.slice(5), v: Number(l.water_l) }));
  const exerciseData = last14
    .filter((l) => l.exercise_minutes != null)
    .map((l) => ({ d: l.log_date.slice(5), v: Number(l.exercise_minutes) }));

  const streak = computeStreak(logs.map((l) => l.log_date));

  return (
    <AppShell>
      <PageHeader
        title="Progress Tracker"
        description="Log daily and watch your trends and consistency build."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log today</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LogField
              icon={Weight}
              label="Weight (kg)"
              value={entry.weight_kg}
              onChange={(v) => setEntry((e) => ({ ...e, weight_kg: v }))}
            />
            <LogField
              icon={Flame}
              label={`Calories${health?.daily_calories ? ` (target ${health.daily_calories})` : ""}`}
              value={entry.calories}
              onChange={(v) => setEntry((e) => ({ ...e, calories: v }))}
            />
            <LogField
              icon={Droplets}
              label={`Water (L)${health?.hydration_l ? ` (target ${health.hydration_l})` : ""}`}
              value={entry.water_l}
              onChange={(v) => setEntry((e) => ({ ...e, water_l: v }))}
            />
            <LogField
              icon={Moon}
              label="Sleep (hrs)"
              value={entry.sleep_hours}
              onChange={(v) => setEntry((e) => ({ ...e, sleep_hours: v }))}
            />
            <LogField
              icon={Dumbbell}
              label="Exercise (min)"
              value={entry.exercise_minutes}
              onChange={(v) => setEntry((e) => ({ ...e, exercise_minutes: v }))}
            />
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save log
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase text-muted-foreground">Consistency streak</p>
                <p className="font-display text-2xl font-semibold">{streak} 🔥</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase text-muted-foreground">Days logged</p>
                <p className="font-display text-2xl font-semibold">{logs.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase text-muted-foreground">Health score</p>
                <p className="font-display text-2xl font-semibold">{health?.health_score ?? "—"}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weight (last 14)</CardTitle>
            </CardHeader>
            <CardContent className="h-52">
              {weightData.length > 1 ? (
                <Lines data={weightData} color="var(--primary)" />
              ) : (
                <Empty />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calories</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            {calorieData.length ? <Bars data={calorieData} color="var(--chart-3)" /> : <Empty />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Water (L)</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            {waterData.length ? <Bars data={waterData} color="var(--chart-4)" /> : <Empty />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exercise (min)</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            {exerciseData.length ? <Bars data={exerciseData} color="var(--chart-2)" /> : <Empty />}
          </CardContent>
        </Card>
      </div>

      {logs.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          No logs yet.{" "}
          <Link to="/dashboard" className="text-primary hover:underline">
            Back to dashboard
          </Link>
        </p>
      )}
    </AppShell>
  );
}

const tip = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function Lines({ data, color }: { data: { d: string; v: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <Tooltip contentStyle={tip} />
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Bars({ data, color }: { data: { d: string; v: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <Tooltip contentStyle={tip} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="v" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Not enough data yet.
    </div>
  );
}

function LogField({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof Weight;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-2 text-xs">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      <Input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
      />
    </div>
  );
}

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  // allow today or yesterday as start
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
