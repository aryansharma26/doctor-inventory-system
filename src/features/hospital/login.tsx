"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { ROLE_HOME } from "./types";
import { Field } from "./ui";
import { HospitalDrawing } from "./illustrations";
export function StaffLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    fetch("/api/staff")
      .then((r) => r.json())
      .then((data) => setDemo(data.demo))
      .catch(() => setError("Unable to connect. Try again."));
  }, []);
  return (
    <main className="staff-login">
      <section className="staff-login-art">
        <Link href="/book" className="brand">
          <span className="brand-mark">
            <Activity size={24} />
          </span>
          MediStock.
        </Link>
        <span className="eyebrow">HARMONY HOSPITAL · HISAR</span>
        <h1>
          One hospital.
          <br />
          One connected team.
        </h1>
        <p>
          Reception, doctors and pharmacy.
          <br />
          Sign in to the workspace for your role.
        </p>
        <HospitalDrawing />
      </section>
      <section className="staff-login-main">
        <form
          className="staff-login-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              const r = await fetch("/api/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
              });
              const data = await r.json();
              if (!r.ok) throw new Error(data.error);
              router.replace(
                ROLE_HOME[data.staff.role as keyof typeof ROLE_HOME],
              );
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unable to sign in.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="login-lock">
            <LockKeyhole size={24} />
          </span>
          <h2>Hospital staff login</h2>
          <p>
            Use your own staff ID and password. Your department opens
            automatically.
          </p>
          <Field label="Staff ID">
            <input
              required
              autoComplete="username"
              disabled={!ready}
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your staff ID"
            />
          </Field>
          <Field label="Password">
            <span className="password-input">
              <input
                aria-label="Password"
                type={show ? "text" : "password"}
                required
                autoComplete="current-password"
                disabled={!ready}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="icon-button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </Field>
          {error && (
            <p className="booking-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy || !ready}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={17} />
          </button>
          {demo && (
            <details className="local-accounts">
              <summary>Local demo staff accounts</summary>
              <table>
                <tbody>
                  <tr>
                    <td>Reception</td>
                    <td>reception</td>
                    <td>Reception@123</td>
                  </tr>
                  <tr>
                    <td>Doctor</td>
                    <td>doctor</td>
                    <td>Doctor@123</td>
                  </tr>
                  <tr>
                    <td>Pharmacy</td>
                    <td>pharmacy</td>
                    <td>Pharmacy@123</td>
                  </tr>
                  <tr>
                    <td>Admin</td>
                    <td>admin</td>
                    <td>Admin@123</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Sample data only. Production uses configured staff credentials.
              </p>
            </details>
          )}
          <Link className="text-link" href="/book">
            Patient? Book an appointment <ArrowRight size={15} />
          </Link>
          <Link className="text-link" href="/book/manage">
            Check or change an existing booking
          </Link>
        </form>
      </section>
    </main>
  );
}
