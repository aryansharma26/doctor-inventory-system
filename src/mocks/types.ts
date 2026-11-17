/*
 * Domain types for the new UI. These describe what the screens need and are
 * the contract the future API should satisfy.
 */

export type DepartmentId =
  | "general-medicine"
  | "cardiology"
  | "orthopaedics"
  | "paediatrics"
  | "obgyn"
  | "dermatology"
  | "ent"
  | "ophthalmology"
  | "neurology"
  | "dental";

export type Department = {
  id: DepartmentId;
  name: string;
  short: string;
  description: string;
  floor: string;
  headDoctorId?: string;
};

export type Hospital = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  city: string;
  area: string;
  address: string;
  pincode: string;
  phone: string;
  email: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  beds: number;
  established: number;
  accreditations: string[];
  departments: DepartmentId[];
  opdHours: string;
  emergency24x7: boolean;
  about: string;
  facilities: string[];
  /** Two colours used to draw the hospital's generated cover art. */
  cover: [string, string];
  featured?: boolean;
};

export type DoctorStatus = "available" | "in-consultation" | "on-break" | "off-duty" | "on-leave";

/** One OPD session in a weekly schedule. Minutes since midnight. */
export type Session = { start: number; end: number };

export type Doctor = {
  id: string;
  /** Database ids: the doctor's User and their UserClinic membership. */
  userId: string;
  membershipId: string;
  name: string;
  gender: "male" | "female";
  hospitalId: string;
  departmentId: DepartmentId;
  specialty: string;
  qualifications: string[];
  experienceYears: number;
  fee: number;
  followUpFee: number;
  languages: string[];
  rating: number;
  reviews: number;
  room: string;
  registrationNo: string;
  about: string;
  /** index 0 = Sunday */
  weekly: Session[][];
  slotMinutes: number;
  status: DoctorStatus;
  featured?: boolean;
};

export type Gender = "Male" | "Female" | "Other";

export type Patient = {
  id: string;
  uhid: string;
  name: string;
  gender: Gender;
  dob: string;
  phone: string;
  email?: string;
  bloodGroup: string;
  city: string;
  address: string;
  abhaId?: string;
  allergies: string[];
  conditions: string[];
  emergencyContact?: { name: string; relation: string; phone: string };
  registeredOn: string;
  tags: string[];
};

export type AppointmentStatus =
  | "scheduled"
  | "waiting"
  | "in-consultation"
  | "completed"
  | "cancelled"
  | "no-show";

export type BookingChannel = "walk-in" | "online" | "phone";

export type Appointment = {
  id: string;
  token: number;
  patientId: string;
  doctorId: string;
  departmentId: DepartmentId;
  hospitalId: string;
  date: string;
  start: number;
  duration: number;
  visitType: "new" | "follow-up";
  channel: BookingChannel;
  status: AppointmentStatus;
  reason: string;
  checkedInAt?: number;
  startedAt?: number;
  completedAt?: number;
  fee: number;
  paid: boolean;
  vitals?: { bp: string; pulse: number; tempF: number; spo2: number; weightKg: number };
};

export type StaffRole = "Administrator" | "Receptionist" | "Nurse" | "Pharmacist" | "Billing" | "Lab technician";

export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  department: string;
  email: string;
  phone: string;
  status: "active" | "invited" | "suspended";
  lastActive: string;
  joinedOn: string;
  shift: "Morning" | "Evening" | "Night" | "General";
};

export type Consultation = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  complaint: string;
  diagnosis: string;
  notes: string;
  prescriptions: Array<{ medicine: string; dosage: string; frequency: string; duration: string }>;
  followUp?: string;
};

export type ActivityItem = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  kind: "booking" | "checkin" | "consult" | "billing" | "system" | "staff";
};
