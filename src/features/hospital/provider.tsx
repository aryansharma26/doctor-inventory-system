"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { HospitalState, StaffSession } from "./types";
type ContextValue = HospitalState & {
  staff: StaffSession | null;
  role: StaffSession["role"] | null;
  demo: boolean;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  act: (input: Record<string, unknown>, success?: string) => Promise<unknown>;
};
const Context = createContext<ContextValue | null>(null);
const empty: HospitalState = {
  patients: [],
  visits: [],
  medicines: [],
  messages: [],
  invoices: [],
};
export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState(empty);
  const [staff, setStaff] = useState<StaffSession | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const revision = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    try {
      const response = await fetch("/api/hospital", { cache: "no-store" });
      if (current !== revision.current) return;
      if (response.status === 401) {
        setState(empty);
        setStaff(null);
        router.replace("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (current !== revision.current) return;
      setState(data);
      setError("");
    } catch {
      if (current === revision.current)
        setError("Connection lost. Showing saved records. Retry to reconnect.");
    } finally {
      if (current === revision.current) setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    let live = true;
    fetch("/api/staff", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (live) {
          setStaff(data.staff);
          setDemo(data.demo);
        }
      })
      .catch(() => setError("Unable to reach hospital server."));
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 2000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    if ("BroadcastChannel" in window) {
      channel.current = new BroadcastChannel("hospital-live");
      channel.current.onmessage = (event) => {
        if (event.data === "logout") {
          ++revision.current;
          setState(empty);
          setStaff(null);
          router.replace("/login");
        } else focus();
      };
    }
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      channel.current?.close();
    };
  }, [refresh, router]);
  const signOut = useCallback(async () => {
    const response = await fetch("/api/staff", { method: "DELETE" });
    if (!response.ok) {
      toast.error("Unable to sign out. Please retry.");
      throw new Error("Sign out failed");
    }
    ++revision.current;
    setState(empty);
    setStaff(null);
    channel.current?.postMessage("logout");
    router.replace("/login");
    router.refresh();
  }, [router]);
  const act = useCallback(
    async (input: Record<string, unknown>, success?: string) => {
      ++revision.current;
      try {
        const response = await fetch("/api/hospital", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            setState(empty);
            router.replace("/login");
          }
          throw new Error(data.error || "Unable to save.");
        }
        ++revision.current;
        setState(data.state);
        setError("");
        channel.current?.postMessage("updated");
        if (success) toast.success(success);
        return data.result;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Unable to save.");
        throw e;
      }
    },
    [router],
  );
  return (
    <Context.Provider
      value={{
        ...state,
        staff,
        role: staff?.role || null,
        demo,
        loading,
        error,
        refresh,
        signOut,
        act,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useHospital() {
  const context = useContext(Context);
  if (!context) throw new Error("HospitalProvider is required");
  return context;
}
