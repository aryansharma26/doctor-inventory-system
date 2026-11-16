import type { Metadata } from "next";
import { HospitalLayoutClient } from "@/portals/hospital/layout-client";

export const metadata: Metadata = {
  title: { template: "%s · Hospital · MediStock", default: "Hospital · MediStock" },
};

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return <HospitalLayoutClient>{children}</HospitalLayoutClient>;
}
