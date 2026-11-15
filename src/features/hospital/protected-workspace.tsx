import { getStaffSession } from "./auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_HOME } from "./types";
import { connection } from "next/server";
export async function ProtectedWorkspace({
  children,
  home = false,
}: {
  children: React.ReactNode;
  home?: boolean;
}) {
  await connection();
  const staff = await getStaffSession();
  if (!staff) redirect("/login");
  if (home && staff.role !== "ADMIN") redirect(ROLE_HOME[staff.role]);
  return <AppShell>{children}</AppShell>;
}
