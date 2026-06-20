import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/integrations/mongodb/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — NutriTwin AI" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) setReady(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    // TODO: Implement password reset with MongoDB
    toast.error("Password reset not yet implemented with MongoDB");
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">NutriTwin AI</span>
          </div>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            {ready
              ? "Choose a new password for your account."
              : "Open this page from the reset link in your email."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!ready}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={!ready || loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
