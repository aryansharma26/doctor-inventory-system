import type { Metadata } from "next";
import { PatientBooking } from "@/portals/patient/booking";

export const metadata: Metadata = {
  title: "Book an appointment · Aarogya Multispeciality Hospital",
};

export default function Page() {
  return <PatientBooking />;
}
