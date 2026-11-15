"use client";
import { useEffect, useRef, useState } from "react";
import { Check, MessageSquare, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useHospital } from "./provider";
import { DOCTORS, ROLE_LABELS, canAcknowledge, type Role } from "./types";
import { Empty, Field, Modal, PageHeading } from "./ui";

export function readAloud(text: string) {
  if (!("speechSynthesis" in window)) {
    toast.error("Voice playback is not supported in this browser.");
    return;
  }
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-IN";
  speech.rate = 0.9;
  window.speechSynthesis.speak(speech);
}
export function MessageAudio() {
  const { messages, staff, loading } = useHospital();
  const [enabled, setEnabled] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!staff || loading) return;
    if (!seen.current) {
      seen.current = new Set(messages.map((m) => m.id));
      return;
    }
    const incoming = messages.filter(
      (m) =>
        !seen.current!.has(m.id) &&
        (m.recipient === "LOBBY" || m.senderId !== staff.id),
    );
    messages.forEach((m) => seen.current!.add(m.id));
    for (const m of incoming) {
      toast(
        m.kind === "ANNOUNCEMENT"
          ? "Hospital announcement"
          : `Message from ${m.senderName}`,
        { description: m.text },
      );
      if (enabled) readAloud(m.text);
    }
  }, [messages, staff, enabled, loading]);
  return (
    <button
      className={`audio-toggle ${enabled ? "audio-on" : ""}`}
      aria-label={
        enabled ? "Disable announcement audio" : "Enable announcement audio"
      }
      aria-pressed={enabled}
      onClick={() => {
        if (!("speechSynthesis" in window)) {
          toast.error("This browser does not support voice announcements.");
          return;
        }
        setEnabled(!enabled);
        if (!enabled)
          readAloud(
            "Hospital audio enabled. New messages and announcements will be read aloud.",
          );
        else window.speechSynthesis.cancel();
      }}
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      <span>{enabled ? "Audio on" : "Enable audio"}</span>
    </button>
  );
}
function Composer({
  close,
  visitId = "",
  initialRecipient = "RECEPTION",
}: {
  close: () => void;
  visitId?: string;
  initialRecipient?: Role | "LOBBY" | "ALL";
}) {
  const { act } = useHospital();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [doctor, setDoctor] = useState(DOCTORS[0].id);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Send a team message"
      description="Messages sync with the receiving department. Lobby announcements use the speaker display."
      close={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            await act(
              {
                action: "message",
                recipient,
                doctorId: recipient === "DOCTOR" ? doctor : "",
                text,
                kind: recipient === "LOBBY" ? "ANNOUNCEMENT" : "MESSAGE",
                visitId,
              },
              "Message sent.",
            );
            close();
          } catch {
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body message-compose">
          <Field label="Send to">
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value as typeof recipient)}
            >
              <option value="RECEPTION">Reception desk</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="LOBBY">Waiting room announcement</option>
              <option value="ALL">All hospital staff</option>
            </select>
          </Field>
          {recipient === "DOCTOR" && (
            <Field label="Doctor">
              <select
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label={recipient === "LOBBY" ? "Announcement" : "Message"}>
            <textarea
              required
              autoFocus
              minLength={1}
              maxLength={1500}
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type in English or Hindi…"
            />
          </Field>
          <div className="message-presets">
            {[
              "Please send the next patient.",
              "Please ask the patient to wait.",
              "Please come to the reception desk.",
            ].map((t) => (
              <button key={t} type="button" onClick={() => setText(t)}>
                {t}
              </button>
            ))}
          </div>
          {recipient === "LOBBY" && (
            <p className="form-note">
              This text is visible on the waiting-room display. Use tokens
              instead of medical details.
            </p>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={close}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            <Send size={16} />
            {busy ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function QuickMessage({ visitId }: { visitId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="button secondary" onClick={() => setOpen(true)}>
        <MessageSquare size={16} />
        Message reception
      </button>
      {open && <Composer visitId={visitId} close={() => setOpen(false)} />}
    </>
  );
}
export function TeamMessages() {
  const { messages, staff, act, visits } = useHospital();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const filtered = messages.filter(
    (m) =>
      filter === "all" ||
      (filter === "announcements" && m.kind === "ANNOUNCEMENT") ||
      (filter === "unread" &&
        staff &&
        canAcknowledge(m, staff) &&
        m.senderId !== staff?.id &&
        !m.readBy.includes(staff?.id || "")),
  );
  return (
    <>
      <PageHeading
        eyebrow="HOSPITAL COMMUNICATION"
        title="Team messages"
        description="Send instructions, acknowledge messages and make waiting-room announcements."
      >
        <button className="button primary" onClick={() => setOpen(true)}>
          <Send size={16} />
          New message
        </button>
      </PageHeading>
      <section className="surface">
        <div className="table-toolbar">
          <div className="table-tabs">
            {["all", "unread", "announcements"].map((f) => (
              <button
                key={f}
                className={filter === f ? "tab-active" : ""}
                onClick={() => setFilter(f)}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <span className="live-indicator">
            <i />
            Live team updates
          </span>
        </div>
        <div className="team-message-list" aria-live="polite">
          {filtered.map((m) => (
            <article
              className={`team-message ${m.senderId === staff?.id ? "message-outgoing" : ""} ${staff && canAcknowledge(m, staff) && !m.readBy.includes(staff.id) ? "message-unread" : ""}`}
              key={m.id}
            >
              <div className="message-meta">
                <strong>{m.senderName}</strong>
                <span>
                  →{" "}
                  {m.recipient === "LOBBY"
                    ? "Waiting room"
                    : m.recipient === "ALL"
                      ? "All staff"
                      : ROLE_LABELS[m.recipient]}
                </span>
                <time>
                  {new Date(m.createdAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              {m.kind === "ANNOUNCEMENT" && (
                <span className="announcement-badge">
                  <Volume2 size={13} />
                  Announcement
                </span>
              )}
              {m.visitId && visits.find((v) => v.id === m.visitId)?.token && (
                <span className="message-token">
                  {visits.find((v) => v.id === m.visitId)?.token}
                </span>
              )}
              <p>{m.text}</p>
              <div className="message-actions">
                <button
                  className="button secondary small"
                  onClick={() => readAloud(m.text)}
                >
                  <Volume2 size={14} />
                  Listen
                </button>
                {staff &&
                canAcknowledge(m, staff) &&
                !m.readBy.includes(staff?.id || "") ? (
                  <button
                    className="button primary small"
                    disabled={busy === m.id}
                    onClick={async () => {
                      setBusy(m.id);
                      try {
                        await act({ action: "ack", messageId: m.id });
                      } catch {
                      } finally {
                        setBusy("");
                      }
                    }}
                  >
                    <Check size={14} />
                    Acknowledge
                  </button>
                ) : (
                  <span className="message-receipt">
                    {m.kind === "ANNOUNCEMENT"
                      ? "Announcement"
                      : m.readBy.length
                        ? "Acknowledged"
                        : m.senderId === staff?.id
                          ? "Sent"
                          : "Awaiting acknowledgment"}
                  </span>
                )}
              </div>
            </article>
          ))}
          {!filtered.length && (
            <Empty
              title="No messages here"
              description="Instructions from your team and announcements will appear here."
            />
          )}
        </div>
      </section>
      {open && (
        <Composer
          initialRecipient={
            staff?.role === "RECEPTION" ? "DOCTOR" : "RECEPTION"
          }
          close={() => setOpen(false)}
        />
      )}
    </>
  );
}
