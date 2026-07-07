"use client";

import { useEffect, useState } from "react";
import type { JobStatus as Status } from "@/types/clone";

type Props = {
  status: Status;
  jobId: string;
};

const LABELS: Record<Status, string> = {
  queued: "Queued — waiting for a worker…",
  running: "Cloning — capturing and generating code…",
  succeeded: "Clone complete",
  failed: "Clone failed",
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export default function JobStatus({ status, jobId }: Props) {
  const active = status === "queued" || status === "running";
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [active, startedAt]);

  return (
    <div className="flex items-center gap-3 rounded-md border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-sm">
      {active && (
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
      )}
      {status === "succeeded" && <span className="text-green-600 dark:text-green-400">✓</span>}
      {status === "failed" && <span className="text-red-600 dark:text-red-400">✕</span>}
      <span>{LABELS[status] ?? status}</span>
      {active && (
        <span className="text-xs text-neutral-500 tabular-nums">{formatElapsed(elapsed)}</span>
      )}
      <span className="ml-auto font-mono text-xs text-neutral-500">{jobId}</span>
    </div>
  );
}
