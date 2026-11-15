# MediStock — connected hospital care

A hospital workspace connecting reception, the doctor's desk, pharmacy and patient self-booking. The interface follows the Fabrix design reference: locally hosted DM Sans, deep navy, paper backgrounds, restrained colours and original SVG illustrations.

## Run locally

Use **Node.js 22.13 or newer**; Node.js 24 is recommended for the built-in SQLite runtime.

```sh
npm install
npm run dev
```

Open [the common staff login](http://localhost:3000/login) or [patient booking](http://localhost:3000/book). All staff use the same login screen. Their ID determines their department; there is no role selector or automatic administrator login.

Development-only accounts (with sample data):

| Department | Staff ID | Password |
| --- | --- | --- |
| Reception | `reception` | `Reception@123` |
| Doctor — Aarav | `doctor` | `Doctor@123` |
| Doctor — Meera | `doctor.meera` | `Doctor@123` |
| Doctor — Rohan | `doctor.rohan` | `Doctor@123` |
| Pharmacy | `pharmacy` | `Pharmacy@123` |
| Administrator | `admin` | `Admin@123` |

Production requires the corresponding passwords from `.env.example`; development accounts do not bypass that requirement. Passwords are hashed with scrypt, and each doctor account is bound to its own doctor ID. Staff sessions cannot change department from the header. The sidebar shows only tasks relevant to the signed-in department.

## Connected workflows

| Workspace | What works |
| --- | --- |
| Overview `/` | Today's visits, active queue, completed consultations, collected fees, actual visit chart, doctor availability and low stock |
| Reception `/reception` | New/returning patient intake, measured vitals (also editable after online check-in), allergies, doctor assignment, urgent priority, explicit payment recording, sequential daily tokens, cancellation and printable OPD slips |
| Doctor `/consultation` | Doctor-specific queue, start/save/complete consultation, recorded vitals and allergies, patient encounter history, formulary prescriptions, notes, follow-up recommendation and printable prescriptions |
| Pharmacy `/pharmacy` | EvoTech-style counter: completed prescription loading, OTC sales, barcode/name/batch lookup, discounts, included tax, cash change, UPI/card references, immutable receipts, bill history, cancellation/stock restoration, CSV export and atomic prescription dispensing |
| Patient booking `/book` | Public doctor/date/time selection, actual slot availability, patient details and consent, confirmation reference and downloadable calendar event |
| Manage booking `/book/manage` | Reference + mobile lookup, own appointment/queue status, rescheduling and cancellation before check-in; no clinical information is returned |
| Appointments `/appointments` | Date/doctor/search filters, online and walk-in visits, same-day check-in with token assignment and printable visit details |
| Patients `/patients` | Search by name/phone/ID, returning patient records, visit history and role-filtered clinical details |
| Inventory `/inventory` | Shared formulary, brand/generic/batch search, low stock/expiry filters, restocking, new batches, barcode/HSN/configured tax fields, prescription-required flag and CSV export |
| Billing `/pos` | Daily consultation collections, pending fee collection, payment receipts, separate pharmacy totals and CSV export |
| Follow-ups `/reminders` | Doctor-recommended follow-up dates; recommendations do not reserve an appointment |
| Patient queue `/queue` | Urgent-first/FIFO waiting board, call next, recall, hold/skip, return to queue, completed patients, room status and a token-only waiting-room display |
| Team messages `/messages` | Reception/doctor/pharmacy messages, doctor-specific recipients, acknowledgments, English/Hindi read-aloud and waiting-room announcements |

The hospital's default display name, doctor list, fees and locality are sample configuration. Update the shell, public booking page, printed letterhead and `src/features/hospital/types.ts` for your hospital.

## Persistence and permissions

- Records are stored **on the server in SQLite**, rather than in browser storage. Other devices connected to the same server share bookings, visits, prescriptions, messages, bills and stock. Staff screens refresh every two seconds and on window focus; changes also notify other tabs immediately. Sign-out clears the local workspace and notifies other tabs.
- `.data/hospital.sqlite` is the local database. `HOSPITAL_DATA_DIR` chooses another directory. The database, WAL files and session signing key are ignored by Git.
- SQLite transactions serialize bookings and stock changes. Concurrent attempts to book a reserved slot or dispense the same prescription again return a conflict without changing stock twice.
- Staff sessions use signed, HttpOnly, SameSite cookies. Production cookies also use Secure. API actions check staff roles and doctor ownership. Reception responses omit diagnosis, notes, prescriptions and pharmacy inventory; pharmacy sees completed prescriptions and its invoices, and doctors see their own assigned encounters. Only a message's receiving department can acknowledge it.
- Public endpoints return slot availability and the submitted appointment's confirmation. They do not expose a patient directory or clinical history.
- Click **Enable audio** in each reception/waiting-room browser to hear new messages and announcements. A user click is required by browser audio policies; microphones are not used. Historical messages can be replayed with Listen. Lobby announcements are heard even when the reception and waiting-room devices share the same reception login.
- Cash, UPI and card options **record payments received by staff**. They are not payment gateway integrations. No SMS, WhatsApp or email is sent. See [EvoTech integration details](docs/evotech-integration.md) for the source and exact billing scope.

## Production setup

Use a long-running Node.js server with **persistent disk**. The SQLite implementation is not suitable for ephemeral/serverless filesystems such as a default Vercel deployment. For that environment, migrate this data layer to a hosted database before deploying.

1. Copy `.env.example` to `.env.local`, configure staff IDs and a strong password for each required account. Additional Meera/Rohan doctor accounts are enabled only when their production passwords are configured.
2. Set `HOSPITAL_DATA_DIR` to a new, persistent directory for production. Do not reuse a development/demo database for patient records.
3. Leave `HOSPITAL_DEMO_MODE` unset. Production starts with an empty database and requires staff login; it never enables password-free demo access automatically. If HTTPS terminates at a reverse proxy, set `HOSPITAL_PUBLIC_ORIGIN` to the browser-facing origin.
4. Run `npm run build` and `npm start` behind HTTPS. Back up the database using SQLite's online backup facilities or a consistent stopped-server snapshot, including outstanding WAL data.

The implemented scope is the outpatient workflow above. Inpatient beds, lab integrations, insurance claims, arbitrary staff account provisioning, external SMS/email messaging and payment processing are separate integrations. Follow-ups are recommendations, not automatically booked visits. Refunds must be reconciled separately; cancelled consultation payments and pharmacy invoices keep their recorded history.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run test:production
```

Browser tests use Playwright WebKit (`npx playwright install webkit` if needed). The test server uses port 3100 and a fresh temporary database, then removes it. Stop the regular dev server before running tests because Next.js uses a per-checkout dev lock.

Tests cover ID/password login and logout, department-only navigation, doctor ownership, reception vitals → doctor consultation → pharmacy billing, calls/recalls/holds, cross-session messages and voice notifications, acknowledgments, invoice pricing/discounts/change/idempotency/returns, public booking conflicts and self-service management, printable slips, and mobile layouts. The production smoke test uses a separate temporary database on port 3101 to check authentication, signed cookies, role enforcement and public slots.

The older platform/subscription source and Prisma schema remain for later integration; old signup and superadmin entry points redirect to the common login/workspace. The hospital uses `/api/hospital`, `/api/staff`, `/api/booking` and `/api/booking/manage`.
