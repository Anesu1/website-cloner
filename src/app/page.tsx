"use client";

import { useEffect, useRef, useState } from "react";
import CloneForm from "@/components/CloneForm";
import JobStatus from "@/components/JobStatus";
import FileList from "@/components/FileList";
import type { CloneOptions, FileMeta, JobStatus as Status } from "@/types/clone";

const POLL_INTERVAL_MS = 3000;

type JobState =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "polling"; jobId: string; status: Status; site: string }
  | { phase: "done"; jobId: string; files: FileMeta[]; site: string }
  | { phase: "error"; message: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [job, setJob] = useState<JobState>({ phase: "idle" });
  // Incremented on every new submission so a stale poll loop knows to stop.
  const runRef = useRef(0);

  useEffect(() => {
    return () => {
      runRef.current += 1;
    };
  }, []);

  async function pollUntilDone(jobId: string, site: string, run: number) {
    while (runRef.current === run) {
      await sleep(POLL_INTERVAL_MS);
      if (runRef.current !== run) return;

      let data: { status?: Status; files?: FileMeta[]; error?: string };
      try {
        const res = await fetch(`/api/clone/${encodeURIComponent(jobId)}`);
        data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Status check failed (${res.status})`);
      } catch (err) {
        setJob({
          phase: "error",
          message: err instanceof Error ? err.message : "Lost contact with the server.",
        });
        return;
      }

      if (data.status === "succeeded") {
        setJob({ phase: "done", jobId, files: data.files ?? [], site });
        return;
      }
      if (data.status === "failed") {
        setJob({ phase: "error", message: data.error ?? "The clone job failed." });
        return;
      }
      setJob({ phase: "polling", jobId, status: data.status ?? "running", site });
    }
  }

  async function handleSubmit(url: string, options: CloneOptions) {
    const run = ++runRef.current;
    setJob({ phase: "starting" });
    const site = new URL(url).hostname;

    try {
      const res = await fetch("/api/clone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, options }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed to start clone (${res.status})`);
      if (runRef.current !== run) return;

      setJob({ phase: "polling", jobId: data.jobId, status: data.status ?? "queued", site });
      await pollUntilDone(data.jobId, site, run);
    } catch (err) {
      if (runRef.current !== run) return;
      setJob({
        phase: "error",
        message: err instanceof Error ? err.message : "Failed to start the clone.",
      });
    }
  }

  const busy = job.phase === "starting" || job.phase === "polling";

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Website Cloner</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Enter a public URL and get back a runnable codebase, generated from what
            the page actually renders. Powered by ditto.site.
          </p>
        </header>

        <CloneForm disabled={busy} onSubmit={handleSubmit} />

        {job.phase === "starting" && <JobStatus status="queued" jobId="starting…" />}

        {job.phase === "polling" && <JobStatus status={job.status} jobId={job.jobId} />}

        {job.phase === "done" && (
          <div className="flex flex-col gap-4">
            <JobStatus status="succeeded" jobId={job.jobId} />
            <FileList
              files={job.files}
              downloadHref={`/api/clone/${encodeURIComponent(job.jobId)}/download?site=${encodeURIComponent(job.site)}`}
            />
          </div>
        )}

        {job.phase === "error" && (
          <div className="rounded-md border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {job.message}
          </div>
        )}
      </div>
    </main>
  );
}
