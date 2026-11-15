"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Plus,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useHospital } from "./provider";
import {
  clinicDate,
  DOCTORS,
  money,
  paymentDate,
  prettyDate,
  prettyTime,
} from "./types";
import { Avatar, Empty, PageHeading, SectionTitle, Status } from "./ui";
import { HospitalDrawing } from "./illustrations";

export function Dashboard() {
  const { visits, patients, medicines, role, invoices } = useHospital();
  const [period, setPeriod] = useState("Today");
  const today = clinicDate();
  const daily = visits.filter(
    (v) => v.date === today && v.status !== "CANCELLED",
  );
  const count = (status: string) =>
    daily.filter((v) => v.status === status).length;
  const revenue = visits.reduce(
    (sum, v) =>
      sum +
      (v.paid && paymentDate(v) === today ? v.fee : 0) +
      (v.dispensedAt &&
      !invoices.some((i) => i.visitId === v.id) &&
      clinicDate(new Date(v.dispensedAt)) === today
        ? v.pharmacyTotal
        : 0),
    invoices
      .filter(
        (i) => !i.cancelledAt && clinicDate(new Date(i.createdAt)) === today,
      )
      .reduce((n, i) => n + i.total, 0),
  );
  const lowStock = medicines.filter((m) => m.stock <= m.reorderAt);
  const timeline = [...daily]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 5);
  const chartVisits =
    period === "Today"
      ? daily
      : visits.filter(
          (v) =>
            v.date >= clinicDate(new Date(Date.now() - 6 * 86400000)) &&
            v.status !== "CANCELLED",
        );
  const buckets =
    period === "Today"
      ? Array.from({ length: 8 }, (_, i) => ({
          label: `${i + 9 > 12 ? i - 3 : i + 9}${i + 9 >= 12 ? "pm" : "am"}`,
          value: chartVisits.filter(
            (v) => Number(v.time.split(":")[0]) === i + 9,
          ).length,
        }))
      : Array.from({ length: 7 }, (_, i) => {
          const day = clinicDate(new Date(Date.now() - (6 - i) * 86400000));
          return {
            label: prettyDate(day, { weekday: "short" }),
            value: chartVisits.filter((v) => v.date === day).length,
          };
        });
  const max = Math.max(4, ...buckets.map((b) => b.value));
  return (
    <div className="dashboard">
      <PageHeading
        eyebrow="A LITTLE MORE CONNECTED. A LOT MORE CARE."
        title="A good day to care."
        description="Your hospital, in harmony. Here’s how things are looking today."
      >
        <span className="date-chip">
          <CalendarDays size={15} />
          {prettyDate(today)}
        </span>
        <Link
          href={role === "DOCTOR" ? "/consultation" : "/reception"}
          className="button primary"
        >
          <Plus size={16} />
          {role === "DOCTOR" ? "Open doctor's desk" : "Register patient"}
        </Link>
      </PageHeading>
      <div className="metrics-grid">
        {[
          {
            label: "Today's appointments",
            value: daily.length,
            detail: `${daily.filter((v) => v.source === "Online").length} booked online`,
            icon: CalendarDays,
            color: "blue",
          },
          {
            label: "Patients in queue",
            value: count("WAITING"),
            detail: `${count("CONSULTING")} currently in consultation`,
            icon: Users,
            color: "amber",
          },
          {
            label: "Consultations completed",
            value: count("COMPLETED"),
            detail: `${daily.length ? Math.round((count("COMPLETED") / daily.length) * 100) : 0}% of today's visits`,
            icon: Stethoscope,
            color: "green",
          },
          {
            label: "Today's collections",
            value: money(revenue),
            detail: `${daily.filter((v) => !v.paid).length} consultation payments pending`,
            icon: Wallet,
            color: "purple",
          },
        ].map((item) => (
          <div className="metric-card" key={item.label}>
            <div className="metric-top">
              <span>{item.label}</span>
              <span className={`metric-icon metric-${item.color}`}>
                <item.icon size={18} strokeWidth={1.6} />
              </span>
            </div>
            <strong>{item.value}</strong>
            <p>
              <span className={`metric-dot dot-${item.color}`} />
              {item.detail}
            </p>
          </div>
        ))}
      </div>
      <div className="dashboard-middle">
        <section className="care-banner">
          <div className="care-banner-copy">
            <span className="eyebrow">
              EVERY DEPARTMENT. ONE SHARED PURPOSE.
            </span>
            <h2>
              Good care starts
              <br />
              with a connected team.
            </h2>
            <p>
              From the first hello to the last prescription,
              <br className="desktop-break" /> keep every step of the patient
              journey together.
            </p>
            <div className="care-banner-links">
              <Link href="/appointments">
                Your appointment book <ArrowRight size={15} />
              </Link>
              <span>
                <i />
                {DOCTORS.length} care specialists
              </span>
            </div>
          </div>
          <HospitalDrawing className="hero-hospital-drawing" />
        </section>
        <section className="quick-actions-card">
          <span className="eyebrow">MAKE ROOM FOR CARE</span>
          <h2>
            One less thing
            <br />
            on your list.
          </h2>
          <div className="quick-actions">
            {(role === "DOCTOR"
              ? [
                  {
                    href: "/consultation",
                    icon: Stethoscope,
                    label: "Continue consultation",
                    sub: "Your next patient is waiting",
                  },
                  {
                    href: "/patients",
                    icon: Users,
                    label: "Find a patient",
                    sub: "History, visits & prescriptions",
                  },
                  {
                    href: "/appointments",
                    icon: CalendarDays,
                    label: "See appointments",
                    sub: "Plan your day ahead",
                  },
                ]
              : [
                  {
                    href: "/reception",
                    icon: Users,
                    label: "Check in a patient",
                    sub: "A warm welcome, less waiting",
                  },
                  {
                    href: "/appointments",
                    icon: CalendarDays,
                    label: "Manage appointments",
                    sub: "Every visit, accounted for",
                  },
                  {
                    href: "/book",
                    icon: ArrowUpRight,
                    label: "Patient booking page",
                    sub: "Care begins from home",
                  },
                ]
            ).map((a) => (
              <Link href={a.href} key={a.label}>
                <span className="quick-icon">
                  <a.icon size={18} strokeWidth={1.6} />
                </span>
                <div>
                  <strong>{a.label}</strong>
                  <span>{a.sub}</span>
                </div>
                <ChevronRight size={15} />
              </Link>
            ))}
          </div>
        </section>
      </div>
      <div className="dashboard-charts">
        <section className="surface activity-card">
          <SectionTitle
            title="A pulse on your day"
            sub="Patient visits across your hospital"
          />
          <div className="activity-meta">
            <div>
              <strong>{chartVisits.length}</strong>
              <span>
                patient visits <i />
                {period === "Today" ? "today" : "in the last 7 days"}
              </span>
            </div>
            <div className="segmented-control">
              {["Today", "7 days"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={period === p ? "selected" : ""}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              {[max, Math.round(max / 2), 0].map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </div>
            <div className="chart-plot">
              <div className="chart-guides">
                <i />
                <i />
                <i />
              </div>
              <div className="chart-bars">
                {buckets.map((bucket, i) => (
                  <div className="bar-group" key={bucket.label}>
                    <div
                      className={`chart-bar ${i === 2 ? "bar-highlight" : ""}`}
                      style={{
                        height: `${Math.max(bucket.value ? 6 : 0, (bucket.value / max) * 100)}%`,
                      }}
                      title={`${bucket.label}: ${bucket.value} visits`}
                    >
                      {bucket.value > 0 && <span>{bucket.value}</span>}
                    </div>
                    <label>{bucket.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-footer">
            <span>
              <i />
              Hospital visits
            </span>
            <span>Each visit is a little more care.</span>
          </div>
        </section>
        <section className="surface department-card">
          <SectionTitle title="Your care team" sub="A shared view of the day" />
          <div className="doctor-availability">
            {DOCTORS.map((doctor, i) => {
              const active = daily.find(
                (v) => v.doctorId === doctor.id && v.status === "CONSULTING",
              );
              return (
                <div key={doctor.id}>
                  <Avatar
                    name={doctor.name.replace("Dr. ", "")}
                    index={i + 1}
                  />
                  <div>
                    <strong>{doctor.name}</strong>
                    <span>{doctor.specialty}</span>
                  </div>
                  <span
                    className={`doctor-state ${active ? "state-busy" : ""}`}
                  >
                    <i />
                    {active ? "In consult" : "Available"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="team-footer">
            <span>
              <span className="room-symbol">+</span>Rooms 01 – 03
            </span>
            <Link href="/consultation">
              Doctor's desk <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="surface appointment-preview">
          <SectionTitle
            title="Today's appointments"
            sub="Small details. Smoother visits."
            href="/appointments"
          />
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {timeline.map((v, i) => {
                  const p = patients.find((p) => p.id === v.patientId)!;
                  const d = DOCTORS.find((d) => d.id === v.doctorId)!;
                  return (
                    <tr key={v.id}>
                      <td>
                        <div className="table-person">
                          <Avatar name={p.name} index={i} small />
                          <div>
                            <strong>{p.name}</strong>
                            <span>
                              {v.source} · {v.token || "Appointment"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="table-doctor">{d.name}</span>
                      </td>
                      <td>
                        <span className="time-cell">{prettyTime(v.time)}</span>
                      </td>
                      <td>
                        <Status status={v.status} />
                      </td>
                      <td>
                        <Link
                          href={
                            role === "DOCTOR"
                              ? "/consultation"
                              : "/appointments"
                          }
                          className="table-arrow"
                          aria-label={`View ${p.name}'s appointment`}
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!timeline.length && (
              <Empty
                title="A fresh day ahead"
                description="Register a patient or share the online booking page to get started."
              />
            )}
          </div>
        </section>
        <section className="pharmacy-glance">
          <span className="pharmacy-glance-icon">℞</span>
          <span className="eyebrow">PHARMACY CHECK-IN</span>
          <h2>
            A little stock check.
            <br /> A lot of peace of mind.
          </h2>
          <p>
            <strong>{lowStock.length} medicines</strong> are below their reorder
            level.
          </p>
          <div className="stock-mini-list">
            {lowStock.slice(0, 2).map((m) => (
              <div key={m.id}>
                <span>
                  {m.name} {m.strength}
                </span>
                <strong>
                  {m.stock} left <ArrowDownRight size={12} />
                </strong>
              </div>
            ))}
          </div>
          {["ADMIN", "PHARMACY"].includes(role || "") ? (
            <Link href="/inventory">
              Review inventory <ArrowUpRight size={15} />
            </Link>
          ) : (
            <span className="pharmacy-note">
              <Check size={14} />
              Visible to your pharmacy team
            </span>
          )}
        </section>
      </div>
    </div>
  );
}
