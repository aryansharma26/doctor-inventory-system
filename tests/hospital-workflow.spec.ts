import { test, expect } from "@playwright/test";
import { dateAfter, type HospitalState } from "../src/features/hospital/types";
const credentials = {
  admin: { username: "admin", password: "Admin@123" },
  reception: { username: "reception", password: "Reception@123" },
  doctor: { username: "doctor", password: "Doctor@123" },
  meera: { username: "doctor.meera", password: "Doctor@123" },
  pharmacy: { username: "pharmacy", password: "Pharmacy@123" },
};

test("common ID/password login opens only the staff department and logout revokes access", async ({
  page,
  request,
}) => {
  expect((await request.get("/api/hospital")).status()).toBe(401);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Staff ID", { exact: true })).toBeVisible();
  expect(
    (
      await request.post("/api/staff", {
        data: { ...credentials.reception, password: "incorrect" },
      })
    ).status(),
  ).toBe(401);
  await page.getByLabel("Staff ID", { exact: true }).fill("reception");
  await page.getByLabel("Password", { exact: true }).fill("Reception@123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/reception$/);
  await expect(
    page.getByRole("heading", { name: "Reception desk", exact: true }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    nav.getByRole("link", { name: "Patient queue", exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Team messages", exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Pharmacy counter", exact: true }),
  ).toHaveCount(0);
  await expect(
    nav.getByRole("link", { name: "Hospital overview", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Switch demo role")).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get("/api/hospital")).status()).toBe(401);
  await page.getByLabel("Staff ID", { exact: true }).fill("doctor");
  await page.getByLabel("Password", { exact: true }).fill("Doctor@123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/consultation$/);
  await expect(page.locator(".doctor-picker select")).toBeDisabled();
  await expect(page.locator(".doctor-picker select")).toHaveValue("aarav");
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Consultation payments", exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await page.request.post("/api/hospital", {
        data: { action: "start", visitId: "visit-demo-2" },
      })
    ).status(),
  ).toBe(403);
  const state: HospitalState = await (
    await page.request.get("/api/hospital")
  ).json();
  expect(state.visits.every((v) => v.doctorId === "aarav")).toBeTruthy();
});

test("reception queue calls, recalls, holds and restores patients; doctor messages sync and play aloud", async ({
  browser,
  playwright,
}) => {
  const receptionContext = await browser.newContext();
  await receptionContext.addInitScript(() => {
    (window as unknown as { spoken: string[] }).spoken = [];
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class {
        text: string;
        lang = "";
        rate = 1;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak: (u: { text: string }) =>
          (window as unknown as { spoken: string[] }).spoken.push(u.text),
        cancel: () => {},
      },
    });
  });
  const reception = await receptionContext.newPage();
  await reception.request.post("/api/staff", { data: credentials.reception });
  const doctor = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  await doctor.post("/api/staff", { data: credentials.meera });
  let response = await reception.request.post("/api/hospital", {
    data: { action: "callNext", doctorId: "meera" },
  });
  expect(response.status()).toBe(200);
  const called = (await response.json()).result;
  expect(called.status).toBe("CALLED");
  expect(
    (
      await reception.request.post("/api/hospital", {
        data: { action: "callNext", doctorId: "meera" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await reception.request.post("/api/hospital", {
        data: { action: "recall", visitId: called.id },
      })
    ).status(),
  ).toBe(200);
  response = await reception.request.post("/api/hospital", {
    data: { action: "hold", visitId: called.id, reason: "Patient stepped out" },
  });
  expect((await response.json()).result.status).toBe("SKIPPED");
  response = await reception.request.post("/api/hospital", {
    data: { action: "returnToQueue", visitId: called.id },
  });
  expect((await response.json()).result.status).toBe("WAITING");
  expect(
    (
      await doctor.post("/api/hospital", {
        data: { action: "start", visitId: called.id },
      })
    ).status(),
  ).toBe(200);
  await reception.goto("/messages");
  await reception
    .getByRole("heading", { name: "Team messages", exact: true })
    .waitFor();
  await reception
    .getByRole("button", { name: "Enable announcement audio", exact: true })
    .click();
  const text = "Please prepare the next patient — communication test";
  await reception.request.post("/api/hospital", {
    data: { action: "recall", visitId: called.id },
  });
  await expect
    .poll(() =>
      reception.evaluate(() =>
        (window as unknown as { spoken: string[] }).spoken.some((t) =>
          t.includes("Token OPD-"),
        ),
      ),
    )
    .toBeTruthy();
  response = await doctor.post("/api/hospital", {
    data: {
      action: "message",
      recipient: "RECEPTION",
      text,
      visitId: called.id,
    },
  });
  expect(response.status()).toBe(200);
  const message = (await response.json()).result;
  const card = reception.locator(".team-message").filter({ hasText: text });
  await expect(card).toBeVisible({ timeout: 10000 });
  await expect
    .poll(() =>
      reception.evaluate(() =>
        (window as unknown as { spoken: string[] }).spoken.some((t) =>
          t.includes("communication test"),
        ),
      ),
    )
    .toBeTruthy();
  await card.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await expect
    .poll(async () => {
      const state: HospitalState = await (
        await doctor.get("/api/hospital")
      ).json();
      return state.messages
        .find((m) => m.id === message.id)
        ?.readBy.includes("reception");
    })
    .toBeTruthy();
  await receptionContext.close();
  await doctor.dispose();
});

test("EvoTech-style billing freezes inclusive rates, discounts and change, and restores stock exactly once", async ({
  request,
}) => {
  await request.post("/api/staff", { data: credentials.pharmacy });
  const added = await request.post("/api/hospital", {
    data: {
      action: "medicine",
      name: "Billing Test Product",
      generic: "Sample formulation",
      category: "Test",
      strength: "1 unit",
      stock: 20,
      price: 112,
      reorderAt: 5,
      batch: "TEST-01",
      expiry: dateAfter(300),
      gstPercent: 12,
      barcode: "8900000000001",
      prescriptionRequired: false,
    },
  });
  expect(added.status()).toBe(200);
  const state: HospitalState = (await added.json()).state;
  const med = state.medicines.find((m) => m.barcode === "8900000000001")!;
  const input = {
    action: "invoice",
    requestId: "test-idempotent-checkout-001",
    customerName: "Counter Test Customer",
    customerPhone: "",
    paymentMethod: "Cash",
    cashReceived: 250,
    lines: [
      { medicineId: med.id, quantity: 2, discountPercent: 10, unitPrice: 1 },
    ],
  };
  const sold = await request.post("/api/hospital", { data: input });
  expect(sold.status()).toBe(200);
  const bill = (await sold.json()).result;
  expect(bill.total).toBe(201.6);
  expect(bill.taxable).toBe(180);
  expect(bill.tax).toBe(21.6);
  expect(bill.discount).toBe(22.4);
  expect(bill.change).toBe(48.4);
  expect(bill.lines[0].unitPrice).toBe(112);
  const retry = await request.post("/api/hospital", { data: input });
  expect((await retry.json()).result.id).toBe(bill.id);
  let after: HospitalState = await (await request.get("/api/hospital")).json();
  expect(after.medicines.find((m) => m.id === med.id)?.stock).toBe(18);
  const cancellation = {
    action: "cancelInvoice",
    invoiceId: bill.id,
    reason: "Wrong item returned",
  };
  expect(
    (await request.post("/api/hospital", { data: cancellation })).status(),
  ).toBe(200);
  expect(
    (await request.post("/api/hospital", { data: cancellation })).status(),
  ).toBe(409);
  after = await (await request.get("/api/hospital")).json();
  expect(after.medicines.find((m) => m.id === med.id)?.stock).toBe(20);
  expect(
    after.invoices.find((i) => i.id === bill.id)?.cancelledAt,
  ).toBeTruthy();
  const insufficient = await request.post("/api/hospital", {
    data: { ...input, requestId: "test-cash-short-001", cashReceived: 5 },
  });
  expect(insufficient.status()).toBe(400);
  after = await (await request.get("/api/hospital")).json();
  expect(after.medicines.find((m) => m.id === med.id)?.stock).toBe(20);
});

test("patients privately check, reschedule and cancel online bookings", async ({
  request,
}) => {
  const day = dateAfter(3);
  const slots = (
    await (await request.get(`/api/booking?doctor=aarav&date=${day}`)).json()
  ).slots;
  const r = await request.post("/api/booking", {
    data: {
      name: "Managed Booking Patient",
      phone: "9898989810",
      age: 30,
      gender: "Female",
      doctorId: "aarav",
      date: day,
      time: slots[0],
      reason: "Online booking management test",
      consent: true,
    },
  });
  expect(r.status()).toBe(201);
  const booking = (await r.json()).booking;
  expect(
    (
      await request.post("/api/booking/manage", {
        data: { reference: booking.reference, phone: "9898989811" },
      })
    ).status(),
  ).toBe(404);
  const identity = { reference: booking.reference, phone: "9898989810" };
  const status = (
    await (await request.post("/api/booking/manage", { data: identity })).json()
  ).booking;
  expect(status.status).toBe("BOOKED");
  expect(status).not.toHaveProperty("diagnosis");
  expect(status).not.toHaveProperty("prescription");
  const newDate = dateAfter(4);
  const newSlots = (
    await (
      await request.get(`/api/booking?doctor=aarav&date=${newDate}`)
    ).json()
  ).slots;
  const rescheduled = await request.post("/api/booking/manage", {
    data: {
      ...identity,
      operation: "reschedule",
      date: newDate,
      time: newSlots[0],
    },
  });
  expect(rescheduled.status()).toBe(200);
  expect((await rescheduled.json()).booking.date).toBe(newDate);
  const cancelled = await request.post("/api/booking/manage", {
    data: { ...identity, operation: "cancel" },
  });
  expect((await cancelled.json()).booking.status).toBe("CANCELLED");
  expect(
    (
      await (
        await request.get(`/api/booking?doctor=aarav&date=${newDate}`)
      ).json()
    ).slots,
  ).toContain(newSlots[0]);
});
