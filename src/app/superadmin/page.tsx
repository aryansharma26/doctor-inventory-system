import { PlatformDashboard } from "@/features/platform/platform-dashboard";
import { AppShell } from "@/components/layout/app-shell";

export default function Page() {
  return (
    <AppShell>
      <PlatformDashboard />
    </AppShell>
  );
}
