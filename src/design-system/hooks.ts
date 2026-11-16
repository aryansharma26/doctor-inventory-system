"use client";

import { useCallback, useEffect, useState } from "react";

type QueryState<T> = { data: T | undefined; loading: boolean; error: Error | null };

/**
 * Wraps a service call so screens get real loading / error / retry states.
 * When the backend lands, the service function changes; screens don't.
 * The fetcher is captured on first render; call `retry` to run it again.
 */
export function useMockQuery<T>(fetcher: () => Promise<T>) {
  const [fn] = useState(() => fetcher);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<QueryState<T>>({ data: undefined, loading: true, error: null });

  useEffect(() => {
    let live = true;
    fn()
      .then((data) => live && setState({ data, loading: false, error: null }))
      .catch((e) => live && setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e : new Error(String(e)) })));
    return () => {
      live = false;
    };
  }, [fn, attempt]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setAttempt((a) => a + 1);
  }, []);

  return { ...state, retry };
}

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  return {
    open,
    onOpen: useCallback(() => setOpen(true), []),
    onClose: useCallback(() => setOpen(false), []),
    toggle: useCallback(() => setOpen((o) => !o), []),
  };
}
