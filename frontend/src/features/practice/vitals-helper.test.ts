import { describe, expect, it } from "vitest";
import { interpretVitals } from "./vitals-helper";

describe("Clinical Decision Support - Vitals Interpretation", () => {
  it("returns no alerts for normal, healthy vitals", () => {
    const alerts = interpretVitals({
      systolicBp: 115,
      diastolicBp: 75,
      spO2: 99,
      temperatureCelsius: 36.6,
      heartRate: 70,
    });

    expect(alerts).toHaveLength(0);
  });

  it("flags Stage 2 Hypertension when BP is >= 140/90", () => {
    const alerts = interpretVitals({
      systolicBp: 155,
      diastolicBp: 95,
      spO2: 98,
    });

    const htAlert = alerts.find((a) => a.label === "Hypertension Stage 2");
    expect(htAlert).toBeDefined();
    expect(htAlert?.severity).toBe("danger");
  });

  it("flags Critical Hypoxia when SpO2 is below 92%", () => {
    const alerts = interpretVitals({
      systolicBp: 120,
      diastolicBp: 78,
      spO2: 89,
    });

    const hypoxiaAlert = alerts.find((a) => a.label === "Critical Hypoxia");
    expect(hypoxiaAlert).toBeDefined();
    expect(hypoxiaAlert?.severity).toBe("danger");
    expect(hypoxiaAlert?.message).toContain("O2 Support Required");
  });

  it("flags High Fever when temperature is >= 38.5°C", () => {
    const alerts = interpretVitals({
      temperatureCelsius: 39.2,
    });

    const feverAlert = alerts.find((a) => a.label === "High Fever");
    expect(feverAlert).toBeDefined();
    expect(feverAlert?.severity).toBe("danger");
  });

  it("flags Tachycardia when Heart Rate exceeds 105 bpm", () => {
    const alerts = interpretVitals({
      heartRate: 118,
    });

    const hrAlert = alerts.find((a) => a.label === "Tachycardia");
    expect(hrAlert).toBeDefined();
    expect(hrAlert?.severity).toBe("warning");
  });
});
