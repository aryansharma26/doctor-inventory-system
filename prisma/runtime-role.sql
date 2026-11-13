-- Run as the database owner during infrastructure provisioning.
-- Replace the password through your secret manager; never commit it.
CREATE ROLE clinora_app
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOBYPASSRLS;

GRANT CONNECT ON DATABASE clinic_inventory TO clinora_app;
GRANT USAGE ON SCHEMA public, app TO clinora_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clinora_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clinora_app;
GRANT EXECUTE ON FUNCTION app.current_clinic_id() TO clinora_app;
GRANT EXECUTE ON FUNCTION app.is_platform_admin() TO clinora_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clinora_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO clinora_app;

-- Defense in depth: even explicit grants cannot mutate immutable audit records.
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "AuditLog" FROM clinora_app;

