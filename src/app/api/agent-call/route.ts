import { NextResponse } from "next/server";

import { getAgent, MAINNET_CHAIN_ID, scanEndpointStatus } from "@/lib/8004scan";
import { allowRequest, parsePublicHttpsUrl, readClientIp, readJsonBody } from "@/lib/safe-provider-url";

type CallBody = {
  endpoint?: unknown;
  agentId?: unknown;
  chainId?: unknown;
  payload?: unknown;
};

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!allowRequest(`agent-call:${readClientIp(request)}`, 20)) return error("Too many provider calls. Try again shortly.", 429);
  let body: CallBody;
  try {
    body = await readJsonBody<CallBody>(request, 64 * 1024);
  } catch {
    return error("Request body must be valid JSON and no larger than 64 KB.");
  }

  if (body.chainId !== MAINNET_CHAIN_ID || typeof body.agentId !== "number" || !Number.isInteger(body.agentId)) {
    return error("Agent calls are restricted to a BSC mainnet ERC-8004 identity.");
  }
  if (typeof body.endpoint !== "string" || typeof body.payload !== "object" || body.payload === null) {
    return error("A provider endpoint and A2A payload are required.");
  }

  const requestedEndpoint = parsePublicHttpsUrl(body.endpoint);
  if (!requestedEndpoint) return error("Provider calls require a public HTTPS URL.");

  try {
    const agent = await getAgent(MAINNET_CHAIN_ID, String(body.agentId));
    if (!agent.is_active || agent.is_testnet || scanEndpointStatus(agent) !== "healthy") {
      return error("This mainnet agent is not currently healthy or active.", 409);
    }
    if (!agent.a2a_endpoint) {
      return error("The endpoint does not match the agent's current mainnet registry record.", 403);
    }

    const registeredEndpoint = parsePublicHttpsUrl(agent.a2a_endpoint);
    if (!registeredEndpoint) return error("The registered provider endpoint is not a public HTTPS URL.", 503);
    const registeredUrl = registeredEndpoint.toString();
    const providerRoot = new URL("/", registeredEndpoint);
    const requestedUrl = requestedEndpoint.toString();
    if (requestedUrl !== registeredUrl && requestedUrl !== providerRoot.toString()) {
      return error("The endpoint does not match the agent's current mainnet registry record.", 403);
    }

    const providerResponse = await fetch(requestedUrl === registeredUrl ? providerRoot : requestedEndpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body.payload),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    const responseText = await providerResponse.text();
    if (responseText.length > 256 * 1024) return error("Provider response exceeded the 256 KB limit.", 502);
    const responseBody = (() => { try { return JSON.parse(responseText); } catch { return null; } })();
    if (!providerResponse.ok) {
      return NextResponse.json(
        { error: `Provider returned HTTP ${providerResponse.status}.`, response: responseBody },
        { status: 502 }
      );
    }
    return NextResponse.json({ response: responseBody }, { status: 200 });
  } catch (cause) {
    console.warn("[agent-call] Provider request failed", cause);
    return error("Provider endpoint unavailable.", 502);
  }
}
