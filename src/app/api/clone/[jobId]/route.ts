import { NextResponse } from "next/server";
import { getJob, getResult } from "@/lib/ditto";
import type { FileMeta } from "@/types/clone";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  try {
    const job = await getJob(jobId);

    if (job.status !== "succeeded" && job.status !== "cached") {
      return NextResponse.json({
        jobId,
        status: job.status,
        error: job.error,
      });
    }

    // Job finished — fetch the result once to list generated files (metadata only,
    // contents are streamed later by the download route).
    const result = await getResult(jobId);
    const files: FileMeta[] = Object.entries(result.files ?? {}).map(([path, file]) => ({
      path,
      type: file.type,
      bytes: file.bytes,
    }));

    return NextResponse.json({ jobId, status: "succeeded", files });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read job status";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
