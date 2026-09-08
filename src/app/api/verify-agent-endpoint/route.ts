import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { endpoint?: unknown };
  if (typeof body.endpoint !== "string") {
    return NextResponse.json({ error: "An endpoint is required." }, { status: 400 });
  }

  let endpoint: URL;
  try {
    endpoint = new URL(body.endpoint);
  } catch {
    return NextResponse.json({ error: "The endpoint must be a valid URL." }, { status: 400 });
  }

  if (endpoint.protocol !== "https:" || !endpoint.pathname.endsWith("/.well-known/agent-card.json")) {
    return NextResponse.json(
      { error: "Use an HTTPS /.well-known/agent-card.json endpoint." },
      { status: 400 }
    );
  }

  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json(
      { error: `Agent card returned HTTP ${response.status}.` },
      { status: 400 }
    );
  }

  const card = (await response.json()) as { name?: unknown; skills?: unknown };
  if (typeof card.name !== "string" || !Array.isArray(card.skills)) {
    return NextResponse.json({ error: "The endpoint did not return a valid A2A agent card." }, { status: 400 });
  }

  return NextResponse.json({
    name: card.name,
    protocolVersion: typeof (card as { protocolVersion?: unknown }).protocolVersion === "string"
      ? (card as { protocolVersion: string }).protocolVersion
      : "0.3.0",
  });
}
