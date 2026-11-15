import { Suspense } from "react";
import { PatientDirectory } from "@/features/hospital/patients";
export default function Page() { return <Suspense fallback={<p>Loading patient directory…</p>}><PatientDirectory /></Suspense>; }
