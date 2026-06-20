import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/integrations/mongodb/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const session = getSession();
    if (!session || !session.user) throw redirect({ to: "/auth" });
    return { user: session.user };
  },
  component: () => <Outlet />,
});
