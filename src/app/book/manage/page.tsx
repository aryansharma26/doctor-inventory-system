import { ManageBooking } from "@/features/hospital/booking-manage";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense fallback={<div className="workspace-loading">Loading…</div>}>
      <ManageBooking />
    </Suspense>
  );
}
