import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession, getUserRoles } from "@/integrations/mongodb/auth";

export const Route = createFileRoute("/_authenticated/_admin")({
  beforeLoad: async () => {
    const session = getSession();
    if (!session || !session.user) throw redirect({ to: "/auth" });
    const roles = await getUserRoles(session.user.id);
    const isAdmin = roles.includes("admin");
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: () => <Outlet />,
});
