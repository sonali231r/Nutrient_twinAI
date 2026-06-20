import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ClipboardList,
  Utensils,
  MessageSquareHeart,
  LineChart,
  Sparkles,
  Shield,
  LogOut,
  Menu,
  X,
  Leaf,
} from "lucide-react";
import { signOut } from "@/integrations/mongodb/auth";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assessment", label: "Health Assessment", icon: ClipboardList },
  { to: "/diet", label: "AI Diet Generator", icon: Utensils },
  { to: "/predictions", label: "Body Twin & Predictions", icon: Sparkles },
  { to: "/progress", label: "Progress Tracker", icon: LineChart },
  { to: "/assistant", label: "AI Assistant", icon: MessageSquareHeart },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  const SidebarBody = (
    <div className="flex h-full flex-col gap-1 p-4">
      <Link
        to="/dashboard"
        className="mb-6 flex items-center gap-2 px-2"
        onClick={() => setOpen(false)}
      >
        <img src="/favicon.png" alt="NutriTwin AI" className="h-9 w-9 rounded-xl object-cover" />
        <span className="font-display text-lg font-semibold">NutriTwin AI</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className={cn(
              "mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/admin"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Shield className="h-[18px] w-[18px]" />
            Admin Console
          </Link>
        )}
      </nav>
      <Button
        variant="ghost"
        className="justify-start gap-3 text-sidebar-foreground/70"
        onClick={handleSignOut}
      >
        <LogOut className="h-[18px] w-[18px]" />
        Sign out
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">{SidebarBody}</div>
      </aside>

      {/* Mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border bg-sidebar">
            {SidebarBody}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-display font-semibold">NutriTwin AI</span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
