import { NextResponse } from "next/server";
import { pingDitto } from "@/lib/ditto";

// Also serves as the wake-up call: on hosts that sleep free services (e.g.
// Render), any request to the backend starts it booting.
export async function GET() {
  try {
    const result = await pingDitto();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ping failed";
    return NextResponse.json({ up: false, error: message }, { status: 200 });
  }
}
