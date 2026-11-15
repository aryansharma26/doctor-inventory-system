"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef } from "react";
import { ArrowUpRight, Inbox, X } from "lucide-react";
import Link from "next/link";
import { initials, STATUS_LABELS, type VisitStatus } from "./types";

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Avatar({
  name,
  index = 0,
  small = false,
}: {
  name: string;
  index?: number;
  small?: boolean;
}) {
  return (
    <span
      className={`person-avatar avatar-${index % 5} ${small ? "avatar-small" : ""}`}
    >
      {initials(name)}
    </span>
  );
}
export function Status({ status }: { status: VisitStatus }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      <i />
      {STATUS_LABELS[status]}
    </span>
  );
}
export function Empty({
  title = "Nothing here yet",
  description = "New records will appear here.",
  children,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={30} strokeWidth={1.25} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  wide?: boolean;
}) {
  const control =
    isValidElement(children) &&
    ["input", "select", "textarea"].includes(String(children.type))
      ? cloneElement(
          children as React.ReactElement<{ "aria-label"?: string }>,
          { "aria-label": label },
        )
      : children;
  return (
    <label className={`field ${wide ? "field-wide" : ""}`}>
      <span>{label}</span>
      {control}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Modal({
  title,
  description,
  close,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  close: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`hospital-modal ${wide ? "modal-wide" : ""}`}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            close();
        }
      }}
      aria-labelledby={titleId}
    >
      <div className="modal-heading">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function SectionTitle({
  title,
  sub,
  href,
  link = "View all",
}: {
  title: string;
  sub?: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="text-link">
          {link}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const safe = (value: string | number) => {
    const raw = String(value);
    return `"${(/^[=+@\-\t\r]/.test(raw) ? "'" : "") + raw.replaceAll('"', '""')}"`;
  };
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + rows.map((row) => row.map(safe).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
