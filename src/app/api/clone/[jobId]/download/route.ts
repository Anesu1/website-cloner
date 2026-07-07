import { NextResponse } from "next/server";
import JSZip from "jszip";
import { fetchAsset, getResult } from "@/lib/ditto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const site = new URL(request.url).searchParams.get("site") ?? "ditto-clone";
  const zipName = `${site.replace(/[^a-zA-Z0-9._-]/g, "-")}.zip`;

  try {
    const result = await getResult(jobId);
    if ((result.status !== "succeeded" && result.status !== "cached") || !result.files) {
      return NextResponse.json(
        { error: `Clone is not ready to download (status: ${result.status})` },
        { status: 409 }
      );
    }

    const zip = new JSZip();
    const remoteAssets: Array<{ path: string; url: string }> = [];

    for (const [path, file] of Object.entries(result.files)) {
      if (file.type === "text") {
        zip.file(path, file.content);
      } else if (file.content) {
        zip.file(path, file.content, { base64: true });
      } else if (file.url) {
        remoteAssets.push({ path, url: file.url });
      }
    }

    // Fetch remote binary assets in parallel (bounded), not one-by-one.
    const CONCURRENCY = 8;
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, remoteAssets.length) }, async () => {
        while (next < remoteAssets.length) {
          const { path, url } = remoteAssets[next++];
          const res = await fetchAsset(url);
          if (!res.ok) {
            throw new Error(`Failed to fetch asset ${path}: ${res.status}`);
          }
          zip.file(path, await res.arrayBuffer());
        }
      })
    );

    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${zipName}"`,
        "content-length": String(buffer.byteLength),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build ZIP";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
