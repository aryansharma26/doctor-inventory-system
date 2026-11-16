import type { ActivityItem, Appointment, Consultation, Patient, StaffMember } from "./types";

/*
 * Small, hand-written data set: 7 patients, 3 doctors (see catalog.ts).
 * "Today" is Mon 16 Nov 2026, 11:20 AM:
 *   Dr. Arjun Mehta  AM-01 Rajesh Kulkarni (in consultation), AM-02 Priya Deshmukh (waiting)
 *   Dr. Meera Iyer   MI-01 Amit Joshi (completed), MI-02 Sneha Patil (waiting)
 *   Dr. Kavya Reddy  KR-01 Ishaan Nair (completed), KR-02 Aarav Sharma (5:15 PM, not arrived)
 *   Kavita Shinde has a visit with Dr. Arjun tomorrow.
 */

/* ---------------------------------------------------------------- Patients */

export const PATIENTS: Patient[] = [
  {
    id: "p-1001",
    uhid: "AMH-240101",
    name: "Sneha Patil",
    gender: "Female",
    dob: "1990-06-14",
    phone: "9822012345",
    email: "sneha.patil@gmail.com",
    bloodGroup: "B+",
    city: "Pune",
    address: "12, Shanti Apartments, Kothrud",
    abhaId: "91-4521-3387-1290",
    allergies: ["Penicillin"],
    conditions: [],
    emergencyContact: { name: "Rohit Patil", relation: "Spouse", phone: "9822054321" },
    registeredOn: "2025-03-02",
    tags: ["Insurance"],
  },
  {
    id: "p-1002",
    uhid: "AMH-240102",
    name: "Rajesh Kulkarni",
    gender: "Male",
    dob: "1968-01-22",
    phone: "9890054321",
    bloodGroup: "O+",
    city: "Pune",
    address: "4, Ganesh Residency, Karve Nagar",
    allergies: [],
    conditions: ["Type 2 diabetes", "Hypertension"],
    emergencyContact: { name: "Asha Kulkarni", relation: "Spouse", phone: "9890011223" },
    registeredOn: "2024-08-19",
    tags: ["Chronic care", "Senior citizen"],
  },
  {
    id: "p-1003",
    uhid: "AMH-240103",
    name: "Aarav Sharma",
    gender: "Male",
    dob: "2021-09-05",
    phone: "9765098765",
    email: "priya.sharma@gmail.com",
    bloodGroup: "A+",
    city: "Pune",
    address: "201, Sai Heights, Erandwane",
    allergies: [],
    conditions: [],
    emergencyContact: { name: "Priya Sharma", relation: "Mother", phone: "9765098765" },
    registeredOn: "2021-09-20",
    tags: [],
  },
  {
    id: "p-1004",
    uhid: "AMH-240104",
    name: "Priya Deshmukh",
    gender: "Female",
    dob: "1985-11-03",
    phone: "9823067890",
    email: "priya.deshmukh@gmail.com",
    bloodGroup: "A+",
    city: "Pune",
    address: "7, Laxmi Society, Bavdhan",
    allergies: [],
    conditions: ["Hypothyroidism"],
    emergencyContact: { name: "Sanjay Deshmukh", relation: "Spouse", phone: "9823011122" },
    registeredOn: "2026-11-16",
    tags: ["New"],
  },
  {
    id: "p-1005",
    uhid: "AMH-240105",
    name: "Amit Joshi",
    gender: "Male",
    dob: "1979-04-27",
    phone: "9881023456",
    bloodGroup: "B+",
    city: "Pune",
    address: "18, Om Heights, Erandwane",
    abhaId: "91-7710-2245-8803",
    allergies: ["Sulfa drugs"],
    conditions: ["Dyslipidaemia"],
    emergencyContact: { name: "Meena Joshi", relation: "Spouse", phone: "9881077788" },
    registeredOn: "2025-07-11",
    tags: ["Insurance"],
  },
  {
    id: "p-1006",
    uhid: "AMH-240106",
    name: "Ishaan Nair",
    gender: "Male",
    dob: "2019-02-18",
    phone: "9970045678",
    email: "anjali.nair@gmail.com",
    bloodGroup: "O+",
    city: "Pune",
    address: "33, Krishna Apartments, Kothrud",
    allergies: ["Peanuts"],
    conditions: ["Asthma"],
    emergencyContact: { name: "Anjali Nair", relation: "Mother", phone: "9970045678" },
    registeredOn: "2019-03-01",
    tags: [],
  },
  {
    id: "p-1007",
    uhid: "AMH-240107",
    name: "Kavita Shinde",
    gender: "Female",
    dob: "1958-08-09",
    phone: "9767034567",
    bloodGroup: "AB+",
    city: "Pune",
    address: "2, Sai Residency, Warje",
    allergies: [],
    conditions: ["Osteoarthritis", "Hypertension"],
    emergencyContact: { name: "Vikas Shinde", relation: "Son", phone: "9767099887" },
    registeredOn: "2023-12-05",
    tags: ["Chronic care", "Senior citizen"],
  },
];

/* ------------------------------------------------------------ Appointments */

const H = "h-aarogya";
const t = (h: number, m: number) => h * 60 + m;

export const APPOINTMENTS: Appointment[] = [
  // Past visits
  { id: "a-1", token: 4, patientId: "p-1002", doctorId: "d-arjun", departmentId: "general-medicine", hospitalId: H, date: "2026-09-14", start: t(10, 30), duration: 15, visitType: "new", channel: "walk-in", status: "completed", reason: "Diabetes review", checkedInAt: t(10, 15), startedAt: t(10, 32), completedAt: t(10, 46), fee: 700, paid: true, vitals: { bp: "146/92", pulse: 82, tempF: 98.2, spo2: 97, weightKg: 81 } },
  { id: "a-2", token: 6, patientId: "p-1002", doctorId: "d-arjun", departmentId: "general-medicine", hospitalId: H, date: "2026-10-16", start: t(11, 0), duration: 15, visitType: "follow-up", channel: "phone", status: "completed", reason: "BP follow-up", checkedInAt: t(10, 48), startedAt: t(11, 2), completedAt: t(11, 15), fee: 400, paid: true, vitals: { bp: "138/88", pulse: 78, tempF: 98.1, spo2: 98, weightKg: 80 } },
  { id: "a-3", token: 3, patientId: "p-1002", doctorId: "d-meera", departmentId: "cardiology", hospitalId: H, date: "2026-10-26", start: t(10, 40), duration: 20, visitType: "new", channel: "online", status: "completed", reason: "ECG review", checkedInAt: t(10, 25), startedAt: t(10, 42), completedAt: t(11, 0), fee: 1200, paid: true },
  { id: "a-4", token: 2, patientId: "p-1001", doctorId: "d-arjun", departmentId: "general-medicine", hospitalId: H, date: "2026-11-02", start: t(9, 45), duration: 15, visitType: "new", channel: "online", status: "completed", reason: "Fever for 3 days", checkedInAt: t(9, 35), startedAt: t(9, 47), completedAt: t(10, 0), fee: 700, paid: true, vitals: { bp: "112/74", pulse: 92, tempF: 100.6, spo2: 98, weightKg: 58 } },
  { id: "a-5", token: 5, patientId: "p-1003", doctorId: "d-kavya", departmentId: "paediatrics", hospitalId: H, date: "2026-10-12", start: t(17, 0), duration: 15, visitType: "new", channel: "online", status: "completed", reason: "Cough at night", checkedInAt: t(16, 50), startedAt: t(17, 1), completedAt: t(17, 14), fee: 800, paid: true, vitals: { bp: "-", pulse: 104, tempF: 99.1, spo2: 98, weightKg: 18 } },

  { id: "a-14", token: 3, patientId: "p-1007", doctorId: "d-arjun", departmentId: "general-medicine", hospitalId: H, date: "2026-10-20", start: t(10, 0), duration: 15, visitType: "new", channel: "walk-in", status: "completed", reason: "Knee pain", checkedInAt: t(9, 50), startedAt: t(10, 1), completedAt: t(10, 15), fee: 700, paid: true, vitals: { bp: "150/94", pulse: 80, tempF: 98.0, spo2: 97, weightKg: 68 } },

  // Today
  { id: "a-6", token: 1, patientId: "p-1002", doctorId: "d-arjun", departmentId: "general-medicine", hospitalId: H, date: "2026-11-16", start: t(11, 0), duration: 15, visitType: "follow-up", channel: "walk-in", status: "in-consultation", reason: "Diabetes and BP review", checkedInAt: t(10, 45), startedAt: t(11, 5), fee: 400, paid: true, vitals: { bp: "134/86", pulse: 76, tempF: 98.0, spo2: 98, weightKg: 79 } },
  { id: "a-7", token: 2, patientId: "p-1001", doctorId: "d-meera", departmentId: "cardiology", hospitalId: H, date: "2026-11-16", start: t(11, 20), duration: 20, visitType: "new", channel: "online", status: "waiting", reason: "Palpitations", checkedInAt: t(11, 5), fee: 1200, paid: false, vitals: { bp: "118/76", pulse: 96, tempF: 98.4, spo2: 99, weightKg: 58 } },
  { id: "a-8", token: 2, patientId: "p-1003", doctorId: "d-kavya", departmentId: "paediatrics", hospitalId: H, date: "2026-11-16", start: t(17, 15), duration: 15, visitType: "new", channel: "online", status: "scheduled", reason: "Vaccination, 5 years", fee: 800, paid: true },

  { id: "a-10", token: 2, patientId: "p-1004", doctorId: "d-arjun", departmentId: "general-medicine", hospitalId: H, date: "2026-11-16", start: t(11, 30), duration: 15, visitType: "new", channel: "walk-in", status: "waiting", reason: "Tiredness and weight gain", checkedInAt: t(11, 12), fee: 700, paid: false },
  { id: "a-11", token: 1, patientId: "p-1005", doctorId: "d-meera", departmentId: "cardiology", hospitalId: H, date: "2026-11-16", start: t(10, 0), duration: 20, visitType: "follow-up", channel: "online", status: "completed", reason: "Cholesterol review", checkedInAt: t(9, 50), startedAt: t(10, 2), completedAt: t(10, 20), fee: 700, paid: true, vitals: { bp: "128/84", pulse: 74, tempF: 98.2, spo2: 98, weightKg: 84 } },
  { id: "a-12", token: 1, patientId: "p-1006", doctorId: "d-kavya", departmentId: "paediatrics", hospitalId: H, date: "2026-11-16", start: t(10, 15), duration: 15, visitType: "follow-up", channel: "phone", status: "completed", reason: "Wheezing at night", checkedInAt: t(10, 5), startedAt: t(10, 16), completedAt: t(10, 30), fee: 400, paid: true, vitals: { bp: "-", pulse: 98, tempF: 98.6, spo2: 97, weightKg: 24 } },

  // Upcoming
  { id: "a-13", token: 1, patientId: "p-1007", doctorId: "d-arjun", departmentId: "general-medicine", hospitalId: H, date: "2026-11-17", start: t(9, 45), duration: 15, visitType: "follow-up", channel: "phone", status: "scheduled", reason: "Knee pain and BP check", fee: 400, paid: false },
  { id: "a-9", token: 1, patientId: "p-1002", doctorId: "d-arjun", departmentId: "general-medicine", hospitalId: H, date: "2026-11-30", start: t(10, 0), duration: 15, visitType: "follow-up", channel: "phone", status: "scheduled", reason: "Sugar report review", fee: 400, paid: false },
];

/* ----------------------------------------------------------- Consultations */

export const CONSULTATIONS: Consultation[] = [
  {
    id: "c-a-1", patientId: "p-1002", doctorId: "d-arjun", date: "2026-09-14", complaint: "Diabetes review",
    diagnosis: "Type 2 diabetes mellitus, poorly controlled", notes: "HbA1c 8.4%. Diet counselling given. Walk 30 minutes daily.",
    prescriptions: [{ medicine: "Metformin 500 mg", dosage: "1 tablet", frequency: "Twice daily after food", duration: "30 days" }],
    followUp: "2026-10-16",
  },
  {
    id: "c-a-2", patientId: "p-1002", doctorId: "d-arjun", date: "2026-10-16", complaint: "BP follow-up",
    diagnosis: "Essential hypertension", notes: "BP better. Continue medicines. Reduce salt.",
    prescriptions: [
      { medicine: "Metformin 500 mg", dosage: "1 tablet", frequency: "Twice daily after food", duration: "30 days" },
      { medicine: "Telmisartan 40 mg", dosage: "1 tablet", frequency: "Once daily morning", duration: "30 days" },
    ],
    followUp: "2026-11-16",
  },
  {
    id: "c-a-3", patientId: "p-1002", doctorId: "d-meera", date: "2026-10-26", complaint: "ECG review",
    diagnosis: "Normal ECG, mild hypertensive heart changes", notes: "Echo advised in 6 months.",
    prescriptions: [{ medicine: "Telmisartan 40 mg", dosage: "1 tablet", frequency: "Once daily morning", duration: "30 days" }],
  },
  {
    id: "c-a-4", patientId: "p-1001", doctorId: "d-arjun", date: "2026-11-02", complaint: "Fever for 3 days",
    diagnosis: "Viral fever", notes: "Plenty of fluids and rest. Return if fever lasts beyond 5 days.",
    prescriptions: [{ medicine: "Paracetamol 650 mg", dosage: "1 tablet", frequency: "Thrice daily after food", duration: "3 days" }],
  },
  {
    id: "c-a-5", patientId: "p-1003", doctorId: "d-kavya", date: "2026-10-12", complaint: "Cough at night",
    diagnosis: "Viral upper respiratory infection", notes: "Steam inhalation. Honey with warm water.",
    prescriptions: [{ medicine: "Cetirizine syrup 5 ml", dosage: "2.5 ml", frequency: "Once daily at night", duration: "5 days" }],
  },
  {
    id: "c-a-14", patientId: "p-1007", doctorId: "d-arjun", date: "2026-10-20", complaint: "Knee pain",
    diagnosis: "Osteoarthritis of both knees", notes: "Knee strengthening exercises. Avoid squatting.",
    prescriptions: [
      { medicine: "Aceclofenac 100 mg", dosage: "1 tablet", frequency: "Twice daily after food", duration: "5 days" },
      { medicine: "Amlodipine 5 mg", dosage: "1 tablet", frequency: "Once daily", duration: "30 days" },
    ],
    followUp: "2026-11-17",
  },
  {
    id: "c-a-11", patientId: "p-1005", doctorId: "d-meera", date: "2026-11-16", complaint: "Cholesterol review",
    diagnosis: "Dyslipidaemia, improving", notes: "LDL down from 168 to 132. Continue statin, recheck lipids in 3 months.",
    prescriptions: [{ medicine: "Atorvastatin 20 mg", dosage: "1 tablet", frequency: "Once daily at night", duration: "90 days" }],
    followUp: "2027-02-15",
  },
  {
    id: "c-a-12", patientId: "p-1006", doctorId: "d-kavya", date: "2026-11-16", complaint: "Wheezing at night",
    diagnosis: "Mild intermittent asthma", notes: "Inhaler technique shown to mother. Avoid dust and smoke.",
    prescriptions: [{ medicine: "Salbutamol inhaler 100 mcg", dosage: "2 puffs", frequency: "When needed", duration: "30 days" }],
    followUp: "2026-12-14",
  },
];

/* ------------------------------------------------------------------- Staff */

export const STAFF: StaffMember[] = [
  { id: "s-1", name: "Neha Sawant", role: "Administrator", department: "Administration", email: "neha.sawant@aarogyahospital.in", phone: "9822011001", status: "active", lastActive: "Active now", joinedOn: "2019-04-01", shift: "General" },
  { id: "s-2", name: "Pooja Kale", role: "Receptionist", department: "Front desk", email: "pooja.kale@aarogyahospital.in", phone: "9822011002", status: "active", lastActive: "Active now", joinedOn: "2021-06-14", shift: "Morning" },
  { id: "s-3", name: "Mary Thomas", role: "Nurse", department: "OPD", email: "mary.thomas@aarogyahospital.in", phone: "9822011004", status: "active", lastActive: "10 min ago", joinedOn: "2015-08-03", shift: "Morning" },
];

/* ---------------------------------------------------------------- Activity */

export const HOSPITAL_ACTIVITY: ActivityItem[] = [
  { id: "ac-0", actor: "Pooja Kale", action: "registered and checked in", target: "Priya Deshmukh · token AM-02 with Dr. Arjun Mehta", time: "8 min ago", kind: "checkin" },
  { id: "ac-1", actor: "Pooja Kale", action: "checked in", target: "Sneha Patil · token MI-02 with Dr. Meera Iyer", time: "15 min ago", kind: "checkin" },
  { id: "ac-2", actor: "Dr. Arjun Mehta", action: "started consultation", target: "Rajesh Kulkarni", time: "15 min ago", kind: "consult" },
  { id: "ac-4", actor: "Dr. Kavya Reddy", action: "completed consultation", target: "Ishaan Nair", time: "50 min ago", kind: "consult" },
  { id: "ac-5", actor: "Dr. Meera Iyer", action: "completed consultation", target: "Amit Joshi", time: "1 h ago", kind: "consult" },
  { id: "ac-3", actor: "Online booking", action: "new appointment", target: "Aarav Sharma with Dr. Kavya Reddy, 5:15 PM", time: "1 h ago", kind: "booking" },
];
