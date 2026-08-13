// AdminGate — wraps admin-only routes. Pulls admin status from
// CommunityAuthContext (which checks the `admins` table). Renders:
//   - children if user is signed in AND in admins table
//   - login redirect if anonymous
//   - "Not authorised" message if signed in but not admin

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";

interface AdminGateProps {
  children: ReactNode;
}

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

export default function AdminGate({ children }: AdminGateProps) {
  const { user, isAdmin, loading } = useCommunityAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f8] text-[#0B1640]">
        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?next=/community/admin" replace />;
  }

  if (!isAdmin) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-[#f3f5f8] px-4 py-20 text-[#0B1640]"
        style={{ fontFamily: INTER_STACK }}
      >
        <div className="mx-auto max-w-md rounded-3xl border border-[#0B1640]/10 bg-[#232532] p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1
            className="mt-5 text-[#0B1640]"
            style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.015em" }}
          >
            Admin access only
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#0B1640]/75">
            This area is for ONROL Community admins. If you should have access,
            ask the team to add your user ID to the <code className="rounded bg-white px-1 py-0.5 text-[12px]">admins</code> table.
          </p>
          <a
            href="/community/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-white"
          >
            Back to community
          </a>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
