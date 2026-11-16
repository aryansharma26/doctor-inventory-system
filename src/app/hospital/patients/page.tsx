import { Suspense } from "react";
import { PatientsPage } from "@/portals/hospital/patients";
import { SkeletonRows } from "@/design-system";

export const metadata = { title: "Patients" };

export default function Page() {
  // PatientsPage reads ?q= from the URL, so it renders inside a Suspense boundary.
  return (
    <Suspense fallback={<SkeletonRows rows={8} />}>
      <PatientsPage />
    </Suspense>
  );
}
