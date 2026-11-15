import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { hospitalDb as db, readState } from "./database";
import { HospitalError } from "./errors";
import { invoiceLine, invoiceTotals, roundMoney } from "./invoice-math";
export { HospitalError } from "./errors";
export { isDemo, readState } from "./database";
export { sessionRole, requireRole } from "./auth";
import {
  clinicDate,
  dateAfter,
  DOCTORS,
  EMPTY_VITALS,
  slotsForDay,
  type HospitalState,
  type Role,
  type Visit,
  type StaffSession,
  type TeamMessage,
  queueSort,
  canAcknowledge,
} from "./types";

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const internal = new URL(request.url);
  const expected =
    process.env.HOSPITAL_PUBLIC_ORIGIN ||
    `${internal.protocol}//${request.headers.get("host") || internal.host}`;
  if (origin !== expected)
    throw new HospitalError("Cross-origin requests are not allowed.", 403);
}
const text = (max = 300) => z.string().trim().max(max);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(new Date(v + "T12:00:00+05:30").getTime()) &&
      clinicDate(new Date(v + "T12:00:00+05:30")) === v,
    "Choose a valid date",
  );
const method = z.enum(["Cash", "UPI", "Card"]);
const doctorId = z.enum(["aarav", "meera", "rohan"]);
const patientInput = z.object({
  name: text(100).min(2),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  age: z.number().int().min(0).max(120),
  gender: z.enum(["Female", "Male", "Other"]),
  allergies: text(500).default(""),
});
export const bookingSchema = patientInput.extend({
  doctorId,
  date,
  time: z.enum(slotsForDay() as [string, ...string[]]),
  reason: text(1000).min(2),
  consent: z.literal(true),
});
export const manageBookingSchema = z.object({
  reference: text(100).min(4),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  operation: z.enum(["status", "cancel", "reschedule"]).default("status"),
  date: date.optional(),
  time: z.enum(slotsForDay() as [string, ...string[]]).optional(),
});
export function manageBooking(input: z.infer<typeof manageBookingSchema>) {
  const operate = (state: HospitalState) => {
    const visit = state.visits.find(
      (v) =>
        v.id === input.reference &&
        v.source === "Online" &&
        state.patients.some(
          (p) => p.id === v.patientId && p.phone === input.phone,
        ),
    );
    if (!visit)
      throw new HospitalError(
        "No booking matches that reference and mobile number.",
        404,
      );
    if (input.operation !== "status") {
      if (visit.status !== "BOOKED")
        throw new HospitalError(
          "This visit is already checked in, completed or cancelled. Contact reception for changes.",
          409,
        );
      if (input.operation === "cancel") visit.status = "CANCELLED";
      else {
        if (!input.date || !input.time)
          throw new HospitalError("Choose a new date and time.");
        if (input.date !== visit.date || input.time !== visit.time) {
          if (!availableSlots(visit.doctorId, input.date).includes(input.time))
            throw new HospitalError(
              "That time is no longer available. Choose another slot.",
              409,
            );
          if (
            state.visits.some(
              (v) =>
                v.id !== visit.id &&
                v.patientId === visit.patientId &&
                v.doctorId === visit.doctorId &&
                v.date === input.date &&
                v.status !== "CANCELLED",
            )
          )
            throw new HospitalError(
              "You already have another visit with this doctor on that date.",
              409,
            );
          visit.date = input.date;
          visit.time = input.time;
        }
      }
    }
    const waiting = state.visits
      .filter(
        (v) =>
          v.date === visit.date &&
          v.doctorId === visit.doctorId &&
          v.status === "WAITING",
      )
      .sort(queueSort);
    const position = waiting.findIndex((v) => v.id === visit.id);
    return {
      reference: visit.id,
      patientName: state.patients.find((p) => p.id === visit.patientId)!.name,
      doctorId: visit.doctorId,
      date: visit.date,
      time: visit.time,
      status: visit.status,
      token: visit.token,
      fee: visit.fee,
      paid: visit.paid,
      queuePosition: position < 0 ? null : position + 1,
    };
  };
  return input.operation === "status"
    ? operate(readState())
    : transaction(operate);
}
const measured = (min: number, max: number) =>
  text(8).refine(
    (v) =>
      !v ||
      (Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max),
    `Measured value must be between ${min} and ${max}`,
  );
const vitals = z.object({
  bp: text(10).refine(
    (v) => !v || /^\d{2,3}\/\d{2,3}$/.test(v),
    "Use BP format 120/80",
  ),
  pulse: measured(20, 250),
  temperature: measured(30, 45),
  weight: measured(0.1, 500),
  spo2: measured(1, 100),
});
const prescription = z.object({
  medicineId: text(100).min(1),
  name: text(150).min(1),
  dosage: text(100).min(1),
  frequency: text(100).min(1),
  duration: text(100).min(1),
  instructions: text(300),
  quantity: z.number().int().min(1).max(1000),
});
export const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("message"),
    recipient: z.enum([
      "ADMIN",
      "RECEPTION",
      "DOCTOR",
      "PHARMACY",
      "LOBBY",
      "ALL",
    ]),
    doctorId: z.union([doctorId, z.literal("")]).default(""),
    text: text(1500).min(1),
    kind: z.enum(["MESSAGE", "ANNOUNCEMENT"]).default("MESSAGE"),
    visitId: text(100).default(""),
  }),
  z.object({ action: z.literal("ack"), messageId: text(100) }),
  z.object({ action: z.literal("callNext"), doctorId }),
  z.object({ action: z.literal("call"), visitId: text(100) }),
  z.object({ action: z.literal("recall"), visitId: text(100) }),
  z.object({
    action: z.literal("hold"),
    visitId: text(100),
    reason: text(200).default("Patient not present"),
  }),
  z.object({ action: z.literal("returnToQueue"), visitId: text(100) }),
  z.object({
    action: z.literal("invoice"),
    requestId: text(100).min(8),
    visitId: text(100).default(""),
    customerName: text(100).min(2),
    customerPhone: z.union([z.string().regex(/^[6-9]\d{9}$/), z.literal("")]),
    paymentMethod: method,
    cashReceived: z.number().min(0).max(100000000).optional(),
    paymentReference: text(100).default(""),
    lines: z
      .array(
        z.object({
          medicineId: text(100),
          quantity: z.number().int().min(1).max(10000),
          discountPercent: z.number().min(0).max(100).default(0),
        }),
      )
      .min(1)
      .max(100),
  }),
  z.object({
    action: z.literal("cancelInvoice"),
    invoiceId: text(100),
    reason: text(300).min(3),
  }),
  patientInput.extend({
    action: z.literal("register"),
    doctorId,
    reason: text(1000).min(2),
    priority: z.enum(["Routine", "Urgent"]),
    vitals,
    paid: z.boolean(),
    paymentMethod: method,
  }),
  z.object({ action: z.literal("checkin"), visitId: text(100) }),
  z.object({
    action: z.literal("updateIntake"),
    visitId: text(100),
    vitals,
    allergies: text(500),
  }),
  z.object({ action: z.literal("cancel"), visitId: text(100) }),
  z.object({ action: z.literal("start"), visitId: text(100) }),
  z.object({
    action: z.literal("consult"),
    visitId: text(100),
    diagnosis: text(2000),
    notes: text(5000),
    prescription: z.array(prescription).max(30),
    followUp: z.union([date, z.literal("")]),
    complete: z.boolean(),
  }),
  z.object({
    action: z.literal("pay"),
    visitId: text(100),
    paymentMethod: method,
  }),
  z.object({
    action: z.literal("dispense"),
    visitId: text(100),
    paymentMethod: method,
  }),
  z.object({
    action: z.literal("restock"),
    medicineId: text(100),
    quantity: z.number().int().min(1).max(100000),
  }),
  z.object({
    action: z.literal("medicine"),
    name: text(100).min(2),
    generic: text(100).min(2),
    category: text(60).min(2),
    strength: text(60).min(1),
    stock: z.number().int().min(0).max(100000),
    price: z.number().min(0).max(100000),
    reorderAt: z.number().int().min(0).max(10000),
    batch: text(60).min(1),
    expiry: date,
    barcode: text(100).default(""),
    hsn: text(20).default(""),
    gstPercent: z.number().min(0).max(40).default(0),
    prescriptionRequired: z.boolean().default(true),
  }),
]);
type Action = z.infer<typeof actionSchema>;
function transaction<T>(change: (state: HospitalState) => T): T {
  const conn = db();
  conn.exec("BEGIN IMMEDIATE");
  try {
    const state = readState();
    const result = change(state);
    conn
      .prepare("UPDATE hospital SET state = ? WHERE id = 1")
      .run(JSON.stringify(state));
    conn.exec("COMMIT");
    return result;
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
}
function upsertPatient(
  state: HospitalState,
  input: z.infer<typeof patientInput>,
  updateExisting = true,
) {
  const existing = state.patients.find(
    (p) =>
      p.phone === input.phone &&
      p.name.toLowerCase() === input.name.toLowerCase(),
  );
  if (existing) {
    if (updateExisting) Object.assign(existing, input);
    return existing;
  }
  const patient = {
    ...input,
    id: `PT-${randomBytes(8).toString("hex").toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  state.patients.unshift(patient);
  return patient;
}
function token(state: HospitalState) {
  const max = Math.max(
    0,
    ...state.visits
      .filter((v) => v.date === clinicDate())
      .map((v) => Number(v.token.replace("OPD-", "")) || 0),
  );
  return `OPD-${String(max + 1).padStart(3, "0")}`;
}
function newVisit(patientId: string, id: string): Visit {
  return {
    id: `AP-${randomBytes(8).toString("hex").toUpperCase()}`,
    patientId,
    doctorId: id,
    date: clinicDate(),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    token: "",
    source: "Walk-in",
    status: "WAITING",
    priority: "Routine",
    reason: "",
    vitals: { ...EMPTY_VITALS },
    diagnosis: "",
    notes: "",
    prescription: [],
    followUp: "",
    fee: DOCTORS.find((d) => d.id === id)!.fee,
    paid: false,
    paymentMethod: "Cash",
    dispensedAt: null,
    pharmacyTotal: 0,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}
export function availableSlots(doctor: string, day: string) {
  if (
    !DOCTORS.some((d) => d.id === doctor) ||
    day < clinicDate() ||
    day > dateAfter(30)
  )
    throw new HospitalError(
      "Choose a doctor and a date within the next 30 days.",
    );
  const parsed = date.safeParse(day);
  if (!parsed.success) throw new HospitalError("Choose a valid date.");
  const visits = readState().visits;
  return slotsForDay().filter(
    (time) =>
      new Date(`${day}T${time}:00+05:30`).getTime() > Date.now() &&
      !visits.some(
        (v) =>
          v.doctorId === doctor &&
          v.date === day &&
          v.time === time &&
          v.status !== "CANCELLED",
      ),
  );
}
export function createBooking(input: z.infer<typeof bookingSchema>) {
  return transaction((state) => {
    if (!availableSlots(input.doctorId, input.date).includes(input.time))
      throw new HospitalError(
        "This time has just been booked or is no longer available. Choose another slot.",
        409,
      );
    const duplicate = state.visits.find(
      (v) =>
        v.date === input.date &&
        v.doctorId === input.doctorId &&
        v.status !== "CANCELLED" &&
        state.patients.some(
          (p) =>
            p.id === v.patientId &&
            p.phone === input.phone &&
            p.name.toLowerCase() === input.name.toLowerCase(),
        ),
    );
    if (duplicate)
      throw new HospitalError(
        "You already have an appointment with this doctor on this day.",
        409,
      );
    const patient = upsertPatient(
      state,
      {
        name: input.name,
        phone: input.phone,
        age: input.age,
        gender: input.gender,
        allergies: input.allergies,
      },
      false,
    );
    const visit = {
      ...newVisit(patient.id, input.doctorId),
      date: input.date,
      time: input.time,
      reason: input.reason,
      source: "Online" as const,
      status: "BOOKED" as const,
    };
    state.visits.unshift(visit);
    return {
      reference: visit.id,
      patientName: patient.name,
      doctorId: visit.doctorId,
      date: visit.date,
      time: visit.time,
      fee: visit.fee,
    };
  });
}
export function mutateHospital(input: Action, staff: StaffSession) {
  const role = staff.role;
  const allowed: Record<Action["action"], Role[]> = {
    message: ["ADMIN", "RECEPTION", "DOCTOR", "PHARMACY"],
    ack: ["ADMIN", "RECEPTION", "DOCTOR", "PHARMACY"],
    callNext: ["ADMIN", "RECEPTION", "DOCTOR"],
    call: ["ADMIN", "RECEPTION", "DOCTOR"],
    recall: ["ADMIN", "RECEPTION", "DOCTOR"],
    hold: ["ADMIN", "RECEPTION", "DOCTOR"],
    returnToQueue: ["ADMIN", "RECEPTION", "DOCTOR"],
    invoice: ["ADMIN", "PHARMACY"],
    cancelInvoice: ["ADMIN", "PHARMACY"],
    register: ["ADMIN", "RECEPTION"],
    updateIntake: ["ADMIN", "RECEPTION"],
    checkin: ["ADMIN", "RECEPTION"],
    cancel: ["ADMIN", "RECEPTION"],
    start: ["ADMIN", "DOCTOR"],
    consult: ["ADMIN", "DOCTOR"],
    pay: ["ADMIN", "RECEPTION"],
    dispense: ["ADMIN", "PHARMACY"],
    restock: ["ADMIN", "PHARMACY"],
    medicine: ["ADMIN", "PHARMACY"],
  };
  if (!allowed[input.action].includes(role))
    throw new HospitalError("Your staff role cannot perform this action.", 403);
  return transaction((state) => {
    if (input.action === "message") {
      if (
        input.visitId &&
        !state.visits.some(
          (v) =>
            v.id === input.visitId &&
            (role !== "DOCTOR" || v.doctorId === staff.doctorId),
        )
      )
        throw new HospitalError("Patient visit is not available to you.", 403);
      const message: TeamMessage = {
        id: `msg-${randomBytes(10).toString("hex")}`,
        senderId: staff.id,
        senderName: staff.name,
        senderRole: role,
        recipient: input.recipient,
        doctorId: input.doctorId || null,
        text: input.text,
        kind: input.recipient === "LOBBY" ? "ANNOUNCEMENT" : input.kind,
        visitId: input.visitId || null,
        createdAt: new Date().toISOString(),
        readBy: [],
      };
      state.messages.unshift(message);
      return message;
    }
    if (input.action === "ack") {
      const message = state.messages.find(
        (m) => m.id === input.messageId && canReadMessage(m, staff),
      );
      if (!message) throw new HospitalError("Message not found.", 404);
      if (!canAcknowledge(message, staff))
        throw new HospitalError(
          "Only the receiving department can acknowledge this message.",
          403,
        );
      if (!message.readBy.includes(staff.id)) message.readBy.push(staff.id);
      return message;
    }
    if (input.action === "invoice") {
      const existing = state.invoices.find(
        (i) => i.requestId === input.requestId,
      );
      if (existing) return existing;
      if (
        new Set(input.lines.map((l) => l.medicineId)).size !==
        input.lines.length
      )
        throw new HospitalError(
          "Combine duplicate batches into one bill line.",
        );
      const visit = input.visitId
        ? state.visits.find((v) => v.id === input.visitId)
        : undefined;
      if (
        input.visitId &&
        (!visit || visit.status !== "COMPLETED" || visit.dispensedAt)
      )
        throw new HospitalError(
          "This prescription is not ready or has already been billed.",
          409,
        );
      if (
        visit &&
        visit.prescription.some(
          (rx) =>
            !input.lines.some(
              (l) =>
                l.medicineId === rx.medicineId && l.quantity === rx.quantity,
            ),
        )
      )
        throw new HospitalError(
          "Prescription medicine quantities must match the doctor's instructions.",
        );
      const lines = input.lines.map((l) => {
        const med = state.medicines.find((m) => m.id === l.medicineId);
        if (!med || med.stock < l.quantity || med.expiry <= clinicDate())
          throw new HospitalError(
            "Insufficient usable stock. Review the bill before collecting payment.",
            409,
          );
        if (
          med.prescriptionRequired !== false &&
          !visit?.prescription.some((rx) => rx.medicineId === med.id)
        )
          throw new HospitalError(
            `${med.name} requires a completed hospital prescription.`,
          );
        return invoiceLine(med, l.quantity, l.discountPercent);
      });
      const totals = invoiceTotals(lines);
      const received =
        input.paymentMethod === "Cash"
          ? (input.cashReceived ?? totals.total)
          : totals.total;
      if (received < totals.total)
        throw new HospitalError("Cash received is less than the bill total.");
      const number = `PH-${new Date().getFullYear()}-${String(state.invoices.length + 1).padStart(6, "0")}`;
      const invoice = {
        id: `bill-${randomBytes(10).toString("hex")}`,
        number,
        requestId: input.requestId,
        visitId: visit?.id || null,
        customerName: visit
          ? state.patients.find((p) => p.id === visit.patientId)!.name
          : input.customerName,
        customerPhone: visit
          ? state.patients.find((p) => p.id === visit.patientId)!.phone
          : input.customerPhone,
        lines,
        ...totals,
        cashReceived: received,
        change: roundMoney(received - totals.total),
        paymentReference: input.paymentReference,
        paymentMethod: input.paymentMethod,
        createdAt: new Date().toISOString(),
        createdBy: staff.name,
        cancelledAt: null,
        cancelReason: "",
      };
      for (const line of lines)
        state.medicines.find((m) => m.id === line.medicineId)!.stock -=
          line.quantity;
      state.invoices.unshift(invoice);
      if (visit) {
        visit.dispensedAt = invoice.createdAt;
        visit.pharmacyTotal = invoice.total;
        visit.pharmacyPaymentMethod = input.paymentMethod;
      }
      return invoice;
    }
    if (input.action === "cancelInvoice") {
      const invoice = state.invoices.find((i) => i.id === input.invoiceId);
      if (!invoice) throw new HospitalError("Bill not found.", 404);
      if (invoice.cancelledAt)
        throw new HospitalError(
          "This bill was already cancelled. Stock has already been restored.",
          409,
        );
      for (const line of invoice.lines) {
        const med = state.medicines.find((m) => m.id === line.medicineId);
        if (!med)
          throw new HospitalError("A batch on this bill no longer exists.");
        med.stock += line.quantity;
      }
      invoice.cancelledAt = new Date().toISOString();
      invoice.cancelReason = input.reason;
      const visit = state.visits.find((v) => v.id === invoice.visitId);
      if (visit) {
        visit.dispensedAt = null;
        visit.pharmacyTotal = 0;
      }
      return invoice;
    }
    if (input.action === "callNext") {
      if (role === "DOCTOR" && input.doctorId !== staff.doctorId)
        throw new HospitalError("This queue belongs to another doctor.", 403);
      const next = state.visits
        .filter(
          (v) =>
            v.date === clinicDate() &&
            v.doctorId === input.doctorId &&
            v.status === "WAITING",
        )
        .sort(queueSort)[0];
      if (!next)
        throw new HospitalError(
          "No patients are waiting for this doctor.",
          409,
        );
      callVisit(state, next, staff);
      return next;
    }
    if (input.action === "register") {
      const patient = upsertPatient(state, {
        name: input.name,
        phone: input.phone,
        age: input.age,
        gender: input.gender,
        allergies: input.allergies,
      });
      if (
        state.visits.some(
          (v) =>
            v.patientId === patient.id &&
            v.date === clinicDate() &&
            ["WAITING", "CONSULTING"].includes(v.status),
        )
      )
        throw new HospitalError(
          "This patient is already in today's queue.",
          409,
        );
      const visit = {
        ...newVisit(patient.id, input.doctorId),
        token: token(state),
        reason: input.reason,
        priority: input.priority,
        vitals: input.vitals,
        paid: input.paid,
        paidAt: input.paid ? new Date().toISOString() : null,
        checkedInAt: new Date().toISOString(),
        paymentMethod: input.paymentMethod,
      };
      state.visits.unshift(visit);
      return visit;
    }
    if (input.action === "medicine") {
      if (input.expiry <= clinicDate())
        throw new HospitalError("Choose a future expiry date.");
      state.medicines.unshift({
        id: `med-${randomBytes(6).toString("hex")}`,
        name: input.name,
        generic: input.generic,
        category: input.category,
        strength: input.strength,
        stock: input.stock,
        price: input.price,
        reorderAt: input.reorderAt,
        batch: input.batch,
        expiry: input.expiry,
        barcode: input.barcode,
        hsn: input.hsn,
        gstPercent: input.gstPercent,
        prescriptionRequired: input.prescriptionRequired,
      });
      return;
    }
    if (input.action === "restock") {
      const med = state.medicines.find((m) => m.id === input.medicineId);
      if (!med) throw new HospitalError("Medicine not found.", 404);
      if (med.expiry <= clinicDate())
        throw new HospitalError(
          "This batch has expired. Add a new batch to the formulary.",
        );
      med.stock += input.quantity;
      return;
    }
    const visit = state.visits.find((v) => v.id === input.visitId);
    if (!visit) throw new HospitalError("Visit not found.", 404);
    if (role === "DOCTOR" && visit.doctorId !== staff.doctorId)
      throw new HospitalError("This visit belongs to another doctor.", 403);
    if (input.action === "updateIntake") {
      if (!["WAITING", "CALLED", "SKIPPED"].includes(visit.status))
        throw new HospitalError(
          "Intake details can be updated before the consultation starts.",
          409,
        );
      visit.vitals = input.vitals;
      state.patients.find((p) => p.id === visit.patientId)!.allergies =
        input.allergies;
      return visit;
    }
    if (input.action === "checkin") {
      if (visit.status !== "BOOKED" || visit.date !== clinicDate())
        throw new HospitalError(
          "Only today's scheduled appointments can be checked in.",
          409,
        );
      visit.status = "WAITING";
      visit.token = token(state);
      visit.checkedInAt = new Date().toISOString();
    } else if (input.action === "call") {
      callVisit(state, visit, staff);
    } else if (input.action === "recall") {
      if (!["CALLED", "CONSULTING"].includes(visit.status))
        throw new HospitalError(
          "Only a called or current consultation token can be recalled.",
          409,
        );
      announceVisit(state, visit, staff);
    } else if (input.action === "hold") {
      if (!["WAITING", "CALLED"].includes(visit.status))
        throw new HospitalError(
          "Only waiting or called patients can be put on hold.",
          409,
        );
      visit.status = "SKIPPED";
      visit.skipReason = input.reason;
    } else if (input.action === "returnToQueue") {
      if (visit.status !== "SKIPPED")
        throw new HospitalError("This visit is not on hold.", 409);
      visit.status = "WAITING";
      visit.checkedInAt = new Date().toISOString();
    } else if (input.action === "cancel") {
      if (!["BOOKED", "WAITING", "CALLED", "SKIPPED"].includes(visit.status))
        throw new HospitalError(
          "Only scheduled or waiting visits can be cancelled.",
          409,
        );
      visit.status = "CANCELLED";
    } else if (input.action === "start") {
      if (
        !["WAITING", "CALLED"].includes(visit.status) ||
        visit.date !== clinicDate()
      )
        throw new HospitalError(
          "This patient is no longer waiting in today's queue.",
          409,
        );
      if (
        state.visits.some(
          (v) =>
            v.id !== visit.id &&
            v.doctorId === visit.doctorId &&
            v.date === visit.date &&
            ["CALLED", "CONSULTING"].includes(v.status),
        )
      )
        throw new HospitalError(
          "Complete this doctor's current consultation first.",
          409,
        );
      visit.status = "CONSULTING";
    } else if (input.action === "consult") {
      if (visit.status !== "CONSULTING")
        throw new HospitalError(
          "Start this consultation before saving it.",
          409,
        );
      if (input.complete && !input.diagnosis.trim())
        throw new HospitalError(
          "Enter a diagnosis before completing the consultation.",
        );
      if (input.followUp && input.followUp < clinicDate())
        throw new HospitalError("Follow-up date cannot be in the past.");
      const ids = input.prescription.map((p) => p.medicineId);
      if (new Set(ids).size !== ids.length)
        throw new HospitalError(
          "Combine duplicate medicines into a single prescription line.",
        );
      input.prescription.forEach((p) => {
        const med = state.medicines.find((m) => m.id === p.medicineId);
        if (!med || med.expiry <= clinicDate())
          throw new HospitalError(
            "A prescribed medicine is unavailable or expired.",
          );
        p.name = `${med.name} ${med.strength}`;
      });
      Object.assign(visit, {
        diagnosis: input.diagnosis,
        notes: input.notes,
        prescription: input.prescription,
        followUp: input.followUp,
      });
      if (input.complete) {
        visit.status = "COMPLETED";
        visit.completedAt = new Date().toISOString();
      }
    } else if (input.action === "pay") {
      if (visit.paid || visit.status === "CANCELLED")
        throw new HospitalError(
          "This visit is already paid or cancelled.",
          409,
        );
      visit.paid = true;
      visit.paidAt = new Date().toISOString();
      visit.paymentMethod = input.paymentMethod;
    } else if (input.action === "dispense") {
      if (
        visit.status !== "COMPLETED" ||
        !visit.prescription.length ||
        visit.dispensedAt
      )
        throw new HospitalError(
          "This prescription is not ready or has already been dispensed.",
          409,
        );
      throw new HospitalError(
        "Use the pharmacy billing counter to save a bill and dispense together.",
        400,
      );
    }
    return visit;
  });
}
export function canReadMessage(m: TeamMessage, staff: StaffSession) {
  return (
    staff.role === "ADMIN" ||
    m.senderId === staff.id ||
    m.recipient === "ALL" ||
    (m.recipient === "LOBBY" && ["RECEPTION", "DOCTOR"].includes(staff.role)) ||
    (m.recipient === staff.role &&
      (m.recipient !== "DOCTOR" ||
        !m.doctorId ||
        m.doctorId === staff.doctorId))
  );
}
function announceVisit(
  state: HospitalState,
  visit: Visit,
  staff: StaffSession,
) {
  visit.calledAt = new Date().toISOString();
  visit.callCount = (visit.callCount || 0) + 1;
  state.messages.unshift({
    id: `msg-${randomBytes(10).toString("hex")}`,
    senderId: staff.id,
    senderName: staff.name,
    senderRole: staff.role,
    recipient: "LOBBY",
    doctorId: visit.doctorId,
    text: `Token ${visit.token}, please proceed to room ${DOCTORS.find((d) => d.id === visit.doctorId)?.room}.`,
    kind: "ANNOUNCEMENT",
    visitId: visit.id,
    createdAt: new Date().toISOString(),
    readBy: [],
  });
}
function callVisit(state: HospitalState, visit: Visit, staff: StaffSession) {
  if (visit.date !== clinicDate() || visit.status !== "WAITING")
    throw new HospitalError(
      "This patient is no longer waiting in today's queue.",
      409,
    );
  if (
    state.visits.some(
      (v) =>
        v.id !== visit.id &&
        v.doctorId === visit.doctorId &&
        v.date === clinicDate() &&
        ["CALLED", "CONSULTING"].includes(v.status),
    )
  )
    throw new HospitalError(
      "This doctor already has a called or active patient. Finish or hold that visit first.",
      409,
    );
  visit.status = "CALLED";
  announceVisit(state, visit, staff);
}
export function staffSnapshot(staff: StaffSession): HospitalState {
  const state = readState();
  const messages = state.messages.filter((m) => canReadMessage(m, staff));
  if (staff.role === "ADMIN") return { ...state, messages };
  if (staff.role === "DOCTOR") {
    const visits = state.visits.filter((v) => v.doctorId === staff.doctorId);
    return {
      visits,
      patients: state.patients.filter((p) =>
        visits.some((v) => v.patientId === p.id),
      ),
      medicines: state.medicines,
      messages,
      invoices: [],
    };
  }
  if (staff.role === "PHARMACY") {
    const visits = state.visits
      .filter((v) => v.status === "COMPLETED" && v.prescription.length)
      .map((v) => ({
        ...v,
        diagnosis: "",
        notes: "",
        vitals: { ...EMPTY_VITALS },
        reason: "",
        fee: 0,
        paid: false,
        paidAt: null,
      }));
    return {
      medicines: state.medicines,
      visits,
      patients: state.patients.filter((p) =>
        visits.some((v) => v.patientId === p.id),
      ),
      messages,
      invoices: state.invoices,
    };
  }
  return {
    ...state,
    medicines: [],
    messages,
    invoices: [],
    visits: state.visits.map((v) => ({
      ...v,
      diagnosis: "",
      notes: "",
      prescription: [],
    })),
  };
}
