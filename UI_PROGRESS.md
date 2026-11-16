# UI progress

Frontend-only build of the four MediStock interfaces. There is no backend work in this track. Every screen reads data through `src/services/mock-api.ts`, so it can be switched to real APIs later without changing screens.

Branch: `feat/ui-design-system`. Nothing has been committed yet.

## Where things live

| Path | What |
|---|---|
| `src/app/globals.css` | Design tokens (Tailwind v4 `@theme`, in the "MediStock design system tokens" block). The old element resets now sit in `@layer base` so new utilities can override them. |
| `src/design-system/` | Shared components: buttons, inputs, select, field, search, toggle, tabs, segmented control, badges, avatar, card, table, pagination, stat card, modal, drawer, confirm dialog, menu, app shell, empty, error and loading states, charts, formatting (₹, en-IN, dates) |
| `src/mocks/` | Small hand-written mock data: 1 hospital, 3 departments, 3 doctors (Dr. Arjun Mehta, Dr. Meera Iyer, Dr. Kavya Reddy), 7 patients (Sneha Patil, Rajesh Kulkarni, Aarav Sharma, Priya Deshmukh, Amit Joshi, Ishaan Nair, Kavita Shinde), 14 appointments, 3 staff. |
| `src/services/mock-api.ts` | Mock data source. Each function has a `TODO(api)` comment naming the endpoint that will replace it. |
| `src/portals/hospital/` | Hospital dashboard screens and their local state store |
| `src/app/hospital/*` | Hospital routes |
| `src/app/design` | Workspace picker linking the four interfaces |

The existing staff app (`/login`, `/reception`, `/queue`, …) is unchanged and still works alongside.

Mock "today" is fixed at **Mon 16 Nov 2026, 11:20 AM** (`DEMO_TODAY` / `DEMO_NOW` in `src/mocks/catalog.ts`). A fixed date keeps the server render and the browser render identical. Switch to the real clock once real APIs are connected.

## Design system

- **Colours:** deep healthcare blue (`brand-*`) as primary, teal as secondary, light neutral canvas, white cards, charcoal ink. Success, warning and danger colours are reserved for status and always appear with a label.
- **Type:** DM Sans at a 14px base, with tabular numbers for figures.
- **Shape:** 8px radius on controls, 12px on cards, 16px on sheets. Soft card shadows and a stronger shadow for popovers.
- **Charts:** validated colour order (blue, orange, aqua), 2px lines, 4px rounded bar caps, light gridlines, hover tooltips, and a legend only when there are two or more series.
- **Copy:** plain product language, with no em or en dashes, no invisible Unicode, no stock AI phrasing, and no "preview/sample/demo" wording.

## Status

### Phase 1: Inspect repository ✅
Next 16.4 (App Router, Cache Components), React 19, Tailwind 4, lucide-react, recharts, sonner.

### Phase 2: Design system ✅

### Phase 3: Layout and navigation ✅
Shared `AppShell`, configured per interface:
- sidebar sections, with a slide-in drawer on mobile
- top bar with Ctrl+K search and a notifications popover
- user menu, skip link

### Phase 4: Hospital dashboard ✅
| Page | Route | Status |
|---|---|---|
| Overview | `/hospital` | ✅ KPIs, today's appointments, live queue, doctor availability table, upcoming appointments, recent activity |
| Reception desk | `/hospital/reception` | ✅ Search by name, mobile or UHID → check in or book. One-click check-in with undo. Register new patient (spots duplicates), walk-in booking that pre-selects the next open slot, doctors-on-duty panel, token slip |
| Consultation queue | `/hospital/queue` | ✅ Column per doctor, call next / mark done / no-show, department filter, full-screen "Now serving" TV display |
| Appointments | `/hospital/appointments` | ✅ Date strip, search, doctor and channel filters, status tabs with counts, pagination, row actions (check in, reschedule, record payment, no-show, cancel with confirmation), CSV export |
| Calendar | `/hospital/calendar` | ✅ Day view: doctor columns on a time grid, current-time line, click an appointment for details, click a free slot to book. Week view: booked vs capacity per doctor per day |
| Patients | `/hospital/patients` | ✅ Search (also from the top bar `?q=`), gender, segment and sort filters, pagination, register, quick book |
| Patient details | `/hospital/patients/[id]` | ✅ Header with allergy and condition flags; tabs for overview, visits, consultations and billing; edit drawer |
| Doctors | `/hospital/doctors` | ✅ Cards with status changer and today's numbers; weekly schedule timeline view |
| Doctor profile | `/hospital/doctors/[id]` | ✅ KPIs, today's list, 2-week consultations chart, profile, weekly availability |
| Departments | `/hospital/departments` | ✅ Load, slot use, busy/normal flag, doctors |
| Reports | `/hospital/reports` | ✅ 7/14/28-day range vs prior period, stacked daily chart, fees trend, department ranking, doctor performance, CSV export |
| Staff | `/hospital/staff` | ✅ Search, role filter, invite (validated), suspend/reactivate, resend invite |
| Settings | `/hospital/settings` | ✅ Hospital profile, OPD hours, booking rules, patient notifications; save/discard with change tracking |

### Phase 5: Doctor dashboard ⏳ next
Today's schedule, new/upcoming/waiting/completed, patient info, consultation history, availability and leave, consultation workspace (history, notes, diagnosis, prescription, follow-up, complete).

### Phase 6: Patient app ⏳
Mobile-first landing page, hospital and doctor discovery, multi-step booking (hospital → department → doctor → date → time → details → review → confirmation with token), patient dashboard.

### Phase 7: Super admin ⏳
Overview, hospitals, details, onboarding, subscriptions, plans, leads CRM, sales pipeline, analytics, users, support, settings.

### Phase 8–9: Responsive polish and full testing ⏳
Done so far for the hospital dashboard: desktop and 390px mobile screenshots of every page, and 9 clicked-through flows (check in, search → book, booking with auto-selected slot, registration validation and success, call next, TV display, reschedule, header search, mobile menu). No console errors.

## Verification commands

- `npx tsc --noEmit` (passes)
- `npx eslint src/design-system src/portals src/mocks src/services src/app/hospital src/app/design` (passes)
- `npx playwright test` runs the existing staff-app suite.
