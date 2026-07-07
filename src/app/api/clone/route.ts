import { NextResponse } from "next/server";
import { startClone, type CloneOptions } from "@/lib/ditto";

export async function POST(request: Request) {
  let body: { url?: string; options?: Partial<CloneOptions> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    return NextResponse.json({ error: "url must be a valid http(s) URL" }, { status: 400 });
  }

  const options: CloneOptions = {
    mode: body.options?.mode === "multi" ? "multi" : "single",
    styling: body.options?.styling === "css" ? "css" : "tailwind",
    framework: body.options?.framework === "vite" ? "vite" : "next",
  };

  try {
    const job = await startClone(url, options);
    return NextResponse.json({ jobId: job.jobId, status: job.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start clone";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
