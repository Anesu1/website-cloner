import "server-only";
import type { CloneOptions, JobStatus } from "@/types/clone";

const DITTO_API_URL = process.env.DITTO_API_URL ?? "https://api.ditto.site";

export type { CloneOptions };

export type CloneFile =
  | { type: "text"; content: string; bytes: number; sha256: string }
  | { type: "binary"; url?: string; content?: string; bytes: number; sha256: string };

export type CloneJob = {
  jobId: string;
  // "cached" appears on POST responses when the service returns an inline
  // result without queueing a worker job.
  status: JobStatus | "cached";
  error?: string;
  files?: Record<string, CloneFile>;
};

function apiKey(): string {
  const key = process.env.DTTO_API_KEY;
  if (!key) {
    throw new Error("DTTO_API_KEY is not set in .env.local");
  }
  return key;
}

export async function dittoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${DITTO_API_URL}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${apiKey()}`,
      ...init.headers,
    },
    cache: "no-store",
  });
}

export async function startClone(url: string, options: CloneOptions): Promise<CloneJob> {
  const res = await dittoFetch("/v1/clones", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, options }),
  });
  if (!res.ok) {
    throw new Error(`ditto API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function getJob(jobId: string): Promise<CloneJob> {
  const res = await dittoFetch(`/v1/clones/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    throw new Error(`ditto API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Finished results are immutable, but the full file map is expensive to pull
// from the API (seconds for a real site). Cache the last few so the status
// check and the ZIP download share one fetch instead of two. Anchored on
// globalThis because each route bundle gets its own module instance.
const globalCache = globalThis as unknown as {
  __dittoResultCache?: Map<string, { job: CloneJob; at: number }>;
};
const resultCache = (globalCache.__dittoResultCache ??= new Map());
const RESULT_CACHE_TTL_MS = 5 * 60 * 1000;
const RESULT_CACHE_MAX = 5;

export async function getResult(jobId: string): Promise<CloneJob> {
  const cached = resultCache.get(jobId);
  if (cached && Date.now() - cached.at < RESULT_CACHE_TTL_MS) {
    return cached.job;
  }

  const res = await dittoFetch(`/v1/clones/${encodeURIComponent(jobId)}/result`);
  if (!res.ok) {
    throw new Error(`ditto API error ${res.status}: ${await res.text()}`);
  }
  const job: CloneJob = await res.json();

  if ((job.status === "succeeded" || job.status === "cached") && job.files) {
    resultCache.delete(jobId);
    resultCache.set(jobId, { job, at: Date.now() });
    while (resultCache.size > RESULT_CACHE_MAX) {
      resultCache.delete(resultCache.keys().next().value as string);
    }
  }
  return job;
}

/**
 * Cheap reachability probe. Any HTTP response below 500 means the service is
 * awake (a 401/404 still proves it's answering); 5xx means a hosting proxy is
 * answering for a sleeping service; a timeout or network error means it's
 * down or still waking.
 */
export async function pingDitto(): Promise<{ up: boolean; latencyMs: number }> {
  const started = Date.now();
  try {
    const res = await fetch(
      `${DITTO_API_URL}/v1/clones/00000000-0000-0000-0000-000000000000`,
      {
        headers: { authorization: `Bearer ${apiKey()}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }
    );
    return { up: res.status < 500, latencyMs: Date.now() - started };
  } catch {
    return { up: false, latencyMs: Date.now() - started };
  }
}

/**
 * Fetch a binary asset. The API may return asset URLs relative to its base
 * (authenticated) or absolute (e.g. presigned storage URLs, no auth header).
 */
export async function fetchAsset(url: string): Promise<Response> {
  const absolute = url.startsWith("http")
    ? url
    : `${DITTO_API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  const headers: HeadersInit = absolute.startsWith(DITTO_API_URL)
    ? { authorization: `Bearer ${apiKey()}` }
    : {};
  return fetch(absolute, { headers, cache: "no-store" });
}
