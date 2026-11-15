"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Clock3,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { useHospital } from "./provider";
import { clinicDate, DOCTORS, queueSort, type Visit } from "./types";
import { Avatar, Empty, PageHeading, Status } from "./ui";
import { readAloud } from "./messages";

export function QueueDisplay() {
  const { visits, patients, staff, role, act, messages } = useHospital();
  const [doctor, setDoctor] = useState(staff?.doctorId || "all");
  const [lobby, setLobby] = useState(false);
  const [lastTab, setLastTab] = useState("held");
  const [busy, setBusy] = useState("");
  const daily = visits.filter(
    (v) =>
      v.date === clinicDate() && (doctor === "all" || v.doctorId === doctor),
  );
  const waiting = daily.filter((v) => v.status === "WAITING").sort(queueSort);
  const active = daily.filter((v) =>
    ["CALLED", "CONSULTING"].includes(v.status),
  );
  const held = daily.filter((v) => v.status === "SKIPPED").sort(queueSort);
  const complete = daily.filter((v) => v.status === "COMPLETED");
  const doctors = DOCTORS.filter(
    (d) => !staff?.doctorId || d.id === staff.doctorId,
  );
  const latest = messages.find((m) => m.recipient === "LOBBY");
  async function run(
    action: string,
    id: string,
    extra: Record<string, string> = {},
  ) {
    if (busy) return;
    setBusy(id);
    try {
      await act({
        action,
        ...(action === "callNext" ? { doctorId: id } : { visitId: id }),
        ...extra,
      });
    } catch {
    } finally {
      setBusy("");
    }
  }
  function card(v: Visit) {
    const p = patients.find((p) => p.id === v.patientId)!;
    const doc = DOCTORS.find((d) => d.id === v.doctorId)!;
    const minutes = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(v.checkedInAt || v.createdAt).getTime()) / 60000,
      ),
    );
    return (
      <article className="queue-card" key={v.id}>
        <div className="queue-card-head">
          <div>
            <strong>{v.token}</strong>
            <Status status={v.status} />
          </div>
          <span>Room {doc.room}</span>
        </div>
        <div className="table-person">
          <Avatar name={p.name} small />
          <div>
            <strong>{p.name}</strong>
            <span>
              {p.age} yrs · {p.gender}
              {v.priority === "Urgent" ? " · Urgent" : ""}
            </span>
          </div>
        </div>
        <p>{v.reason}</p>
        <div className="queue-card-time">
          <Clock3 size={13} />
          {minutes} min since check-in
          {v.callCount ? ` · Called ${v.callCount} time(s)` : ""}
        </div>
        {v.status === "SKIPPED" && (
          <p className="text-amber">{v.skipReason || "Patient not present"}</p>
        )}
        <div className="queue-card-actions">
          {v.status === "WAITING" && (
            <>
              <button
                className="button primary small"
                disabled={!!busy}
                onClick={() => void run("call", v.id)}
              >
                <Volume2 size={14} />
                Call patient
              </button>
              <button
                className="button secondary small"
                disabled={!!busy}
                onClick={() => void run("hold", v.id)}
              >
                <Pause size={13} />
                Hold / skip
              </button>
            </>
          )}
          {["CALLED", "CONSULTING"].includes(v.status) && (
            <button
              className="button secondary small"
              disabled={!!busy}
              onClick={() => void run("recall", v.id)}
            >
              <Volume2 size={14} />
              Call again
            </button>
          )}
          {v.status === "CALLED" && (
            <button
              className="button secondary small"
              disabled={!!busy}
              onClick={() => void run("hold", v.id)}
            >
              Patient not present
            </button>
          )}
          {v.status === "SKIPPED" && (
            <button
              className="button primary small"
              disabled={!!busy}
              onClick={() => void run("returnToQueue", v.id)}
            >
              <RotateCcw size={13} />
              Return to queue
            </button>
          )}
          {v.status === "CALLED" &&
            ["DOCTOR", "ADMIN"].includes(role || "") && (
              <Link className="button primary small" href="/consultation">
                Open consultation <ArrowRight size={13} />
              </Link>
            )}
        </div>
      </article>
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="LIVE OPD"
        title={lobby ? "Patient calling display" : "Patient queue"}
        description={
          lobby
            ? "Please wait for your token and room number to be called."
            : "Call the next patient, repeat an announcement or put an absent patient on hold."
        }
      >
        <button className="button secondary" onClick={() => setLobby(!lobby)}>
          <Monitor size={16} />
          {lobby ? "Back to staff board" : "Waiting room display"}
        </button>
        {!staff?.doctorId && (
          <select
            className="date-input"
            aria-label="Queue doctor"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
          >
            <option value="all">All doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </PageHeading>
      {lobby ? (
        <>
          <div className="queue-display-grid">
            {doctors
              .filter((d) => doctor === "all" || d.id === doctor)
              .map((d) => {
                const now = active.find((v) => v.doctorId === d.id);
                return (
                  <section className="surface queue-room" key={d.id}>
                    <span className="eyebrow">ROOM {d.room}</span>
                    <h2>{d.name}</h2>
                    <p>{d.specialty}</p>
                    <div className="now-serving">
                      <span>NOW CALLING</span>
                      <strong>{now?.token || "—"}</strong>
                      <small>
                        {now
                          ? "Please proceed to this room"
                          : "Please wait for your token"}
                      </small>
                    </div>
                    <h3>Next in line</h3>
                    <div className="waiting-tokens">
                      {waiting
                        .filter((v) => v.doctorId === d.id)
                        .slice(0, 6)
                        .map((v) => (
                          <span key={v.id}>{v.token}</span>
                        ))}
                    </div>
                  </section>
                );
              })}
          </div>
          {latest && (
            <div className="lobby-announcement">
              <Volume2 size={22} />
              <p>{latest.text}</p>
              <button
                className="button secondary"
                onClick={() => readAloud(latest.text)}
              >
                Repeat announcement
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="queue-doctor-status">
            {doctors
              .filter((d) => doctor === "all" || d.id === doctor)
              .map((d) => {
                const now = active.find((v) => v.doctorId === d.id);
                return (
                  <div className="surface" key={d.id}>
                    <div>
                      <strong>{d.name}</strong>
                      <span>
                        Room {d.room} ·{" "}
                        {now
                          ? `${now.token} ${now.status === "CONSULTING" ? "in consultation" : "called"}`
                          : "Ready for next patient"}
                      </span>
                    </div>
                    <button
                      className="button primary small"
                      disabled={
                        !!now ||
                        !!busy ||
                        !waiting.some((v) => v.doctorId === d.id)
                      }
                      onClick={() => void run("callNext", d.id)}
                    >
                      <Play size={13} />
                      Call next
                    </button>
                  </div>
                );
              })}
          </div>
          <div className="queue-board">
            <section className="surface">
              <div className="queue-column-heading">
                <h2>Waiting</h2>
                <span>{waiting.length}</span>
              </div>
              <div className="queue-column-body">
                {waiting.map(card)}
                {!waiting.length && (
                  <Empty
                    title="No waiting patients"
                    description="Patients appear after reception check-in."
                  />
                )}
              </div>
            </section>
            <section className="surface">
              <div className="queue-column-heading">
                <h2>Called / in consultation</h2>
                <span>{active.length}</span>
              </div>
              <div className="queue-column-body">
                {active.map(card)}
                {!active.length && (
                  <Empty
                    title="All rooms clear"
                    description="Call a patient when their doctor is ready."
                  />
                )}
              </div>
            </section>
            <section className="surface">
              <div className="queue-view-tabs">
                <button
                  className={lastTab === "held" ? "selected" : ""}
                  onClick={() => setLastTab("held")}
                >
                  On hold ({held.length})
                </button>
                <button
                  className={lastTab === "complete" ? "selected" : ""}
                  onClick={() => setLastTab("complete")}
                >
                  Completed ({complete.length})
                </button>
              </div>
              <div className="queue-column-body">
                {(lastTab === "held" ? held : complete).map(card)}
                {!(lastTab === "held" ? held : complete).length && (
                  <Empty
                    title={
                      lastTab === "held"
                        ? "No patients on hold"
                        : "No completed visits yet"
                    }
                    description="Queue changes appear here automatically."
                  />
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
