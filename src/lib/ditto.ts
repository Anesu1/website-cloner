import "server-only";
import type { CloneOptions, JobStatus } from "@/types/clone";

const DITTO_API_URL = process.env.DITTO_API_URL ?? "https://api.ditto.site";

export type { CloneOptions };

export type CloneFile =
  | { type: "text"; content: string; bytes: number; sha256: string }
  | { type: "binary"; url?: string; content?: string; bytes: number; sha256: string };

export type CloneJob = {
  jobId: string;
  status: JobStatus;
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

export async function getResult(jobId: string): Promise<CloneJob> {
  const res = await dittoFetch(`/v1/clones/${encodeURIComponent(jobId)}/result`);
  if (!res.ok) {
    throw new Error(`ditto API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
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
