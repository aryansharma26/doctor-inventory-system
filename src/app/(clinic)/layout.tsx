import { ProtectedWorkspace } from "@/features/hospital/protected-workspace";
import { Suspense } from "react";

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="workspace-loading">Loading hospital workspace…</div>
      }
    >
      <ProtectedWorkspace>{children}</ProtectedWorkspace>
    </Suspense>
  );
}
