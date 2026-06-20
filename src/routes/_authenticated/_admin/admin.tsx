import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Users, ClipboardCheck, Utensils, Database, Loader2, Shield } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminStats, getAdminUsers } from "@/lib/admin.functions";
import { labelFor, GOALS, REGIONS } from "@/lib/nutrition/constants";

export const Route = createFileRoute("/_authenticated/_admin/admin")({
  head: () => ({ meta: [{ title: "Admin Console — NutriTwin AI" }] }),
  component: AdminConsole,
});

const PIE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)"];

function AdminConsole() {
  const statsFn = useServerFn(getAdminStats);
  const usersFn = useServerFn(getAdminUsers);
  const statsQ = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });
  const usersQ = useQuery({ queryKey: ["admin-users"], queryFn: () => usersFn() });

  if (statsQ.isLoading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const s = statsQ.data;
  const riskData = Object.entries(s?.riskDistribution ?? {}).map(([name, value]) => ({
    name,
    value,
  }));
  const goalData = Object.entries(s?.goalDistribution ?? {}).map(([k, value]) => ({
    name: labelFor(GOALS, k),
    value,
  }));

  return (
    <AppShell>
      <PageHeader
        title="Admin Console"
        description="Platform analytics, users and dataset monitoring."
      >
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3.5 w-3.5" /> Admin
        </Badge>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={s?.totalUsers ?? 0} icon={Users} />
        <StatCard
          label="Completed Assessments"
          value={s?.completedAssessments ?? 0}
          icon={ClipboardCheck}
          accent="success"
        />
        <StatCard
          label="Diet Plans"
          value={s?.totalDietPlans ?? 0}
          icon={Utensils}
          accent="warning"
        />
        <StatCard label="Food Library" value={s?.foodCount ?? 0} icon={Database} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Health risk distribution</CardTitle>
            <CardDescription>Across assessed users</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {riskData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {riskData.map((_, i) => (
                      <Cell key={i} fill={PIE[i % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goals breakdown</CardTitle>
            <CardDescription>What users are working toward</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {goalData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalData} margin={{ left: -18, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    stroke="var(--muted-foreground)"
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "var(--muted)" }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Recently registered members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usersQ.data ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>{u.age ?? "—"}</TableCell>
                    <TableCell>{u.goal ? labelFor(GOALS, u.goal) : "—"}</TableCell>
                    <TableCell>{u.region ? labelFor(REGIONS, u.region) : "—"}</TableCell>
                    <TableCell>{u.health_risk ?? "—"}</TableCell>
                    <TableCell>{u.health_score ?? "—"}</TableCell>
                    <TableCell>
                      {u.roles.map((r) => (
                        <Badge key={r} variant="secondary" className="mr-1 text-xs">
                          {r}
                        </Badge>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
                {usersQ.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      No users yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No data yet.
    </div>
  );
}
