import { ProtectedWorkspace } from "@/features/hospital/protected-workspace";
import { Suspense } from "react";
import { Dashboard } from "@/features/hospital/dashboard";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="workspace-loading">Loading your workspace…</div>
      }
    >
      <ProtectedWorkspace home>
        <Dashboard />
      </ProtectedWorkspace>
    </Suspense>
  );
}
