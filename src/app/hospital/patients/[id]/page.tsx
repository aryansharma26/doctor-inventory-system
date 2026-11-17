import { Suspense } from "react";
import { PATIENTS } from "@/mocks/records";
import { PatientDetail } from "@/portals/hospital/patient-detail";
import { Skeleton } from "@/design-system";

export const metadata = { title: "Patient" };

export function generateStaticParams() {
  // Pre-render a sample; other patient pages render on demand inside Suspense.
  return PATIENTS.slice(0, 50).map((p) => ({ id: p.id }));
}

async function Resolved({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientDetail id={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // Ids outside generateStaticParams are request-time data, so they are read inside Suspense.
  return (
    <Suspense fallback={<Skeleton className="h-40 rounded-card" />}>
      <Resolved params={params} />
    </Suspense>
  );
}
