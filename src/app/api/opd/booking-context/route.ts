import { connection } from "next/server";
import { CURRENT_HOSPITAL_ID, DEMO_TODAY, DEPARTMENTS, DOCTORS, HOSPITALS } from "@/mocks/catalog";
import { addDays } from "@/design-system/format";
import { takenSlots } from "@/server/opd/repository";
import { fail, ok } from "@/server/opd/http";

/** Public: doctors and already-booked slots for the next 7 days. No patient data. */
export async function GET() {
  await connection();
  try {
    const doctors = DOCTORS.filter((d) => d.hospitalId === CURRENT_HOSPITAL_ID).map((d) => {
      const { userId, membershipId, registrationNo, ...publicFields } = d;
      void userId;
      void membershipId;
      void registrationNo;
      return publicFields;
    });
    return ok({
      hospital: HOSPITALS.find((h) => h.id === CURRENT_HOSPITAL_ID),
      departments: DEPARTMENTS,
      doctors,
      taken: await takenSlots(DEMO_TODAY, addDays(DEMO_TODAY, 7)),
    });
  } catch (e) {
    return fail(e);
  }
}
