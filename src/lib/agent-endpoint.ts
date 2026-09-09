import type { EndpointCallRequest, EndpointCallResponse } from "@/lib/types";

export type { EndpointCallRequest, EndpointCallResponse } from "@/lib/types";

export async function executeEndpointCall(callRequest: EndpointCallRequest): Promise<EndpointCallResponse> {
  try {
    if (!/^https:\/\//i.test(callRequest.endpoint)) throw new Error("Agent endpoint must use HTTPS.");
    const skill = callRequest.method || "negotiate";
    const messageId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `hevo-${Date.now()}`;
    const payload = {
      jsonrpc: "2.0",
      id: messageId,
      method: "message/send",
      params: {
        message: {
          messageId,
          role: "user",
          parts: [{ kind: "data", data: { skill, ...(callRequest.parameters || {}) } }],
        },
      },
    };
    const response = await fetch("/api/agent-call", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: callRequest.endpoint, agentId: callRequest.agentId, chainId: callRequest.chainId, payload }),
      signal: AbortSignal.timeout(30_000),
    });
    const proxyBody = (await response.json()) as { response?: unknown; error?: unknown };
    const responseBody = (proxyBody.response ?? proxyBody) as Record<string, unknown>;
    const rpcError = responseBody.error;
    if (!response.ok || rpcError) {
      const message = rpcError && typeof rpcError === "object" && "message" in rpcError
        ? String((rpcError as { message?: unknown }).message)
        : `Agent endpoint returned HTTP ${response.status}`;
      throw new Error(message);
    }
    return {
      success: true,
      data: {
        endpoint: callRequest.endpoint,
        method: skill,
        parameters: callRequest.parameters ? JSON.stringify(callRequest.parameters) : undefined,
        response: responseBody,
      },
      timestamp: Date.now(),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Endpoint call failed", timestamp: Date.now() };
  }
}

export interface AgentQuote {
  budgetRaw: string;
  currency: string;
  anchoredTask: string;
  estimatedCompletionSeconds?: number;
  quoteExpiresAt?: number;
}

export async function negotiateAgentQuote(
  request: Pick<EndpointCallRequest, "endpoint" | "agentId" | "chainId">,
  taskDescription: string,
): Promise<AgentQuote> {
  const result = await executeEndpointCall({
    ...request,
    method: "negotiate",
    parameters: {
      task_description: taskDescription,
      terms: {
        deliverables: "Return the requested category-specific result with source timestamps and risks.",
        quality_standards: "Do not fabricate APR, PnL, balances, or health factors. Mark unavailable values clearly.",
      },
    },
  });
  if (!result.success) throw new Error(result.error || "The provider did not return a quote.");
  const rpc = result.data?.response as Record<string, unknown> | undefined;
  const rpcResult = rpc?.result as Record<string, unknown> | undefined;
  const parts = Array.isArray(rpcResult?.parts) ? rpcResult.parts : [];
  const responsePart = parts.find((part) => {
    if (!part || typeof part !== "object") return false;
    const data = (part as { data?: unknown }).data;
    return Boolean(data && typeof data === "object" && "response" in data);
  }) as { data?: { response?: unknown } } | undefined;
  const partData = responsePart?.data as Record<string, unknown> | undefined;
  const provider = partData?.response;
  if (!provider || typeof provider !== "object") throw new Error("Provider returned no quote payload.");
  const quote = provider as { accepted?: unknown; terms?: { price?: unknown; currency?: unknown }; estimated_completion_seconds?: unknown; quote_expires_at?: unknown };
  if (quote.accepted !== true || typeof quote.terms?.price !== "string" || !/^\d+$/.test(quote.terms.price)) {
    throw new Error("Provider rejected the requested task or returned an invalid quote.");
  }
  return {
    budgetRaw: quote.terms.price,
    currency: typeof quote.terms.currency === "string" ? quote.terms.currency : "$U",
    anchoredTask: JSON.stringify({ type: "erc8183-signed-quote", request: partData?.request, response: partData?.response, chain_id: partData?.chain_id, verifying_contract: partData?.verifying_contract }),
    estimatedCompletionSeconds: typeof quote.estimated_completion_seconds === "number" ? quote.estimated_completion_seconds : undefined,
    quoteExpiresAt: typeof quote.quote_expires_at === "number" ? quote.quote_expires_at : undefined,
  };
}
