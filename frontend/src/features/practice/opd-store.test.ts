import { beforeEach, describe, expect, it } from "vitest";
import {
  getNextTokenNumber,
  getStoredTickets,
  type OPDTicket,
  saveTicket,
  updateTicketStatus,
} from "./opd-store";

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

(globalThis as any).localStorage = storageMock;
(globalThis as any).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

describe("OPD Queue & Ticket Management Store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with default Philippine demo tickets if storage is empty", () => {
    const tickets = getStoredTickets();
    expect(tickets.length).toBeGreaterThanOrEqual(3);

    const first = tickets[0];
    expect(first.phone.startsWith("+63")).toBe(true);
    expect(first.billing?.paymentMethod).toMatch(/GCASH|MAYA|CARD|CASH/);
    expect(first.billing?.consultationFeePhp).toBe(500);
  });

  it("generates next sequential OPD token number correctly", () => {
    const initialTickets = getStoredTickets();
    const token = getNextTokenNumber();
    expect(token).toBe(`OPD-${initialTickets.length + 101}`);
  });

  it("saves a new OPD ticket at the top of the queue", () => {
    const newTicket: OPDTicket = {
      id: "ticket-new-999",
      tokenNo: "OPD-999",
      patientId: "PAT-PH-999",
      patientName: "Rodrigo Duterte",
      phone: "+639170000000",
      age: 70,
      gender: "Male",
      bloodGroup: "O+",
      allergies: ["Penicillin"],
      vitals: {
        systolicBp: 130,
        diastolicBp: 85,
        heartRate: 72,
        temperatureCelsius: 36.6,
        spO2: 98,
      },
      complaints: "General checkup and hypertension review",
      doctorName: "Dr. Jose Rizal, MD",
      doctorSpecialty: "Internal Medicine",
      checkInTime: new Date().toISOString(),
      status: "WAITING",
      billing: {
        invoiceNo: "INV-2026-999",
        consultationFeePhp: 500,
        vitalsCheckFeePhp: 100,
        labFeePhp: 0,
        medicinesFeePhp: 0,
        totalAmountPhp: 600,
        paymentMethod: "GCASH",
        paymentStatus: "PAID",
        gcashRefNo: "GCASH-998877",
      },
    };

    const updated = saveTicket(newTicket);
    expect(updated[0].id).toBe("ticket-new-999");
    expect(updated[0].patientName).toBe("Rodrigo Duterte");

    // Check re-read from storage
    const reRead = getStoredTickets();
    expect(reRead[0].id).toBe("ticket-new-999");
  });

  it("updates an existing ticket in-place", () => {
    const tickets = getStoredTickets();
    const target = { ...tickets[0], patientName: "Maria Santos-Cruz" };

    const updated = saveTicket(target);
    const found = updated.find((t) => t.id === target.id);
    expect(found?.patientName).toBe("Maria Santos-Cruz");
  });

  it("updates ticket status from WAITING to IN_CONSULTATION and COMPLETED with clinical notes", () => {
    const tickets = getStoredTickets();
    const targetId = tickets[1].id;

    // Transition to IN_CONSULTATION
    let updated = updateTicketStatus(targetId, "IN_CONSULTATION");
    let ticket = updated.find((t) => t.id === targetId);
    expect(ticket?.status).toBe("IN_CONSULTATION");

    // Transition to COMPLETED with prescription and advice
    const nowIso = new Date().toISOString();
    updated = updateTicketStatus(targetId, "COMPLETED", {
      diagnosis: "Essential Hypertension Stage 1",
      doctorAdvice: "Low sodium diet, brisk walking 30 mins daily",
      consultationCompletedAt: nowIso,
      prescribedMedicines: [
        {
          id: "rx-1",
          name: "Amlodipine 5mg",
          dosage: "1 Tablet",
          frequency: "0-0-1",
          timing: "Night",
          duration: "30 Days",
        },
      ],
    });

    ticket = updated.find((t) => t.id === targetId);
    expect(ticket?.status).toBe("COMPLETED");
    expect(ticket?.diagnosis).toBe("Essential Hypertension Stage 1");
    expect(ticket?.prescribedMedicines).toHaveLength(1);
    expect(ticket?.prescribedMedicines?.[0].name).toBe("Amlodipine 5mg");
    expect(ticket?.consultationCompletedAt).toBe(nowIso);
  });
});
