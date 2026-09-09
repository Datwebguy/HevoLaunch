import { NextResponse } from "next/server";
import { allowRequest, isAgentCardUrl, parsePublicHttpsUrl, readClientIp, readJsonBody } from "@/lib/safe-provider-url";

export async function POST(request: Request) {
  if (!allowRequest(`verify-agent:${readClientIp(request)}`, 10)) {
    return NextResponse.json({ error: "Too many endpoint checks. Try again shortly." }, { status: 429 });
  }
  let body: { endpoint?: unknown };
  try {
    body = await readJsonBody<{ endpoint?: unknown }>(request, 8 * 1024);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON and no larger than 8 KB." }, { status: 400 });
  }
  if (typeof body.endpoint !== "string") {
    return NextResponse.json({ error: "An endpoint is required." }, { status: 400 });
  }

  const endpoint = parsePublicHttpsUrl(body.endpoint);
  if (!endpoint || !isAgentCardUrl(endpoint)) {
    return NextResponse.json(
      { error: "Use an HTTPS /.well-known/agent-card.json endpoint." },
      { status: 400 }
    );
  }

  let response: Response;
  try {
    response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000), cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "The agent card could not be reached." }, { status: 502 });
  }
  if (!response.ok) {
    return NextResponse.json(
      { error: `Agent card returned HTTP ${response.status}.` },
      { status: 400 }
    );
  }

  const cardText = await response.text();
  if (cardText.length > 256 * 1024) return NextResponse.json({ error: "The agent card exceeded the 256 KB limit." }, { status: 400 });
  let card: {
    name?: unknown;
    skills?: unknown;
    capabilities?: unknown;
    services?: unknown;
    description?: unknown;
  };
  try { card = JSON.parse(cardText) as typeof card; } catch { return NextResponse.json({ error: "The agent card did not return valid JSON." }, { status: 400 }); }
  const hasFeatures =
    Array.isArray(card.skills) ||
    Array.isArray(card.capabilities) ||
    Array.isArray(card.services) ||
    typeof card.description === "string";

  if (typeof card.name !== "string" || !hasFeatures) {
    return NextResponse.json(
      { error: "The endpoint did not return a valid A2A agent card (must include name and skills, capabilities, or services)." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    name: card.name,
    protocolVersion: typeof (card as { protocolVersion?: unknown }).protocolVersion === "string"
      ? (card as { protocolVersion: string }).protocolVersion
      : "0.3.0",
  });
}
