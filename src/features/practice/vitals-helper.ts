export type VitalAlert = {
  severity: "danger" | "warning";
  label: string;
  message: string;
};

export function interpretVitals(vitals?: {
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  temperatureCelsius?: number;
  spO2?: number;
  weightKg?: number;
}): VitalAlert[] {
  if (!vitals) return [];
  const alerts: VitalAlert[] = [];

  // Blood Pressure
  if (vitals.systolicBp && vitals.diastolicBp) {
    if (vitals.systolicBp >= 140 || vitals.diastolicBp >= 90) {
      alerts.push({
        severity: "danger",
        label: "Hypertension Stage 2",
        message: `High BP: ${vitals.systolicBp}/${vitals.diastolicBp} mmHg`,
      });
    } else if (vitals.systolicBp >= 130 || vitals.diastolicBp >= 80) {
      alerts.push({
        severity: "warning",
        label: "Pre-Hypertension",
        message: `Elevated BP: ${vitals.systolicBp}/${vitals.diastolicBp} mmHg`,
      });
    } else if (vitals.systolicBp < 90 || vitals.diastolicBp < 60) {
      alerts.push({
        severity: "warning",
        label: "Hypotension",
        message: `Low BP: ${vitals.systolicBp}/${vitals.diastolicBp} mmHg`,
      });
    }
  }

  // Oxygen Saturation (SpO2)
  if (vitals.spO2 !== undefined && vitals.spO2 > 0) {
    if (vitals.spO2 < 92) {
      alerts.push({
        severity: "danger",
        label: "Critical Hypoxia",
        message: `Low SpO2: ${vitals.spO2}% (O2 Support Required)`,
      });
    } else if (vitals.spO2 < 95) {
      alerts.push({
        severity: "warning",
        label: "Mild Hypoxia",
        message: `Low SpO2: ${vitals.spO2}%`,
      });
    }
  }

  // Temperature
  if (
    vitals.temperatureCelsius !== undefined &&
    vitals.temperatureCelsius > 0
  ) {
    if (vitals.temperatureCelsius >= 38.5) {
      alerts.push({
        severity: "danger",
        label: "High Fever",
        message: `Pyrexia: ${vitals.temperatureCelsius}°C`,
      });
    } else if (vitals.temperatureCelsius >= 37.5) {
      alerts.push({
        severity: "warning",
        label: "Low-Grade Fever",
        message: `Temp: ${vitals.temperatureCelsius}°C`,
      });
    }
  }

  // Pulse / Heart Rate
  if (vitals.heartRate !== undefined && vitals.heartRate > 0) {
    if (vitals.heartRate > 105) {
      alerts.push({
        severity: "warning",
        label: "Tachycardia",
        message: `High Heart Rate: ${vitals.heartRate} bpm`,
      });
    } else if (vitals.heartRate < 55) {
      alerts.push({
        severity: "warning",
        label: "Bradycardia",
        message: `Low Heart Rate: ${vitals.heartRate} bpm`,
      });
    }
  }

  return alerts;
}

export function exportTicketsToCsv(
  tickets: Array<{
    tokenNo: string;
    patientName: string;
    phone: string;
    age: number;
    gender: string;
    bloodGroup: string;
    area?: string;
    complaints: string;
    doctorName: string;
    status: string;
    checkInTime: string;
    vitals: {
      systolicBp?: number;
      diastolicBp?: number;
      heartRate?: number;
      temperatureCelsius?: number;
      weightKg?: number;
      spO2?: number;
    };
  }>,
  clinicName = "Clinic OPD Register",
) {
  const headers = [
    "Token No",
    "Check-In Time",
    "Patient Name",
    "Phone",
    "Age",
    "Gender",
    "Blood Group",
    "Area/Locality",
    "Chief Complaints",
    "Assigned Doctor",
    "Status",
    "BP",
    "Pulse (bpm)",
    "Temp (°C)",
    "Weight (kg)",
    "SpO2 (%)",
  ];

  const rows = tickets.map((t) => [
    `"${t.tokenNo}"`,
    `"${new Date(t.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}"`,
    `"${t.patientName.replace(/"/g, '""')}"`,
    `"${t.phone}"`,
    t.age,
    `"${t.gender}"`,
    `"${t.bloodGroup}"`,
    `"${(t.area || "").replace(/"/g, '""')}"`,
    `"${(t.complaints || "").replace(/"/g, '""')}"`,
    `"${t.doctorName.replace(/"/g, '""')}"`,
    `"${t.status}"`,
    `"${t.vitals?.systolicBp ? `${t.vitals.systolicBp}/${t.vitals.diastolicBp}` : ""}"`,
    t.vitals?.heartRate || "",
    t.vitals?.temperatureCelsius || "",
    t.vitals?.weightKg || "",
    t.vitals?.spO2 || "",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\r\n",
  );
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", `${clinicName.replace(/\s+/g, "_")}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
