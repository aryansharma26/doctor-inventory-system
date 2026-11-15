export type Role = "ADMIN" | "RECEPTION" | "DOCTOR" | "PHARMACY";
export type VisitStatus =
  | "BOOKED"
  | "WAITING"
  | "CALLED"
  | "SKIPPED"
  | "CONSULTING"
  | "COMPLETED"
  | "CANCELLED";
export interface StaffSession {
  id: string;
  username: string;
  name: string;
  role: Role;
  doctorId: string | null;
}
export interface TeamMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  recipient: Role | "LOBBY" | "ALL";
  doctorId: string | null;
  text: string;
  kind: "MESSAGE" | "ANNOUNCEMENT";
  visitId: string | null;
  createdAt: string;
  readBy: string[];
}
export interface InvoiceLine {
  medicineId: string;
  name: string;
  batch: string;
  expiry: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
  gross: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}
export interface PharmacyInvoice {
  id: string;
  number: string;
  requestId: string;
  visitId: string | null;
  customerName: string;
  customerPhone: string;
  lines: InvoiceLine[];
  gross: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  createdBy: string;
  cancelledAt: string | null;
  cancelReason: string;
  cashReceived?: number;
  change?: number;
  paymentReference?: string;
}
export type PaymentMethod = "Cash" | "UPI" | "Card";
export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  allergies: string;
  createdAt: string;
}
export interface Prescription {
  medicineId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
}
export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  token: string;
  source: "Walk-in" | "Online" | "Follow-up";
  status: VisitStatus;
  priority: "Routine" | "Urgent";
  reason: string;
  vitals: {
    bp: string;
    pulse: string;
    temperature: string;
    weight: string;
    spo2: string;
  };
  diagnosis: string;
  notes: string;
  prescription: Prescription[];
  followUp: string;
  fee: number;
  paid: boolean;
  paidAt?: string | null;
  paymentMethod: PaymentMethod;
  dispensedAt: string | null;
  pharmacyTotal: number;
  pharmacyPaymentMethod?: PaymentMethod;
  createdAt: string;
  completedAt: string | null;
  checkedInAt?: string;
  calledAt?: string;
  callCount?: number;
  skipReason?: string;
}
export interface Medicine {
  id: string;
  name: string;
  generic: string;
  category: string;
  strength: string;
  stock: number;
  reorderAt: number;
  price: number;
  batch: string;
  expiry: string;
  barcode?: string;
  hsn?: string;
  gstPercent?: number;
  prescriptionRequired?: boolean;
}
export interface HospitalState {
  patients: Patient[];
  visits: Visit[];
  medicines: Medicine[];
  messages: TeamMessage[];
  invoices: PharmacyInvoice[];
}
export const DOCTORS = [
  {
    id: "aarav",
    name: "Dr. Aarav Sharma",
    specialty: "General Physician",
    initials: "AS",
    room: "01",
    fee: 500,
  },
  {
    id: "meera",
    name: "Dr. Meera Kapoor",
    specialty: "Internal Medicine",
    initials: "MK",
    room: "02",
    fee: 600,
  },
  {
    id: "rohan",
    name: "Dr. Rohan Verma",
    specialty: "Paediatrics",
    initials: "RV",
    room: "03",
    fee: 500,
  },
];
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  RECEPTION: "Reception",
  DOCTOR: "Doctor",
  PHARMACY: "Pharmacy",
};
export const STATUS_LABELS: Record<VisitStatus, string> = {
  BOOKED: "Scheduled",
  WAITING: "Waiting",
  CALLED: "Called to room",
  SKIPPED: "On hold",
  CONSULTING: "In consultation",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/",
  RECEPTION: "/reception",
  DOCTOR: "/consultation",
  PHARMACY: "/pharmacy",
};
export function queueSort(a: Visit, b: Visit) {
  return (
    Number(b.priority === "Urgent") - Number(a.priority === "Urgent") ||
    (a.checkedInAt || a.createdAt).localeCompare(b.checkedInAt || b.createdAt)
  );
}
export function canAcknowledge(message: TeamMessage, staff: StaffSession) {
  return (
    message.senderId !== staff.id &&
    (message.recipient === "ALL" ||
      (message.recipient === "LOBBY" && staff.role === "RECEPTION") ||
      (message.recipient === staff.role &&
        (staff.role !== "DOCTOR" ||
          !message.doctorId ||
          message.doctorId === staff.doctorId)))
  );
}
export const EMPTY_VITALS = {
  bp: "",
  pulse: "",
  temperature: "",
  weight: "",
  spo2: "",
};
export function clinicDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function dateAfter(days: number): string {
  return clinicDate(new Date(Date.now() + days * 86400000));
}
export function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
export function paymentDate(visit: Visit) {
  return visit.paidAt ? clinicDate(new Date(visit.paidAt)) : visit.date;
}
export function prettyDate(
  value: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    options ?? { day: "numeric", month: "short", year: "numeric" },
  ).format(new Date(value + "T12:00:00+05:30"));
}
export function prettyTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export function slotsForDay() {
  return Array.from(
    { length: 32 },
    (_, i) =>
      `${String(9 + Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`,
  );
}
