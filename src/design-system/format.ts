/** Locale helpers for the Indian market (₹, en-IN grouping, 12-hour clock). */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number) {
  return inr.format(amount);
}

/** ₹1.2L / ₹3.4Cr style compact currency for dashboards. */
export function formatINRCompact(amount: number) {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(amount >= 10_00_00_000 ? 0 : 1)}Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(amount >= 10_00_000 ? 0 : 1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount >= 10_000 ? 0 : 1)}k`;
  return `₹${amount}`;
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-IN");
}

/** Minutes since midnight → "9:30 AM" */
export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

/** "09:30" → minutes since midnight */
export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parse "YYYY-MM-DD" as a local calendar date (no timezone drift). */
export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** "Mon, 16 Nov" */
export function formatDateShort(iso: string) {
  const d = parseISODate(iso);
  return `${DAY[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

/** "16 Nov 2026" */
export function formatDate(iso: string) {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTH[d.getMonth()]} ${d.getFullYear()}`;
}

export function weekdayOf(iso: string) {
  return parseISODate(iso).getDay();
}

export function dayName(index: number, long = false) {
  const longNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return long ? longNames[index]! : DAY[index]!;
}

export function monthName(index: number) {
  return MONTH[index]!;
}

export function ageFrom(dobISO: string, todayISO: string) {
  const dob = parseISODate(dobISO);
  const today = parseISODate(todayISO);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
}
