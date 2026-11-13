import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingPage } from "@/components/ui/loading";
import { AttendancePage } from "@/features/admin/attendance-page";
import { NoticeBoardPage } from "@/features/admin/notice-board-page";
import { SettingsPage } from "@/features/admin/settings-page";
import { UsersPage } from "@/features/admin/users-page";
import { AuditPage } from "@/features/audit/audit-page";
import { ClinicSelectionPage } from "@/features/auth/clinic-selection-page";
import { ClinicSignupPage } from "@/features/auth/clinic-signup-page";
import { LoginPage } from "@/features/auth/login-page";
import { SuperAdminLoginPage } from "@/features/auth/superadmin-login-page";
import { LandingPage } from "@/features/marketing/landing-page";
import { SubscriptionBillingView } from "@/features/subscription/subscription-billing-view";
import {
  CategoriesPage,
  ManufacturersPage,
} from "@/features/catalog/lookup-pages";
import { MedicinesPage } from "@/features/catalog/medicines-page";
import { DocumentsPage } from "@/features/documents/documents-page";
import { InventoryPage } from "@/features/inventory/inventory-page";
import {
  ExpensesPage,
  PatientsPage,
  SuppliersPage,
} from "@/features/operations/directory-pages";
import {
  PosPage,
  PurchasesPage,
  SalesPage,
} from "@/features/operations/transaction-pages";
import { ClinicsPage } from "@/features/platform/clinics-page";
import { PrescriptionsPage } from "@/features/practice/prescriptions-page";
import { QueuePage } from "@/features/practice/queue-page";
import { SchedulePage } from "@/features/practice/schedule-page";
import { useAuth } from "@/providers/auth-provider";

const DashboardPage = lazy(() =>
  import("@/features/dashboard/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  })),
);
const PatientRecordPage = lazy(() =>
  import("@/features/practice/patient-record-page").then((module) => ({
    default: module.PatientRecordPage,
  })),
);
const AppointmentEncounterPage = lazy(() =>
  import("@/features/practice/appointment-encounter-page").then((module) => ({
    default: module.AppointmentEncounterPage,
  })),
);
const DoctorProfilePage = lazy(() =>
  import("@/features/practice/doctor-profile-page").then((module) => ({
    default: module.DoctorProfilePage,
  })),
);
const ReportsPage = lazy(() =>
  import("@/features/reports/reports-page").then((module) => ({
    default: module.ReportsPage,
  })),
);
const PlatformDashboard = lazy(() =>
  import("@/features/platform/platform-dashboard").then((module) => ({
    default: module.PlatformDashboard,
  })),
);


import { AdminShell } from "@/components/layout/admin-shell";
import { DoctorLock } from "@/features/auth/doctor-lock";
import { DailyCollectionPage } from "@/features/practice/daily-collection-page";
import { DoctorConsultationDesk } from "@/features/practice/doctor-consultation-desk";
import { FollowUpCalendarPage } from "@/features/practice/followup-calendar-page";
import { OPDAnalyticsDesk } from "@/features/practice/opd-analytics-desk";
import { ReceptionDesk } from "@/features/practice/reception-desk";

function ProtectedLayout() {
  const { session, identity, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (!session) return <Navigate to="/login" replace />;
  if (
    !identity?.user.isPlatformAdmin &&
    identity &&
    identity.clinics.length > 1 &&
    !identity.selectedClinicId
  ) {
    return <ClinicSelectionPage />;
  }

  return <AppShell />;
}

function PlatformProtectedLayout() {
  const { session, identity, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (!session) return <Navigate to="/superadmin/login" replace />;
  if (!identity?.user.isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }
  return <AdminShell />;
}

function RootIndex() {
  const { session, identity, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (session) {
    if (identity?.user.isPlatformAdmin) {
      return <Navigate to="/superadmin" replace />;
    }
    return <Navigate to="/reception" replace />;
  }
  return <LandingPage />;
}

export function App() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        {/* Public SaaS Marketing & Self-Service Registration */}
        <Route path="/" element={<RootIndex />} />
        <Route path="/pricing" element={<LandingPage />} />
        <Route path="/signup" element={<ClinicSignupPage />} />
        <Route path="/register-clinic" element={<ClinicSignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Super Admin Platform Routes */}
        <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />

        <Route path="/superadmin" element={<PlatformProtectedLayout />}>
          <Route index element={<PlatformDashboard />} />
          <Route path="clinics" element={<ClinicsPage />} />
        </Route>
        <Route
          path="/platform"
          element={<Navigate to="/superadmin" replace />}
        />
        <Route
          path="/platform/clinics"
          element={<Navigate to="/superadmin/clinics" replace />}
        />

        {/* Standard Clinic Operations Routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="reception" element={<ReceptionDesk />} />
          <Route
            path="consultation"
            element={
              <DoctorLock>
                <DoctorConsultationDesk />
              </DoctorLock>
            }
          />
          <Route
            path="reminders"
            element={
              <DoctorLock>
                <FollowUpCalendarPage />
              </DoctorLock>
            }
          />
          <Route path="analytics" element={<OPDAnalyticsDesk />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="appointments" element={<SchedulePage />} />
          <Route
            path="appointments/:appointmentId"
            element={<AppointmentEncounterPage />}
          />
          <Route path="queue" element={<QueuePage />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="products" element={<MedicinesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="manufacturers" element={<ManufacturersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route
            path="purchase-orders"
            element={<Navigate to="/purchases" replace />}
          />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:patientId" element={<PatientRecordPage />} />
          <Route
            path="doctors/:doctorMembershipId"
            element={<DoctorProfilePage />}
          />
          <Route path="invoices" element={<Navigate to="/sales" replace />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="notices" element={<NoticeBoardPage />} />
          <Route path="daily-collection" element={<DailyCollectionPage />} />
          <Route path="subscription" element={<SubscriptionBillingView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
