# MediStock — Clinic Practice & Inventory Management

MediStock is a production-oriented, multi-tenant clinic practice and inventory platform. The frontend and backend are independent projects. Clinic operational data is isolated by `clinicId`, middleware membership checks, repository filters, and forced PostgreSQL Row-Level Security.

## Included

- Supabase Authentication and private Storage integration
- Clinic Owner as the single clinic administrator; no duplicate Clinic Admin role
- Super Admin clinic management and platform analytics
- Products, medicine categories, manufacturers and clinic-specific pricing
- Batch/location inventory, expiry tracking, immutable stock movements and adjustments
- Suppliers, purchase orders and transactional receiving
- Patient 360 profiles with personal details, emergency contacts, allergies, vitals, diagnoses, medical history, labs, vaccinations, insurance, follow-ups, documents and a unified timeline
- Appointment encounters linking the patient, doctor, symptoms, diagnosis, prescription, invoice, payment, follow-up date and attachments
- One-click prescription and service-invoice generation from an appointment
- Separate payment receipts and outstanding-balance tracking
- Appointment calendar, live daily queue, doctor profiles, working hours and time-off scheduling
- Role-focused Receptionist, Doctor, Accountant and Super Admin dashboard metrics
- Sales, invoices and POS checkout with FEFO stock deduction
- Non-dental practice workflows; no tooth charting or dental-only modules
- Expense tracking and live monthly reports
- Audit logs, documents, permissions and read-only support impersonation
- Zod validation, rate limiting, security headers, restricted CORS and redacted logs

## Architecture

`backend` and `frontend` have separate dependencies, environment files and production builds.

The backend uses feature modules with routes, controllers, validators, services and repositories. Business writes are audited and tenant operations run inside a transaction that establishes the PostgreSQL authorization context.

The frontend uses React Query for server state, React Hook Form and Zod for forms, TanStack Table for inventory, Recharts for analytics, and Framer Motion for transitions.

## Hosted Supabase setup

Requirements: Node.js 20.19+ and a Supabase project. PostgreSQL, authentication and file storage are hosted by Supabase; Docker is not required.

1. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.
2. Install backend dependencies: `cd backend && npm install`.
3. Install frontend dependencies: `cd ../frontend && npm install`.
4. Put the Supabase direct database connection in `backend/.env` as `MIGRATION_DATABASE_URL`.
5. From `backend`, run `npm run db:deploy`.
6. Execute `backend/prisma/runtime-role.sql` once through the Supabase SQL editor as the database owner.
7. Put the restricted `clinora_app` connection in `backend/.env` as `DATABASE_URL`.
8. Optionally run `npm run db:seed` from `backend`.
9. From `backend`, run `npx tsx prisma/create-clinic-user.ts` to create matching clinic memberships.
10. Run `npm run dev` in one terminal from `backend`.
11. Run `npm run dev` in another terminal from `frontend`.

The frontend opens at `http://localhost:5173`; the API listens at `http://localhost:4000`.

Create a private Storage bucket matching `SUPABASE_STORAGE_BUCKET`. The service-role key belongs only in the backend and must never use a `VITE_` prefix. Configure the final frontend URL in Supabase Auth redirect settings and in `FRONTEND_URL`.

## Production checklist

- Deploy migrations before the API and use the restricted runtime database role.
- Host frontend and API separately on managed providers; configure TLS and final CORS origins.
- Store secrets in the hosting provider’s secret manager and rotate service-role credentials.
- Configure Redis for distributed rate limiting and durable jobs when horizontally scaling.
- Enable Supabase backups/PITR and perform restore drills.
- Add malware scanning and lifecycle rules for uploaded documents.
- Schedule expiry alerts and forward logs/audit events to tamper-resistant storage.

## Security model

The API verifies Supabase bearer tokens and loads platform privileges plus clinic membership server-side. Changing `x-clinic-id` cannot grant access to a clinic the caller does not belong to.

Tenant-owned tables use forced PostgreSQL Row-Level Security. The API must use the `clinora_app` role from `backend/prisma/runtime-role.sql`, never the database owner, a superuser, or a role with `BYPASSRLS`.

Authorization is enforced through clinic membership, granular role permissions, tenant-aware repositories and forced PostgreSQL RLS. Support impersonation is time-limited, read-only and audited.
