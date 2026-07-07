"use client";

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

export default function JobStatus({ status, jobId }: Props) {
  const active = status === "queued" || status === "running";

  return (
    <div className="flex items-center gap-3 rounded-md border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-sm">
      {active && (
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
      )}
      {status === "succeeded" && <span className="text-green-600 dark:text-green-400">✓</span>}
      {status === "failed" && <span className="text-red-600 dark:text-red-400">✕</span>}
      <span>{LABELS[status]}</span>
      <span className="ml-auto font-mono text-xs text-neutral-500">{jobId}</span>
    </div>
  );
}
