-- Supabase publishes the "public" schema through its Data API (PostgREST).
-- This app talks to Postgres directly via Prisma and never uses that API, so:
--  1. enable row-level security (deny-all, no policies) on every table that
--     did not have it yet, and
--  2. remove the Data API roles' access to the schema entirely.
-- The app's database role bypasses RLS, so app behaviour is unchanged.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Clinic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImpersonationSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Manufacturer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Medicine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicineCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Permission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RolePermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserClinic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserClinicPermission" ENABLE ROW LEVEL SECURITY;

-- Supabase-specific roles; skipped on plain Postgres where they don't exist.
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', r);
    END IF;
  END LOOP;
END $$;
