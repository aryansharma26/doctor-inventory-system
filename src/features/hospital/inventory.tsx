"use client";
import { useState } from "react";
import { AlertCircle, Download, Package, Plus, Search } from "lucide-react";
import { useHospital } from "./provider";
import {
  clinicDate,
  dateAfter,
  money,
  prettyDate,
  type Medicine,
} from "./types";
import { downloadCsv, Empty, Field, Modal, PageHeading } from "./ui";

export function Inventory() {
  const { medicines, act } = useHospital();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [add, setAdd] = useState(false);
  const [restock, setRestock] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState("50");
  const [busy, setBusy] = useState(false);
  const filtered = medicines.filter(
    (m) =>
      `${m.name} ${m.generic} ${m.batch}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "low" && m.stock <= m.reorderAt) ||
        (filter === "expiry" && m.expiry <= dateAfter(30))),
  );
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE PREPARATION GOES A LONG WAY"
        title="Care, always in stock."
        description="A shared formulary, clear stock levels and fewer last-minute surprises."
      >
        <button
          className="button secondary"
          onClick={() =>
            downloadCsv(`medicine-inventory-${clinicDate()}.csv`, [
              [
                "Medicine",
                "Generic",
                "Strength",
                "Batch",
                "Expiry",
                "Stock",
                "Reorder level",
                "Price INR",
              ],
              ...medicines.map((m) => [
                m.name,
                m.generic,
                m.strength,
                m.batch,
                m.expiry,
                m.stock,
                m.reorderAt,
                m.price,
              ]),
            ])
          }
        >
          <Download size={15} />
          Export stock
        </button>
        <button className="button primary" onClick={() => setAdd(true)}>
          <Plus size={16} />
          Add medicine / batch
        </button>
      </PageHeading>
      <div className="summary-strip">
        <button onClick={() => setFilter("all")}>
          <Package size={19} />
          <strong>{medicines.length}</strong>
          <span>Medicines & batches</span>
        </button>
        <button onClick={() => setFilter("low")}>
          <AlertCircle size={19} />
          <strong>
            {medicines.filter((m) => m.stock <= m.reorderAt).length}
          </strong>
          <span>Below reorder level</span>
        </button>
        <button onClick={() => setFilter("expiry")}>
          <strong>
            {medicines.filter((m) => m.expiry <= dateAfter(30)).length}
          </strong>
          <span>Expire within 30 days</span>
        </button>
        <div>
          <strong>
            {money(medicines.reduce((sum, m) => sum + m.price * m.stock, 0))}
          </strong>
          <span>Stock retail value</span>
        </div>
      </div>
      <section className="surface">
        <div className="table-toolbar">
          <div className="table-tabs">
            {[
              { value: "all", label: "All medicines" },
              { value: "low", label: "Low stock" },
              { value: "expiry", label: "Expiring soon" },
            ].map((t) => (
              <button
                className={filter === t.value ? "tab-active" : ""}
                key={t.value}
                onClick={() => setFilter(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="live-indicator">
            <i />
            Linked to pharmacy dispensing
          </span>
        </div>
        <div className="filter-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search medicines"
              placeholder="Search brand, generic or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine / generic</th>
                <th>Category</th>
                <th>Batch / expiry</th>
                <th>Available stock</th>
                <th>Unit price</th>
                <th className="align-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong className="cell-title">
                      {m.name}{" "}
                      <span className="medicine-strength">{m.strength}</span>
                    </strong>
                    <span className="cell-sub">{m.generic}</span>
                  </td>
                  <td>
                    <span className="cell-sub">{m.category}</span>
                  </td>
                  <td>
                    <strong className="cell-title">{m.batch}</strong>
                    <span
                      className={`cell-sub ${m.expiry <= dateAfter(30) ? "text-amber" : ""}`}
                    >
                      {prettyDate(m.expiry)}
                      {m.expiry <= clinicDate() ? " · Expired" : ""}
                    </span>
                  </td>
                  <td>
                    <strong className="cell-title">{m.stock} units</strong>
                    <span
                      className={`cell-sub ${m.stock <= m.reorderAt ? "text-amber" : "text-green"}`}
                    >
                      {m.stock <= m.reorderAt
                        ? "Reorder needed"
                        : "Stock available"}{" "}
                      · min. {m.reorderAt}
                    </span>
                  </td>
                  <td>
                    <strong className="cell-title">{money(m.price)}</strong>
                  </td>
                  <td className="align-right">
                    <button
                      className="button secondary small"
                      onClick={() => {
                        setRestock(m);
                        setQuantity("50");
                      }}
                      disabled={m.expiry <= clinicDate()}
                    >
                      <Plus size={13} />
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <Empty
              title="No medicines in this view"
              description="Try another search or add a new medicine to your formulary."
            />
          )}
        </div>
        <div className="table-footer">
          <span>{filtered.length} medicines / batches</span>
          <span>Expired batches cannot be prescribed or dispensed.</span>
        </div>
      </section>
      {restock && (
        <Modal
          title="A little top-up."
          description="Add received stock to the same batch. Use Add medicine / batch for a new batch or expiry."
          close={() => setRestock(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await act(
                  {
                    action: "restock",
                    medicineId: restock.id,
                    quantity: Number(quantity),
                  },
                  "Stock received and saved.",
                );
                setRestock(null);
              } catch {
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="modal-body">
              <h3>
                {restock.name} {restock.strength}
              </h3>
              <p className="form-note">
                Batch {restock.batch} · {restock.stock} units available · Expiry{" "}
                {prettyDate(restock.expiry)}
              </p>
              <div className="stock-quantity-field">
                <Field label="Quantity received (units)">
                  <input
                    required
                    type="number"
                    min={1}
                    max={100000}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </Field>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setRestock(null)}
              >
                Cancel
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? "Saving…" : "Receive stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {add && (
        <Modal
          title="Make room for better care."
          description="Add a medicine or a new batch to the hospital formulary."
          close={() => setAdd(false)}
          wide
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget));
              setBusy(true);
              try {
                await act(
                  {
                    ...data,
                    action: "medicine",
                    stock: Number(data.stock),
                    price: Number(data.price),
                    reorderAt: Number(data.reorderAt),
                    gstPercent: Number(data.gstPercent),
                    prescriptionRequired: data.prescriptionRequired === "on",
                  },
                  "Medicine added to the formulary.",
                );
                setAdd(false);
              } catch {
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="modal-body form-grid">
              {[
                {
                  key: "name",
                  label: "Brand / medicine name",
                  placeholder: "Medicine name",
                },
                {
                  key: "generic",
                  label: "Generic name",
                  placeholder: "Generic formulation",
                },
                {
                  key: "category",
                  label: "Category",
                  placeholder: "e.g. Analgesic",
                },
                {
                  key: "strength",
                  label: "Strength / formulation",
                  placeholder: "e.g. 500 mg tablet",
                },
                {
                  key: "batch",
                  label: "Batch number",
                  placeholder: "Batch reference",
                },
              ].map((f) => (
                <Field label={`${f.label} *`} key={f.key}>
                  <input
                    name={f.key}
                    required
                    minLength={
                      f.key === "strength" || f.key === "batch" ? 1 : 2
                    }
                    maxLength={
                      f.key === "name" || f.key === "generic" ? 100 : 60
                    }
                    placeholder={f.placeholder}
                  />
                </Field>
              ))}
              <Field label="Expiry date *">
                <input type="date" name="expiry" required min={dateAfter(1)} />
              </Field>
              <Field label="Opening stock (units) *">
                <input
                  type="number"
                  required
                  name="stock"
                  min={0}
                  max={100000}
                  defaultValue={0}
                />
              </Field>
              <Field label="Unit selling price (₹) *">
                <input
                  type="number"
                  required
                  name="price"
                  min={0}
                  max={100000}
                  step="0.01"
                />
              </Field>
              <Field label="Barcode (optional)">
                <input name="barcode" maxLength={100} />
              </Field>
              <Field label="HSN (optional)">
                <input name="hsn" maxLength={20} />
              </Field>
              <Field label="Tax included in selling price (%)">
                <input
                  name="gstPercent"
                  type="number"
                  min={0}
                  max={40}
                  step="0.01"
                  defaultValue={0}
                />
              </Field>
              <label className="check-label">
                <input
                  type="checkbox"
                  name="prescriptionRequired"
                  defaultChecked
                />
                Requires a prescription
              </label>
              <Field label="Reorder level (units) *">
                <input
                  type="number"
                  name="reorderAt"
                  required
                  min={0}
                  max={10000}
                  defaultValue={20}
                />
              </Field>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setAdd(false)}
              >
                Cancel
              </button>
              <button className="button primary" disabled={busy}>
                <Plus size={15} />
                {busy ? "Adding…" : "Add medicine / batch"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
