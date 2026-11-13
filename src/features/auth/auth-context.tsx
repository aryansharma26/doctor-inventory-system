"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export type Identity = {
  user: {
    id: string;
    email: string;
    fullName: string;
    isPlatformAdmin: boolean;
  };
  selectedClinicId: string | null;
  selectedRole: string | null;
  permissions: string[];
  clinics: Array<{ id: string; name: string; code: string; role: string }>;
};

export const DEMO_PERMISSIONS = [
  "inventory.read",
  "inventory.manage",
  "inventory.adjust",
  "purchase_order.read",
  "purchase_order.create",
  "purchase_order.approve",
  "supplier.manage",
  "invoice.read",
  "invoice.issue",
  "user.manage",
  "audit.read",
  "audit.export",
  "document.manage",
  "appointment.read",
  "appointment.manage",
  "patient_record.read",
  "patient_record.write",
  "prescription.read",
  "prescription.issue",
];

export const DEMO_IDENTITIES: Record<"DOCTOR" | "SUPERADMIN" | "RECEPTIONIST", Identity> = {
  DOCTOR: {
    user: {
      id: "demo-doctor-001",
      email: "doctor@medistock.ph",
      fullName: "Dr. Jose Rizal, MD",
      isPlatformAdmin: false,
    },
    selectedClinicId: "clinic-st-jude",
    selectedRole: "DOCTOR",
    permissions: DEMO_PERMISSIONS,
    clinics: [
      { id: "clinic-st-jude", name: "St. Jude Family Health Clinic", code: "ST-JUDE", role: "DOCTOR" },
      { id: "clinic-metro-polyclinic", name: "Metro Manila Polyclinic", code: "METRO-POLY", role: "DOCTOR" },
    ],
  },
  SUPERADMIN: {
    user: {
      id: "demo-superadmin-001",
      email: "superadmin@medistock.ph",
      fullName: "Platform Super Admin",
      isPlatformAdmin: true,
    },
    selectedClinicId: null,
    selectedRole: "SUPER_ADMIN",
    permissions: DEMO_PERMISSIONS,
    clinics: [
      { id: "clinic-st-jude", name: "St. Jude Family Health Clinic", code: "ST-JUDE", role: "SUPER_ADMIN" },
    ],
  },
  RECEPTIONIST: {
    user: {
      id: "demo-reception-001",
      email: "reception@medistock.ph",
      fullName: "Maria Santos (Front Desk)",
      isPlatformAdmin: false,
    },
    selectedClinicId: "clinic-st-jude",
    selectedRole: "RECEPTIONIST",
    permissions: [
      "inventory.read",
      "invoice.read",
      "invoice.issue",
      "appointment.read",
      "appointment.manage",
      "patient_record.read",
      "patient_record.write",
    ],
    clinics: [
      { id: "clinic-st-jude", name: "St. Jude Family Health Clinic", code: "ST-JUDE", role: "RECEPTIONIST" },
    ],
  },
};

type AuthContextValue = {
  identity: Identity | null;
  loading: boolean;
  selectClinic: (clinicId: string) => void;
  signOut: () => void;
  signInDemo: (
    role: "DOCTOR" | "SUPERADMIN" | "RECEPTIONIST",
    customData?: {
      email?: string;
      fullName?: string;
      clinicName?: string;
      clinicId?: string;
    },
  ) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("medistock_auth_identity");
      if (stored) {
        setIdentity(JSON.parse(stored));
      } else {
        // Default to Doctor for instant frictionless preview if no explicit state
        const defaultDoc = DEMO_IDENTITIES.DOCTOR;
        setIdentity(defaultDoc);
        localStorage.setItem("medistock_auth_identity", JSON.stringify(defaultDoc));
      }
    } catch {
      setIdentity(DEMO_IDENTITIES.DOCTOR);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInDemo = useCallback(
    (
      role: "DOCTOR" | "SUPERADMIN" | "RECEPTIONIST",
      customData?: {
        email?: string;
        fullName?: string;
        clinicName?: string;
        clinicId?: string;
      },
    ) => {
      const base = DEMO_IDENTITIES[role];
      const targetIdentity: Identity = {
        ...base,
        user: {
          ...base.user,
          ...(customData?.email ? { email: customData.email } : {}),
          ...(customData?.fullName ? { fullName: customData.fullName } : {}),
        },
        selectedClinicId: customData?.clinicId ?? base.selectedClinicId,
        clinics:
          customData?.clinicName && customData?.clinicId
            ? [
                {
                  id: customData.clinicId,
                  name: customData.clinicName,
                  code: "MY-CLINIC",
                  role: role === "RECEPTIONIST" ? "RECEPTIONIST" : "CLINIC_OWNER",
                },
                ...base.clinics,
              ]
            : base.clinics,
      };

      localStorage.setItem("medistock_auth_identity", JSON.stringify(targetIdentity));
      setIdentity(targetIdentity);

      if (targetIdentity.user.isPlatformAdmin) {
        router.push("/superadmin");
      } else if (role === "RECEPTIONIST" || targetIdentity.selectedRole === "RECEPTIONIST") {
        router.push("/reception");
      } else {
        router.push("/consultation");
      }
    },
    [router],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem("medistock_auth_identity");
    setIdentity(null);
    router.push("/login");
  }, [router]);

  const selectClinic = useCallback((clinicId: string) => {
    setIdentity((prev) => {
      if (!prev) return null;
      const updated = { ...prev, selectedClinicId: clinicId };
      localStorage.setItem("medistock_auth_identity", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      identity,
      loading,
      selectClinic,
      signOut,
      signInDemo,
    }),
    [identity, loading, selectClinic, signOut, signInDemo],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
