import { Suspense } from "react";
import { CURRENT_HOSPITAL_ID, DOCTORS } from "@/mocks/catalog";
import { DoctorProfile } from "@/portals/hospital/doctors";
import { Skeleton } from "@/design-system";

export const metadata = { title: "Doctor profile" };

export function generateStaticParams() {
  return DOCTORS.filter((d) => d.hospitalId === CURRENT_HOSPITAL_ID).map((d) => ({ id: d.id }));
}

async function Resolved({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorProfile id={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // Ids outside generateStaticParams are request-time data, so they are read inside Suspense.
  return (
    <Suspense fallback={<Skeleton className="h-40 rounded-card" />}>
      <Resolved params={params} />
    </Suspense>
  );
}
