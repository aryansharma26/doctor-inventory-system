export interface OPDTicket {
  id: string;
  tokenNo: string;
  patientId: string;
  patientName: string;
  phone: string; // +63 format
  age: number;
  gender: string;
  bloodGroup: string;
  area?: string;
  allergies: string[];
  vitals: {
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    temperatureCelsius?: number;
    weightKg?: number;
    spO2?: number;
  };
  complaints: string;
  doctorName: string;
  doctorSpecialty: string;
  checkInTime: string;
  status: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";

  // Doctor consultation data
  diagnosis?: string;
  prescribedMedicines?: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    timing: string;
    duration: string;
    stockAvailable?: number;
    notes?: string;
  }>;
  doctorAdvice?: string;
  followUpDate?: string; // YYYY-MM-DD
  consultationCompletedAt?: string;

  // Lab Orders
  labOrders?: Array<{
    id: string;
    testName: string;
    status: "ORDERED" | "COMPLETED" | "CANCELLED";
    pricePhp: number;
    orderedAt: string;
    reportUrl?: string;
    notes?: string;
  }>;

  // Billing & Payment Details (Philippines PHP ₱)
  billing?: {
    invoiceNo: string;
    consultationFeePhp: number;
    vitalsCheckFeePhp: number;
    labFeePhp: number;
    medicinesFeePhp: number;
    totalAmountPhp: number;
    paymentMethod: "GCASH" | "MAYA" | "CARD" | "CASH";
    paymentStatus: "PENDING" | "PAID";
    paidAt?: string;
    gcashRefNo?: string;
  };

  // Reminder details
  reminderSent?: boolean;
  reminderSentAt?: string;
}

const STORAGE_KEY = "doc_inventory_opd_tickets_ph_v2";

const INITIAL_DEMO_PARCHIS_PH: OPDTicket[] = [
  {
    id: "ticket-101",
    tokenNo: "OPD-101",
    patientId: "PAT-PH-001",
    patientName: "Maria Santos",
    phone: "+639171234567",
    age: 32,
    gender: "Female",
    bloodGroup: "O+",
    allergies: ["Penicillin", "Crustaceans"],
    vitals: {
      systolicBp: 118,
      diastolicBp: 78,
      heartRate: 74,
      temperatureCelsius: 37.1,
      weightKg: 58,
      spO2: 99,
    },
    complaints: "High fever since 2 days, sore throat and dry cough",
    doctorName: "Dr. Jose Rizal, MD",
    doctorSpecialty: "Internal Medicine & General Practice",
    checkInTime: new Date(Date.now() - 45 * 60000).toISOString(),
    status: "IN_CONSULTATION",
    billing: {
      invoiceNo: "INV-2026-001",
      consultationFeePhp: 500,
      vitalsCheckFeePhp: 100,
      labFeePhp: 0,
      medicinesFeePhp: 0,
      totalAmountPhp: 600,
      paymentMethod: "GCASH",
      paymentStatus: "PAID",
      paidAt: new Date(Date.now() - 40 * 60000).toISOString(),
      gcashRefNo: "GCASH-98213749",
    },
  },
  {
    id: "ticket-102",
    tokenNo: "OPD-102",
    patientId: "PAT-PH-002",
    patientName: "Juan Dela Cruz",
    phone: "+639189876543",
    age: 45,
    gender: "Male",
    bloodGroup: "A+",
    allergies: ["Sulfa Drugs"],
    vitals: {
      systolicBp: 140,
      diastolicBp: 90,
      heartRate: 82,
      temperatureCelsius: 36.8,
      weightKg: 78,
      spO2: 97,
    },
    complaints: "Hypertension check-up & dizziness on exertion",
    doctorName: "Dr. Maria Santos, MD",
    doctorSpecialty: "Cardiology & Internal Medicine",
    checkInTime: new Date(Date.now() - 20 * 60000).toISOString(),
    status: "WAITING",
    billing: {
      invoiceNo: "INV-2026-002",
      consultationFeePhp: 500,
      vitalsCheckFeePhp: 100,
      labFeePhp: 0,
      medicinesFeePhp: 0,
      totalAmountPhp: 600,
      paymentMethod: "MAYA",
      paymentStatus: "PAID",
      paidAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
  },
  {
    id: "ticket-100",
    tokenNo: "OPD-100",
    patientId: "PAT-PH-004",
    patientName: "Angelica Reyes",
    phone: "+639995551234",
    age: 27,
    gender: "Female",
    bloodGroup: "B+",
    allergies: ["Aspirin"],
    vitals: {
      systolicBp: 112,
      diastolicBp: 74,
      heartRate: 70,
      temperatureCelsius: 36.5,
      weightKg: 52,
      spO2: 99,
    },
    complaints: "Routine consultation & iron deficiency follow-up",
    doctorName: "Dr. Jose Rizal, MD",
    doctorSpecialty: "Internal Medicine",
    checkInTime: new Date(Date.now() - 120 * 60000).toISOString(),
    status: "COMPLETED",
    diagnosis:
      "Microcytic Hypochromic Anemia & Upper Respiratory Tract Infection",
    doctorAdvice:
      "Increase oral iron intake (FeSO4), drink 3L water daily, complete 5 days antibiotics.",
    prescribedMedicines: [
      {
        id: "m1",
        name: "Biogesic Paracetamol 500mg",
        dosage: "1 Tablet",
        frequency: "1-0-1",
        timing: "After Meals",
        duration: "5 Days",
        stockAvailable: 150,
      },
      {
        id: "m2",
        name: "Amoxil Amoxicillin 500mg",
        dosage: "1 Capsule",
        frequency: "1-1-1",
        timing: "After Meals",
        duration: "7 Days",
        stockAvailable: 85,
      },
    ],
    labOrders: [
      {
        id: "lab-1",
        testName: "Complete Blood Count (CBC) with Platelet",
        status: "COMPLETED",
        pricePhp: 350,
        orderedAt: new Date(Date.now() - 100 * 60000).toISOString(),
        reportUrl: "https://example.com/cbc-report.pdf",
        notes: "Hemoglobin: 10.5 g/dL (Mild Anemia)",
      },
    ],
    billing: {
      invoiceNo: "INV-2026-000",
      consultationFeePhp: 500,
      vitalsCheckFeePhp: 100,
      labFeePhp: 350,
      medicinesFeePhp: 280,
      totalAmountPhp: 1230,
      paymentMethod: "GCASH",
      paymentStatus: "PAID",
      paidAt: new Date(Date.now() - 115 * 60000).toISOString(),
      gcashRefNo: "GCASH-10293847",
    },
    followUpDate: new Date().toISOString().split("T")[0], // Scheduled today for reminder demo!
    consultationCompletedAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

export function getStoredTickets(): OPDTicket[] {
  if (typeof window === "undefined") {
    return INITIAL_DEMO_PARCHIS_PH;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(INITIAL_DEMO_PARCHIS_PH),
      );
      return INITIAL_DEMO_PARCHIS_PH;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_DEMO_PARCHIS_PH;
  }
}

export function saveTicket(ticket: OPDTicket): OPDTicket[] {
  if (typeof window === "undefined") return [ticket];
  const current = getStoredTickets();
  const existingIdx = current.findIndex((p) => p.id === ticket.id);
  let updated: OPDTicket[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = ticket;
  } else {
    updated = [ticket, ...current];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("opd-store-update"));
  return updated;
}

export function updateTicketStatus(
  id: string,
  status: OPDTicket["status"],
  updates?: Partial<OPDTicket>,
): OPDTicket[] {
  if (typeof window === "undefined") return [];
  const current = getStoredTickets();
  const updated = current.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        status,
        ...updates,
      };
    }
    return p;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("opd-store-update"));
  return updated;
}

export function getNextTokenNumber(): string {
  const tickets = getStoredTickets();
  const count = tickets.length + 101;
  return `OPD-${count}`;
}

// Ensure live cross-tab & dual-monitor sync (e.g., Tab A Reception updates Tab B Doctor Desk automatically)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      window.dispatchEvent(new Event("opd-store-update"));
    }
  });
}
