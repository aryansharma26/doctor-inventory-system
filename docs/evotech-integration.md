# EvoTech pharmacy integration

Reference: [yatinmanchanda1/EvoTech](https://github.com/yatinmanchanda1/EvoTech), main at `61f07e9e4e57bd51cea938501754f99831a6531b` (downloaded using the user's authorised Aryan Chrome profile).

A source-only local copy is in `.references/EvoTech/`, excluded from Git. Environment files and dependencies were not copied. The reference application was not started and its cloud database was not modified.

The pharmacy counter adapts these EvoTech workflows:

- `src/lib/print.ts`: GST-inclusive selling prices split into taxable value and included tax; bill totals and quantities.
- `src/lib/bills.ts`: sequential invoice references, frozen invoice lines, patient/customer and payment details, retained cancelled bill numbers, and stock restoration on cancellation.
- `src/lib/gst.ts` and the billing screens were reviewed for the source data model. Tax classifications are configured on each hospital medicine/batch; the app does not infer a medicine's tax classification.

Hospital implementation:

- `src/features/hospital/invoice-math.ts` calculates line amounts and discounts to paise precision.
- `src/features/hospital/server.ts` owns prices, batch expiry, prescribed quantities, stock checks, bill numbering, payment recording and cancellation, in SQLite transactions.
- `src/features/hospital/pharmacy.tsx` provides prescription loading, OTC counter sales, barcode/name/batch lookup, discounts, cash change, UPI/card references, bill history, returns and CSV exports.
- `src/features/hospital/invoice-print.tsx` prints the stored bill; later stock or price changes cannot alter its recorded lines.

Both prescription dispensing and billing use the same transaction. Repeating an identical checkout request returns its existing bill. A second checkout of a dispensed prescription is refused. A cancelled bill restores stock once and makes its linked prescription available for rebilling. The bill number and reason remain in history.

This integrates the billing workflow into the hospital's own database. It is not a live connection to EvoTech's Supabase service or its Tauri desktop database. Supplier bill OCR, purchase management and cloud customer messaging remain outside this integration. Payments are recorded after staff receive them; no payment gateway or automatic refund is invoked. Printed documents are sale receipts; hospital tax registration and statutory invoice details must be configured separately before using them as statutory tax documents.
