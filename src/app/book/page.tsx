import { Booking } from "@/features/hospital/booking";
import { Suspense } from "react";
export const metadata = { title: "Book a visit · Harmony Hospital" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="workspace-loading">Getting appointments ready…</div>
      }
    >
      <Booking />
    </Suspense>
  );
}
