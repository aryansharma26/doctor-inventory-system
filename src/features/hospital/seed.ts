import {
  clinicDate,
  dateAfter,
  DOCTORS,
  EMPTY_VITALS,
  type HospitalState,
  type Visit,
} from "./types";

export function seedHospital(): HospitalState {
  const today = clinicDate();
  const names = [
    ["Ananya Singh", "9876501001", 28, "Female"],
    ["Vikram Malhotra", "9876501002", 46, "Male"],
    ["Priya Sharma", "9876501003", 34, "Female"],
    ["Arjun Mehta", "9876501004", 52, "Male"],
    ["Ishita Gupta", "9876501005", 23, "Female"],
    ["Rahul Saini", "9876501006", 39, "Male"],
    ["Aisha Khan", "9876501007", 8, "Female"],
    ["Kabir Bansal", "9876501008", 61, "Male"],
    ["Neha Yadav", "9876501009", 31, "Female"],
    ["Rohan Das", "9876501010", 42, "Male"],
  ];
  const patients = names.map(([name, phone, age, gender], i) => ({
    id: `PT-${String(i + 1).padStart(4, "0")}`,
    name: String(name),
    phone: String(phone),
    age: Number(age),
    gender: String(gender),
    allergies: i === 1 ? "Penicillin" : "",
    createdAt: new Date().toISOString(),
  }));
  const medicines = [
    {
      id: "med-1",
      name: "Dolo 650",
      generic: "Paracetamol",
      category: "Analgesic",
      strength: "650 mg",
      stock: 240,
      reorderAt: 50,
      price: 3,
      batch: "DL-2608",
      expiry: dateAfter(365),
    },
    {
      id: "med-2",
      name: "Cetirizine",
      generic: "Cetirizine hydrochloride",
      category: "Antihistamine",
      strength: "10 mg",
      stock: 120,
      reorderAt: 40,
      price: 4,
      batch: "CT-2607",
      expiry: dateAfter(300),
    },
    {
      id: "med-3",
      name: "Pantoprazole",
      generic: "Pantoprazole",
      category: "Gastrointestinal",
      strength: "40 mg",
      stock: 28,
      reorderAt: 40,
      price: 9,
      batch: "PN-2606",
      expiry: dateAfter(220),
    },
    {
      id: "med-4",
      name: "Amlodipine",
      generic: "Amlodipine besylate",
      category: "Cardiovascular",
      strength: "5 mg",
      stock: 180,
      reorderAt: 50,
      price: 5,
      batch: "AM-2609",
      expiry: dateAfter(420),
    },
    {
      id: "med-5",
      name: "Metformin",
      generic: "Metformin hydrochloride",
      category: "Antidiabetic",
      strength: "500 mg",
      stock: 32,
      reorderAt: 50,
      price: 4,
      batch: "MT-2605",
      expiry: dateAfter(180),
    },
    {
      id: "med-6",
      name: "ORS",
      generic: "Oral rehydration salts",
      category: "Rehydration",
      strength: "21.8 g sachet",
      stock: 68,
      reorderAt: 20,
      price: 22,
      batch: "OR-2608",
      expiry: dateAfter(270),
    },
    {
      id: "med-7",
      name: "Vitamin D3",
      generic: "Cholecalciferol",
      category: "Supplement",
      strength: "60,000 IU",
      stock: 16,
      reorderAt: 20,
      price: 32,
      batch: "VD-2604",
      expiry: dateAfter(25),
    },
  ];
  const statuses: Visit["status"][] = [
    "CONSULTING",
    "WAITING",
    "WAITING",
    "BOOKED",
    "WAITING",
    "COMPLETED",
    "BOOKED",
    "COMPLETED",
    "BOOKED",
    "COMPLETED",
  ];
  const reasons = [
    "General consultation",
    "Follow-up consultation",
    "Fever & headache",
    "Routine health check",
    "Throat discomfort",
    "Follow-up review",
    "Child health consultation",
    "Blood pressure review",
    "General consultation",
    "Routine follow-up",
  ];
  const visits: Visit[] = patients.map((p, i) => ({
    id: `visit-demo-${i + 1}`,
    patientId: p.id,
    doctorId: DOCTORS[i === 6 ? 2 : i % 2].id,
    date: today,
    time: `${String(9 + Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`,
    token:
      statuses[i] === "BOOKED" ? "" : `OPD-${String(i + 1).padStart(3, "0")}`,
    source: i % 3 === 0 ? "Online" : i % 3 === 1 ? "Follow-up" : "Walk-in",
    status: statuses[i],
    priority: "Routine",
    reason: reasons[i],
    vitals:
      i < 3
        ? {
            bp: "120/80",
            pulse: "76",
            temperature: "36.8",
            weight: "64",
            spo2: "98",
          }
        : { ...EMPTY_VITALS },
    diagnosis:
      statuses[i] === "COMPLETED"
        ? "Review completed — demonstration record"
        : "",
    notes: "",
    followUp: "",
    prescription:
      i === 5
        ? [
            {
              medicineId: "med-1",
              name: "Dolo 650",
              dosage: "As prescribed",
              frequency: "As prescribed",
              duration: "As prescribed",
              instructions:
                "Demonstration prescription — not clinical guidance",
              quantity: 6,
            },
          ]
        : [],
    fee: DOCTORS[i === 6 ? 2 : i % 2].fee,
    paid: ![3, 6, 8].includes(i),
    paymentMethod: i % 2 ? "Cash" : "UPI",
    dispensedAt: null,
    pharmacyTotal: 0,
    createdAt: new Date().toISOString(),
    completedAt: statuses[i] === "COMPLETED" ? new Date().toISOString() : null,
  }));
  return { patients, visits, medicines, messages: [], invoices: [] };
}
