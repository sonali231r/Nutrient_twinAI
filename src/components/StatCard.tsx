import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  } as const;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            accentMap[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-2xl font-semibold leading-tight">
            {value}
            {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
          </p>
          {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
