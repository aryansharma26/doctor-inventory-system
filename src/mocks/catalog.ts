import type { Department, Doctor, Hospital, Session } from "./types";

/**
 * All mock dates are anchored to a fixed day so server prerender and
 * client hydration agree. Replace with the real clock when APIs land.
 */
export const DEMO_TODAY = "2026-11-16"; // Monday
/** Current clock time on that day, minutes since midnight (11:20 AM). */
export const DEMO_NOW = 11 * 60 + 20;

/** The hospital the Hospital and Doctor dashboards are signed in to. */
export const CURRENT_HOSPITAL_ID = "h-aarogya";

export const DEPARTMENTS: Department[] = [
  { id: "general-medicine", name: "General Medicine", short: "Gen. Med", description: "Fever, infections, diabetes, BP and everyday health concerns.", floor: "Ground floor, Wing A", headDoctorId: "d-arjun" },
  { id: "cardiology", name: "Cardiology", short: "Cardio", description: "Heart health, ECG, echo, hypertension and chest pain evaluation.", floor: "2nd floor, Wing B", headDoctorId: "d-meera" },
  { id: "paediatrics", name: "Paediatrics", short: "Paeds", description: "Child health, vaccinations and growth monitoring up to 18 years.", floor: "1st floor, Wing A", headDoctorId: "d-kavya" },
];

export const HOSPITALS: Hospital[] = [
  {
    id: "h-aarogya",
    slug: "aarogya-multispeciality-pune",
    name: "Aarogya Multispeciality Hospital",
    tagline: "Multispeciality care in Kothrud since 2009",
    city: "Pune",
    area: "Kothrud",
    address: "42, Karve Road, near Nal Stop, Kothrud",
    pincode: "411038",
    phone: "+91 20 4567 8900",
    email: "care@aarogyahospital.in",
    rating: 4.7,
    reviews: 2184,
    distanceKm: 1.8,
    beds: 220,
    established: 2009,
    accreditations: ["NABH", "NABL lab"],
    departments: ["general-medicine", "cardiology", "paediatrics"],
    opdHours: "Mon-Sat, 9:00 AM to 8:00 PM",
    emergency24x7: true,
    about:
      "Aarogya is a 220-bed NABH-accredited hospital in west Pune with an in-house diagnostic lab, pharmacy and 24x7 emergency.",
    facilities: ["24x7 Emergency", "ICU", "Pharmacy", "Diagnostic lab", "Cashless insurance", "Parking"],
    cover: ["#1d4686", "#17a08b"],
    featured: true,
  },
];

const s = (startH: number, startM: number, endH: number, endM: number): Session => ({
  start: startH * 60 + startM,
  end: endH * 60 + endM,
});
const weekdays = (sessions: Session[], sat: Session[] = sessions): Session[][] => [
  [],
  sessions,
  sessions,
  sessions,
  sessions,
  sessions,
  sat,
];

export const DOCTORS: Doctor[] = [
  {
    id: "d-arjun", name: "Dr. Arjun Mehta", gender: "male", hospitalId: "h-aarogya", departmentId: "general-medicine",
    specialty: "Internal Medicine", qualifications: ["MBBS", "MD (General Medicine)"], experienceYears: 14, fee: 700, followUpFee: 400,
    languages: ["English", "Hindi", "Marathi"], rating: 4.8, reviews: 612, room: "OPD 104", registrationNo: "MMC 2011/04/1876",
    about: "Focuses on diabetes, thyroid disorders and preventive health checks.",
    weekly: weekdays([s(9, 30, 13, 30), s(17, 0, 20, 0)], [s(9, 30, 13, 30)]), slotMinutes: 15, status: "in-consultation", featured: true,
  },
  {
    id: "d-meera", name: "Dr. Meera Iyer", gender: "female", hospitalId: "h-aarogya", departmentId: "cardiology",
    specialty: "Cardiologist", qualifications: ["MBBS", "MD (Medicine)", "DM (Cardiology)"], experienceYears: 18, fee: 1200, followUpFee: 700,
    languages: ["English", "Hindi", "Tamil"], rating: 4.9, reviews: 488, room: "OPD 211", registrationNo: "MMC 2006/02/0931",
    about: "Specialises in coronary heart disease, heart failure and women's heart health.",
    weekly: weekdays([s(10, 0, 14, 0)], [s(10, 0, 13, 0)]), slotMinutes: 20, status: "available", featured: true,
  },
  {
    id: "d-kavya", name: "Dr. Kavya Reddy", gender: "female", hospitalId: "h-aarogya", departmentId: "paediatrics",
    specialty: "Paediatrician", qualifications: ["MBBS", "MD (Paediatrics)"], experienceYears: 9, fee: 800, followUpFee: 400,
    languages: ["English", "Hindi", "Telugu"], rating: 4.9, reviews: 721, room: "OPD 122", registrationNo: "MMC 2015/01/3381",
    about: "Child development, vaccinations and newborn care.",
    weekly: weekdays([s(9, 30, 13, 30), s(17, 0, 20, 0)]), slotMinutes: 15, status: "available", featured: true,
  },
];

export const departmentById = (id: string) => DEPARTMENTS.find((d) => d.id === id);
export const doctorById = (id: string) => DOCTORS.find((d) => d.id === id);
export const hospitalById = (id: string) => HOSPITALS.find((h) => h.id === id);
export const hospitalBySlug = (slug: string) => HOSPITALS.find((h) => h.slug === slug);
