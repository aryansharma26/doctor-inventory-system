"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, Download, Mail, MoreHorizontal, RotateCcw, Save, UserPlus } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  FilterBar,
  IconButton,
  Input,
  Menu,
  Modal,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  StatCard,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  Tabs,
  Textarea,
  Toggle,
  addDays,
  dayName,
  formatDate,
  formatINR,
  formatINRCompact,
  formatPhone,
  weekdayOf,
} from "@/design-system";
import { ChartLegend, ColumnChart, RankedBars, TrendChart } from "@/design-system/charts";
import { DEMO_TODAY } from "@/mocks/catalog";
import type { StaffMember, StaffRole } from "@/mocks/types";
import { useWorkspace } from "./store";

/* ================================================================ Reports */

export function ReportsPage() {
  const { state } = useWorkspace();
  const [range, setRange] = useState<"7" | "14" | "28">("28");
  const days = Number(range);
  const from = addDays(DEMO_TODAY, -days);
  const prevFrom = addDays(from, -days);

  const inRange = state.appointments.filter((a) => a.date >= from && a.date < DEMO_TODAY);
  const prev = state.appointments.filter((a) => a.date >= prevFrom && a.date < from);

  const summarise = (list: typeof inRange) => {
    const done = list.filter((a) => a.status === "completed");
    const booked = list.filter((a) => a.status !== "cancelled");
    return {
      visits: done.length,
      revenue: done.filter((a) => a.paid).reduce((s, a) => s + a.fee, 0),
      noShow: booked.length ? (list.filter((a) => a.status === "no-show").length / booked.length) * 100 : 0,
      online: booked.length ? (booked.filter((a) => a.channel === "online").length / booked.length) * 100 : 0,
    };
  };
  const cur = summarise(inRange);
  const old = summarise(prev);
  const delta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);

  const daily = useMemo(
    () =>
      Array.from({ length: days }, (_, i) => addDays(from, i))
        .filter((d) => weekdayOf(d) !== 0)
        .map((d) => {
          const list = inRange.filter((a) => a.date === d);
          return {
            day: `${d.slice(8)}/${d.slice(5, 7)}`,
            completed: list.filter((a) => a.status === "completed").length,
            noshow: list.filter((a) => a.status === "no-show").length,
            revenue: list.filter((a) => a.status === "completed" && a.paid).reduce((s, a) => s + a.fee, 0),
          };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, state.appointments],
  );

  const byDept = state.departments
    .map((dep) => {
      const list = inRange.filter((a) => a.departmentId === dep.id && a.status === "completed");
      return { label: dep.name, value: list.length, sub: formatINRCompact(list.reduce((s, a) => s + a.fee, 0)) };
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const byDoctor = state.doctors
    .map((d) => {
      const list = inRange.filter((a) => a.doctorId === d.id);
      const done = list.filter((a) => a.status === "completed");
      const booked = list.filter((a) => a.status !== "cancelled");
      return {
        d,
        visits: done.length,
        followUps: done.filter((a) => a.visitType === "follow-up").length,
        noShow: booked.length ? Math.round((list.filter((a) => a.status === "no-show").length / booked.length) * 100) : 0,
        revenue: done.reduce((s, a) => s + a.fee, 0),
      };
    })
    .sort((a, b) => b.visits - a.visits);

  function exportCsv() {
    const lines = [
      ["Doctor", "Consultations", "Follow-ups", "No-show %", "Fees (INR)"].join(","),
      ...byDoctor.map((r) => [r.d.name, r.visits, r.followUps, r.noShow, r.revenue].join(",")),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `doctor-report-${range}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description={`${formatDate(from)} to ${formatDate(addDays(DEMO_TODAY, -1))} · compared with the previous ${days} days`}
        actions={
          <>
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: "7", label: "7 days" },
                { value: "14", label: "14 days" },
                { value: "28", label: "28 days" },
              ]}
            />
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv}>
              Export CSV
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Consultations" value={cur.visits.toLocaleString("en-IN")} delta={delta(cur.visits, old.visits)} deltaLabel="vs prior period" />
        <StatCard label="Consultation fees" value={formatINRCompact(cur.revenue)} delta={delta(cur.revenue, old.revenue)} deltaLabel="vs prior period" />
        <StatCard label="No-show rate" value={`${cur.noShow.toFixed(1)}%`} delta={delta(cur.noShow, old.noShow)} invertDelta deltaLabel="vs prior period" />
        <StatCard label="Booked online" value={`${Math.round(cur.online)}%`} delta={delta(cur.online, old.online)} deltaLabel="vs prior period" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Daily consultations" description="Completed visits and no-shows per OPD day" />
          <div className="px-5">
            <ChartLegend series={[{ key: "completed", label: "Completed" }, { key: "noshow", label: "No-show" }]} />
          </div>
          <div className="px-3 pb-4">
            <ColumnChart data={daily} xKey="day" stacked series={[{ key: "completed", label: "Completed" }, { key: "noshow", label: "No-show" }]} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Consultation fees collected" description="Paid OPD fees per day, in ₹" />
          <div className="px-3 pb-4">
            <TrendChart data={daily} xKey="day" series={[{ key: "revenue", label: "Fees collected" }]} height={262} format={formatINRCompact} />
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="By department" description="Consultations · fees" />
          <div className="px-5 pb-5">
            <RankedBars items={byDept} />
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Doctor performance" />
          <Table>
            <THead>
              <Th>Doctor</Th>
              <Th className="text-right">Consultations</Th>
              <Th className="text-right">Follow-ups</Th>
              <Th className="text-right">No-show</Th>
              <Th className="text-right">Fees</Th>
            </THead>
            <TBody>
              {byDoctor.map((r) => (
                <Tr key={r.d.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.d.name} size="xs" />
                      <span className="whitespace-nowrap">{r.d.name}</span>
                    </div>
                  </Td>
                  <Td className="tnum text-right">{r.visits}</Td>
                  <Td className="tnum text-right text-ink-muted">{r.followUps}</Td>
                  <Td className={`tnum text-right ${r.noShow >= 10 ? "font-medium text-danger-700" : "text-ink-muted"}`}>{r.noShow}%</Td>
                  <Td className="tnum text-right">{formatINR(r.revenue)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  );
}

/* ================================================================== Staff */

const ROLES: StaffRole[] = ["Administrator", "Receptionist", "Nurse", "Pharmacist", "Billing", "Lab technician"];

export function StaffPage() {
  const { state, upsertStaff } = useWorkspace();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const rows = state.staff
    .filter((s) => !role || s.role === role)
    .filter((s) => {
      const t = q.trim().toLowerCase();
      return !t || s.name.toLowerCase().includes(t) || s.email.includes(t);
    });

  const statusBadge = (s: StaffMember["status"]) =>
    s === "active" ? <Badge tone="success" dot>Active</Badge> : s === "invited" ? <Badge tone="info" dot>Invite sent</Badge> : <Badge tone="danger" dot>Suspended</Badge>;

  return (
    <>
      <PageHeader
        title="Staff"
        description={`${state.staff.filter((s) => s.status === "active").length} active members · ${state.doctors.length} doctors are managed under Doctors`}
        actions={
          <Button icon={<UserPlus className="size-4" />} onClick={() => setInviteOpen(true)}>
            Invite staff
          </Button>
        }
      />
      <Card>
        <FilterBar className="border-b border-line">
          <SearchInput value={q} onChange={setQ} placeholder="Search name or email" className="sm:w-72" />
          <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-48">
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </FilterBar>
        {rows.length === 0 ? (
          <EmptyState title="No staff match" />
        ) : (
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Shift</Th>
              <Th>Status</Th>
              <Th>Last active</Th>
              <Th className="w-12">
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <TBody>
              {rows.map((s) => (
                <Tr key={s.id}>
                  <Td className="min-w-64">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.name}</p>
                        <p className="truncate text-xs text-ink-muted">{s.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {s.role}
                    <p className="text-xs text-ink-muted">{s.department}</p>
                  </Td>
                  <Td>{s.shift}</Td>
                  <Td>{statusBadge(s.status)}</Td>
                  <Td className="whitespace-nowrap text-ink-muted">{s.lastActive}</Td>
                  <Td>
                    <Menu
                      items={[
                        ...(s.status === "invited"
                          ? [{ label: "Resend invite", icon: <Mail />, onSelect: () => toast.success(`Invite resent to ${s.email}`) }]
                          : []),
                        s.status === "suspended"
                          ? { label: "Reactivate", icon: <RotateCcw />, onSelect: () => { upsertStaff({ ...s, status: "active" }); toast.success(`${s.name} reactivated`); } }
                          : { label: "Suspend access", icon: <Ban />, tone: "danger" as const, onSelect: () => { upsertStaff({ ...s, status: "suspended" }); toast.success(`${s.name}'s access suspended`); } },
                      ]}
                      trigger={(p) => (
                        <IconButton label={`Actions for ${s.name}`} size="sm" {...p}>
                          <MoreHorizontal className="size-4" />
                        </IconButton>
                      )}
                    />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      {inviteOpen && <InviteStaffModal onClose={() => setInviteOpen(false)} />}
    </>
  );
}

function InviteStaffModal({ onClose }: { onClose: () => void }) {
  const { upsertStaff } = useWorkspace();
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "Receptionist" as StaffRole, shift: "Morning" as StaffMember["shift"] });
  const [error, setError] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title="Invite staff member"
      description="An email invite is sent to set a password. Access is based on role."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon={<Mail className="size-4" />}
            onClick={() => {
              if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
                setError("Enter a name and a valid email address.");
                return;
              }
              upsertStaff({
                id: `s-${Date.now()}`,
                ...form,
                department: form.role === "Receptionist" ? "Front desk" : form.role,
                status: "invited",
                lastActive: "-",
                joinedOn: DEMO_TODAY,
              });
              toast.success("Invite sent", { description: form.email });
              onClose();
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required className="sm:col-span-2">
          {(id) => <Input id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        <Field label="Work email" required error={error || undefined}>
          {(id) => <Input id={id} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        </Field>
        <Field label="Mobile">
          {(id) => <Input id={id} inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}
        </Field>
        <Field label="Role">
          {(id) => (
            <Select id={id} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Shift">
          {(id) => (
            <Select id={id} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value as StaffMember["shift"] })}>
              {["Morning", "Evening", "Night", "General"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </Modal>
  );
}

/* =============================================================== Settings */

type SettingsTab = "profile" | "hours" | "booking" | "notifications";

export function SettingsPage() {
  const { state } = useWorkspace();
  const h = state.hospital;
  const [tab, setTab] = useState<SettingsTab>("profile");
  const initial = useMemo(
    () => ({
      name: h.name,
      phone: h.phone,
      email: h.email,
      address: h.address,
      pincode: h.pincode,
      gstin: "27AABCA1234F1Z5",
      about: h.about,
      hours: [1, 2, 3, 4, 5, 6, 0].map((wd) => ({ wd, open: wd !== 0, from: "09:00", to: wd === 6 ? "14:00" : "20:00" })),
      onlineBooking: true,
      walkIns: true,
      bookingWindow: "14",
      cancelCutoff: "2",
      tokenFormat: "doctor",
      payAtBooking: false,
      smsConfirm: true,
      whatsapp: true,
      reminder: true,
      turnAlert: true,
      dailySummary: false,
    }),
    [h],
  );
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const [saved, setSaved] = useState(initial);
  const changed = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <PageHeader
        title="Hospital settings"
        description="Changes apply to the patient app and all front-desk screens."
        actions={
          <>
            {changed && (
              <Button variant="ghost" onClick={() => setForm(saved)}>
                Discard
              </Button>
            )}
            <Button
              disabled={!changed}
              icon={<Save className="size-4" />}
              onClick={() => {
                setSaved(form);
                toast.success("Settings saved");
              }}
            >
              Save changes
            </Button>
          </>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "profile", label: "Hospital profile" },
          { value: "hours", label: "OPD hours" },
          { value: "booking", label: "Booking rules" },
          { value: "notifications", label: "Patient notifications" },
        ]}
      />
      <div className="mt-5 max-w-3xl">
        {tab === "profile" && (
          <Card className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hospital name" className="sm:col-span-2">
                {(id) => <Input id={id} value={form.name} onChange={(e) => set("name", e.target.value)} />}
              </Field>
              <Field label="Public phone">{(id) => <Input id={id} value={form.phone} onChange={(e) => set("phone", e.target.value)} />}</Field>
              <Field label="Public email">{(id) => <Input id={id} value={form.email} onChange={(e) => set("email", e.target.value)} />}</Field>
              <Field label="Address" className="sm:col-span-2">
                {(id) => <Input id={id} value={form.address} onChange={(e) => set("address", e.target.value)} />}
              </Field>
              <Field label="PIN code">{(id) => <Input id={id} inputMode="numeric" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />}</Field>
              <Field label="GSTIN" hint="Printed on invoices">{(id) => <Input id={id} value={form.gstin} onChange={(e) => set("gstin", e.target.value)} />}</Field>
              <Field label="About" hint="Shown on your public hospital page" className="sm:col-span-2">
                {(id) => <Textarea id={id} rows={4} value={form.about} onChange={(e) => set("about", e.target.value)} />}
              </Field>
            </div>
          </Card>
        )}
        {tab === "hours" && (
          <Card>
            <CardHeader title="OPD hours" description="Default hours for the hospital. Individual doctors can work inside these hours." />
            <ul className="divide-y divide-line border-t border-line">
              {form.hours.map((row, i) => (
                <li key={row.wd} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-28 text-sm font-medium">{dayName(row.wd, true)}</span>
                  <div className="w-24">
                    <Toggle
                      checked={row.open}
                      label={row.open ? "Open" : "Closed"}
                      onChange={(v) => set("hours", form.hours.map((r, j) => (j === i ? { ...r, open: v } : r)))}
                    />
                  </div>
                  {row.open ? (
                    <div className="flex items-center gap-2">
                      <Input type="time" aria-label={`${dayName(row.wd, true)} opens`} value={row.from} onChange={(e) => set("hours", form.hours.map((r, j) => (j === i ? { ...r, from: e.target.value } : r)))} className="w-32" />
                      <span className="text-ink-subtle">to</span>
                      <Input type="time" aria-label={`${dayName(row.wd, true)} closes`} value={row.to} onChange={(e) => set("hours", form.hours.map((r, j) => (j === i ? { ...r, to: e.target.value } : r)))} className="w-32" />
                    </div>
                  ) : (
                    <span className="text-[13px] text-ink-subtle">Emergency only</span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {tab === "booking" && (
          <Card className="divide-y divide-line">
            <div className="space-y-5 p-5">
              <Toggle checked={form.onlineBooking} onChange={(v) => set("onlineBooking", v)} label="Accept online bookings" description="Patients can book from the MediStock patient app and your hospital page." />
              <Toggle checked={form.walkIns} onChange={(v) => set("walkIns", v)} label="Allow walk-in tokens" description="Reception can issue tokens for patients without an appointment." />
              <Toggle checked={form.payAtBooking} onChange={(v) => set("payAtBooking", v)} label="Collect fee at online booking" description="Patients pay by UPI or card when booking. Otherwise they pay at the desk." />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="Booking window" hint="How far ahead patients can book">
                {(id) => (
                  <Select id={id} value={form.bookingWindow} onChange={(e) => set("bookingWindow", e.target.value)}>
                    {["7", "14", "30"].map((d) => (
                      <option key={d} value={d}>
                        {d} days
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Free cancellation" hint="Before appointment time">
                {(id) => (
                  <Select id={id} value={form.cancelCutoff} onChange={(e) => set("cancelCutoff", e.target.value)}>
                    {["1", "2", "6", "24"].map((d) => (
                      <option key={d} value={d}>
                        {d} hour{d === "1" ? "" : "s"}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Token format">
                {(id) => (
                  <Select id={id} value={form.tokenFormat} onChange={(e) => set("tokenFormat", e.target.value)}>
                    <option value="doctor">Per doctor (AM-07)</option>
                    <option value="department">Per department (CAR-12)</option>
                    <option value="hospital">Hospital-wide (0142)</option>
                  </Select>
                )}
              </Field>
            </div>
          </Card>
        )}
        {tab === "notifications" && (
          <Card className="space-y-5 p-5">
            <Toggle checked={form.smsConfirm} onChange={(v) => set("smsConfirm", v)} label="Booking confirmation by SMS" description="Includes token number, doctor, time and directions." />
            <Toggle checked={form.whatsapp} onChange={(v) => set("whatsapp", v)} label="WhatsApp updates" description="Send the same updates on WhatsApp when the patient has opted in." />
            <Toggle checked={form.reminder} onChange={(v) => set("reminder", v)} label="Reminder the evening before" description="Sent at 7:00 PM to patients booked for the next day." />
            <Toggle checked={form.turnAlert} onChange={(v) => set("turnAlert", v)} label="&quot;Your turn is near&quot; alert" description="Sent when 3 patients are ahead in the queue." />
            <Toggle checked={form.dailySummary} onChange={(v) => set("dailySummary", v)} label="Daily summary to administrators" description="End-of-day email with visits, fees and no-shows." />
            <p className="border-t border-line pt-4 text-xs text-ink-subtle">
              Messages go out from the sender ID <span className="font-medium text-ink-muted">AAROGY</span>. Test number: {formatPhone("9822011001")}.
            </p>
          </Card>
        )}
        {dirty && !changed && <p className="mt-3 text-xs text-ink-subtle">All changes saved.</p>}
      </div>
    </>
  );
}
