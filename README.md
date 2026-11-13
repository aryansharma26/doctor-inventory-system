# MediStock — Multi-Tenant Clinical Practice & Inventory SaaS

> Clean clinical practice management, pharmacy POS, OPD live queues, and multi-tenant SaaS billing built for modern clinics in the Philippines.

**Live Production App:** [https://doctor-inventory-system.vercel.app](https://doctor-inventory-system.vercel.app)

---

## ⚡ Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router, React 19)
- **Styling**: Tailwind CSS v4 (Clean Clinical Minimalist aesthetic — Linear/shadcn inspired, neutral zinc palette, crisp 1px borders, high-density data tables)
- **ORM / Database**: Prisma 6 with PostgreSQL / Supabase
- **State Management**: Zero-dependency SSR-safe local stores with automatic sync
- **Deployment**: Vercel Serverless Edge & Static Prerendering

---

## 🔑 Instant 1-Click Demo Accounts

No complex registration or dead endpoints. On the [Login Page](https://doctor-inventory-system.vercel.app/login), click any 1-Click Demo button:

| Role | Email | Password | Doctor Lock PIN | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Doctor** | `doctor@medistock.ph` | *(Pre-filled)* | `1234` | Consultation desk, Rx prescribing, clinical templates, follow-up calendar |
| **Reception** | `reception@medistock.ph` | *(Pre-filled)* | — | Patient intake, vitals CDS alerting, queue token generation, fee collection |
| **SuperAdmin**| `superadmin@medistock.ph` | *(Pre-filled)* | — | Platform MRR/ARR command center, tenant clinics, 14-day trial extensions |

---

## 🏥 Key Clinical & SaaS Features

1. **OPD Reception Desk** (`/reception`):
   - Fast patient check-in with automatic sequential token generation (`OPD-101`, `OPD-102`).
   - Clinical Decision Support (CDS) for abnormal BP, heart rate, temperature, SpO2.
   - Immediate consultation fee collection with GCash, Maya, and Cash receipt tracking.

2. **Doctor Consultation Desk** (`/consultation`):
   - Minimalist PIN gatekeeper (PIN `1234`) ensuring doctor privacy between patient consults.
   - 1-Click clinical diagnostic presets (URTI, Hypertension, Acute Gastritis).
   - Drug formulary prescription generator with dosage, frequency, and duration.
   - Printable clinical prescriptions and follow-up recall scheduling.

3. **Live Calling Queue Display** (`/queue`):
   - 3-column real-time board (Waiting, In Consultation, Completed).
   - Web Speech API integration for crystal-clear auditory token calling.

4. **Pharmacy POS & Billing** (`/pos`):
   - BIR-compliant official receipts with VAT breakdowns and Senior/PWD 20% discount support.
   - Philippine localized payment rails: GCash QR, Maya, Credit Card, and Cash.

5. **Pharmacy & Medical Inventory** (`/inventory`):
   - Real-time stock counts, reorder level warnings, and batch expiry monitoring.

6. **Multi-Tenant SaaS Subscription Engine** (`/subscription`):
   - 3 SaaS tiers (Starter ₱1,499, Pro ₱3,499, Enterprise ₱7,999) with monthly & annual discounts.
   - 14-day free trial engine with quota meters for doctor seats, staff accounts, and monthly patient consults.

7. **Platform SuperAdmin Command Center** (`/superadmin`):
   - Real-time MRR, ARR, active tenant clinic counts, and 1-click +14-day trial extensions.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

```bash
npm run build
npm run start
```
