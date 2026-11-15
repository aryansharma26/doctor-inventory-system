import { test, expect } from "@playwright/test";
import {
  clinicDate,
  dateAfter,
  paymentDate,
  type HospitalState,
} from "../src/features/hospital/types";

test.beforeEach(async ({ page, request }) => {
  const credentials = { username: "admin", password: "Admin@123" };
  await request.post("/api/staff", { data: credentials });
  await page.request.post("/api/staff", { data: credentials });
});

test("registration, consultation, prescription and atomic pharmacy dispensing", async ({
  page,
  request,
}) => {
  await page.goto("/reception");
  await page
    .getByRole("button", { name: "Register patient", exact: true })
    .click();
  await page
    .getByLabel("Full name *", { exact: true })
    .fill("Workflow Test Patient");
  await page.getByLabel("Mobile number *", { exact: true }).fill("9898989898");
  await page.getByLabel("Age (years) *", { exact: true }).fill("12");
  await page
    .getByLabel("Known allergies", { exact: true })
    .fill("Recorded test allergy");
  await page
    .getByLabel("Reason for visit *", { exact: true })
    .fill("End-to-end workflow validation");
  await page
    .getByLabel("Consulting doctor", { exact: true })
    .selectOption("rohan");
  await page.getByRole("button", { name: "Register & generate slip" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Patient registration slip",
  );
  await expect(page.locator(".token-print")).toContainText("OPD-");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".hospital-app")).toHaveCSS("display", "none");
  await expect(page.locator(".print-document")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Record vitals for Workflow Test Patient",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Blood pressure (mmHg)", { exact: true })
    .fill("118/78");
  await page.getByRole("button", { name: "Save vitals", exact: true }).click();
  await page
    .getByRole("link", { name: "Doctor's desk", exact: true })
    .first()
    .click();
  await page.locator(".doctor-picker select").selectOption("rohan");
  await page.getByRole("button", { name: /Workflow Test Patient/ }).click();
  await expect(page.locator(".allergy-alert")).toContainText(
    "Recorded test allergy",
  );
  await expect(page.locator(".patient-vitals")).toContainText("118/78");
  await page
    .getByRole("button", { name: "Start consultation", exact: true })
    .click();
  await page
    .getByLabel("Clinical diagnosis *", { exact: true })
    .fill("Test diagnosis recorded by doctor");
  await page.getByLabel("Select from hospital formulary").selectOption("med-1");
  await page.getByLabel("Dosage *", { exact: true }).fill("Test dosage");
  await page.getByLabel("Frequency *", { exact: true }).fill("Test frequency");
  await page.getByLabel("Duration *", { exact: true }).fill("Test duration");
  await page.getByLabel("Quantity (units) *", { exact: true }).fill("6");
  await page.getByRole("button", { name: "Add to prescription" }).click();
  await page
    .getByLabel("Advice & consultation notes")
    .fill("Test advice preserved across refresh");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(
    page.getByText("Consultation draft saved.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.locator(".doctor-picker select").selectOption("rohan");
  await expect(
    page.getByLabel("Clinical diagnosis *", { exact: true }),
  ).toHaveValue("Test diagnosis recorded by doctor");
  await page
    .getByRole("button", { name: "Complete & send to pharmacy" })
    .click();
  await expect(
    page.getByText("Consultation completed", { exact: true }),
  ).toBeVisible();
  const state: HospitalState = await (
    await request.get("/api/hospital")
  ).json();
  const patient = state.patients.find(
    (p) => p.name === "Workflow Test Patient",
  )!;
  const visit = state.visits.find((v) => v.patientId === patient.id)!;
  const openingStock = state.medicines.find((m) => m.id === "med-1")!.stock;
  await page
    .getByRole("link", { name: "Pharmacy counter", exact: true })
    .click();
  await page
    .locator(".pharmacy-rx-card")
    .filter({ hasText: "Workflow Test Patient" })
    .getByRole("button", { name: "Review & dispense" })
    .click();
  await page
    .getByRole("button", { name: "Payment received & dispense" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Pharmacy receipt");
  const after: HospitalState = await (
    await request.get("/api/hospital")
  ).json();
  expect(after.medicines.find((m) => m.id === "med-1")!.stock).toBe(
    openingStock - 6,
  );
  const duplicate = await request.post("/api/hospital", {
    data: { action: "dispense", visitId: visit.id, paymentMethod: "Cash" },
  });
  expect(duplicate.status()).toBe(409);
  const afterDuplicate: HospitalState = await (
    await request.get("/api/hospital")
  ).json();
  expect(afterDuplicate.medicines.find((m) => m.id === "med-1")!.stock).toBe(
    openingStock - 6,
  );
});

test("concurrent public bookings reserve one slot and appear at reception", async ({
  request,
}) => {
  const day = dateAfter(1);
  const { slots } = await (
    await request.get(`/api/booking?doctor=meera&date=${day}`)
  ).json();
  const base = {
    name: "Booking Race Patient",
    phone: "9898989801",
    age: 30,
    gender: "Female",
    doctorId: "meera",
    date: day,
    time: slots[0],
    reason: "Appointment validation",
    consent: true,
  };
  const results = await Promise.all([
    request.post("/api/booking", { data: base }),
    request.post("/api/booking", {
      data: { ...base, name: "Second Booking Patient", phone: "9898989802" },
    }),
  ]);
  expect(results.map((r) => r.status()).sort()).toEqual([201, 409]);
  const booked = await results.find((r) => r.status() === 201)!.json();
  expect(Object.keys(booked.booking).sort()).toEqual([
    "date",
    "doctorId",
    "fee",
    "patientName",
    "reference",
    "time",
  ]);
  const state: HospitalState = await (
    await request.get("/api/hospital")
  ).json();
  const visit = state.visits.find((v) => v.id === booked.booking.reference)!;
  expect(visit.source).toBe("Online");
  expect(visit.status).toBe("BOOKED");
  const paid = await request.post("/api/hospital", {
    data: { action: "pay", visitId: visit.id, paymentMethod: "UPI" },
  });
  expect(paid.status()).toBe(200);
  expect(paymentDate((await paid.json()).result)).toBe(clinicDate());
  expect(
    (
      await request.post("/api/hospital", {
        data: { action: "checkin", visitId: visit.id },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/booking", {
        data: { ...base, phone: "invalid" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/hospital", {
        data: { action: "cancel", visitId: visit.id },
      })
    ).status(),
  ).toBe(200);
  const released = await (
    await request.get(`/api/booking?doctor=meera&date=${day}`)
  ).json();
  expect(released.slots).toContain(base.time);
  expect(
    (
      await request.post("/api/booking", { data: { ...base, consent: false } })
    ).status(),
  ).toBe(400);
});

test("staff permissions redact clinical data and reject unauthorised changes", async ({
  playwright,
}) => {
  const reception = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  await reception.post("/api/staff", {
    data: { username: "reception", password: "Reception@123" },
  });
  const state: HospitalState = await (
    await reception.get("/api/hospital")
  ).json();
  expect(
    state.visits.every(
      (v) => !v.diagnosis && !v.notes && !v.prescription.length,
    ),
  ).toBeTruthy();
  expect(
    (
      await reception.post("/api/hospital", {
        data: { action: "restock", medicineId: "med-1", quantity: 5 },
      })
    ).status(),
  ).toBe(403);
  const unpaid = state.visits.find((v) => !v.paid && v.status !== "CANCELLED")!;
  const payment = await reception.post("/api/hospital", {
    data: { action: "pay", visitId: unpaid.id, paymentMethod: "Cash" },
  });
  expect(payment.status()).toBe(200);
  const paymentData = await payment.json();
  expect(paymentData.result.diagnosis).toBe("");
  expect(paymentData.result.prescription).toEqual([]);
  const crossOrigin = await reception.post("/api/hospital", {
    headers: { Origin: "https://untrusted.example" },
    data: { action: "pay", visitId: unpaid.id, paymentMethod: "Cash" },
  });
  expect(crossOrigin.status()).toBe(403);
  const pharmacy = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  await pharmacy.post("/api/staff", {
    data: { username: "pharmacy", password: "Pharmacy@123" },
  });
  const limited: HospitalState = await (
    await pharmacy.get("/api/hospital")
  ).json();
  expect(
    limited.visits.every(
      (v) => v.status === "COMPLETED" && !v.diagnosis && !v.notes && !v.reason,
    ),
  ).toBeTruthy();
  expect(
    (
      await pharmacy.post("/api/hospital", {
        data: { action: "start", visitId: "visit-demo-2" },
      })
    ).status(),
  ).toBe(403);
  await reception.dispose();
  await pharmacy.dispose();
});

test("public booking form confirms a visit and exports a calendar event", async ({
  page,
}) => {
  await page.goto("/book");
  await page.getByLabel("Your appointment date").fill(dateAfter(2));
  await page.locator(".booking-slots label").first().click();
  await page
    .getByLabel("Full name *", { exact: true })
    .fill("Online Browser Patient");
  await page.getByLabel("Mobile number *", { exact: true }).fill("9898989803");
  await page.getByLabel("Age (years) *", { exact: true }).fill("29");
  await page
    .getByLabel("What brings you in? *")
    .fill("Booking form validation");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm appointment" }).click();
  await expect(
    page.getByRole("heading", { name: /We’ll see you soon/ }),
  ).toBeVisible();
  await expect(page.locator(".confirmation-card")).toContainText(
    "Appointment confirmed",
  );
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to calendar" }).click();
  expect((await downloaded).suggestedFilename()).toBe(
    "hospital-appointment.ics",
  );
});

test("mobile navigation and key screens fit a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/reception",
    "/consultation",
    "/pharmacy",
    "/appointments",
    "/patients",
    "/inventory",
    "/pos",
    "/queue",
    "/messages",
    "/book/manage",
    "/book",
    "/login",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1,h2").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("link", { name: "Reception desk", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Reception desk" }),
  ).toBeVisible();
});
