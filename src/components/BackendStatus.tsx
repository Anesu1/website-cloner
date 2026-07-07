"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BackendState = "checking" | "online" | "offline" | "waking";

type Props = {
  onChange?: (up: boolean) => void;
};

const WAKE_TIMEOUT_MS = 3 * 60 * 1000;
const WAKE_POLL_MS = 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function BackendStatus({ onChange }: Props) {
  const [state, setState] = useState<BackendState>("checking");
  const [wakeElapsed, setWakeElapsed] = useState(0);
  const wakingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setStatus = useCallback((next: BackendState) => {
    setState(next);
    onChangeRef.current?.(next === "online");
  }, []);

  const check = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/backend", { cache: "no-store" });
      const data = await res.json();
      return Boolean(data.up);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    check().then((up) => {
      if (!cancelled) setStatus(up ? "online" : "offline");
    });
    return () => {
      cancelled = true;
    };
  }, [check, setStatus]);

  async function wake() {
    if (wakingRef.current) return;
    wakingRef.current = true;
    setStatus("waking");
    const started = Date.now();

    while (Date.now() - started < WAKE_TIMEOUT_MS) {
      // The check itself is the wake-up call — it hits the backend.
      const up = await check();
      if (up) {
        wakingRef.current = false;
        setStatus("online");
        return;
      }
      setWakeElapsed(Math.floor((Date.now() - started) / 1000));
      await sleep(WAKE_POLL_MS);
    }

    wakingRef.current = false;
    setStatus("offline");
  }

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
      {state === "online" && <span className="size-2 rounded-full bg-green-500" />}
      {state === "offline" && <span className="size-2 rounded-full bg-red-500" />}
      {(state === "checking" || state === "waking") && (
        <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
      )}

      {state === "checking" && <span>Checking backend…</span>}
      {state === "online" && <span>Backend online</span>}
      {state === "waking" && (
        <span>
          Waking backend… {wakeElapsed}s (free hosts can take a minute or two)
        </span>
      )}
      {state === "offline" && (
        <>
          <span>Backend offline or asleep</span>
          <button
            type="button"
            onClick={wake}
            className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            Wake up
          </button>
        </>
      )}
    </div>
  );
}
