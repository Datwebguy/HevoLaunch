/**
 * x402 Payment Protocol Implementation
 * 
 * This module implements the x402 payment protocol for per-request agent payments.
 * x402 is a standard for Agent-to-Agent payments that allows fine-grained, per-request
 * payment authorization and execution.
 * 
 * Based on the x402 specification for ERC-8004 agent payments.
 */

import type { 
  X402PaymentRequest, 
  X402PaymentStatus,
  EndpointCallRequest,
  EndpointCallResponse 
} from "@/lib/types";

// Re-export types for convenience
export type { 
  X402PaymentRequest, 
  X402PaymentStatus,
  EndpointCallRequest,
  EndpointCallResponse
} from "@/lib/types";

/**
 * Generate a random hex string of the specified byte length.
 */
function randomHex(bytes: number): string {
  let hex = "";
  for (let i = 0; i < bytes * 2; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}

/**
 * x402 payment header names as per the specification.
 */
export const X402_HEADERS = {
  PAYMENT_REQUIRED: "X-Payment-Required",
  PAYMENT_SIGNATURE: "X-Payment-Signature",
  PAYMENT_ID: "X-Payment-Id",
  PAYMENT_AMOUNT: "X-Payment-Amount",
  PAYMENT_CURRENCY: "X-Payment-Currency",
  PAYMENT_TIMESTAMP: "X-Payment-Timestamp",
} as const;

/**
 * Default payment currency for x402 payments on BNB Chain.
 * Uses $U (United Stables) for ERC-8183 compatibility.
 */
export const DEFAULT_X402_CURRENCY = "$U";

/**
 * Storage key for x402 payment records in localStorage.
 */
const X402_PAYMENTS_STORAGE_KEY = "hevolaunch:x402-payments";

/**
 * Stored x402 payment record for tracking and history.
 */
export interface StoredX402Payment {
  id: string;
  endpoint: string;
  amount: string;
  currency: string;
  recipientAddress: `0x${string}`;
  status: X402PaymentStatus;
  txHash?: `0x${string}`;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Generate a unique payment ID for x402 tracking.
 */
export function generatePaymentId(): string {
  return `x402_${randomHex(16)}`;
}

/**
 * Get all stored x402 payments from localStorage.
 */
export function getStoredX402Payments(): StoredX402Payment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(X402_PAYMENTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredX402Payment[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save a payment record to localStorage.
 */
export function saveX402Payment(payment: StoredX402Payment): void {
  if (typeof window === "undefined") return;
  try {
    const payments = getStoredX402Payments();
    const index = payments.findIndex((p) => p.id === payment.id);
    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.push(payment);
    }
    window.localStorage.setItem(X402_PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
  } catch (err) {
    console.error("[x402] Failed to save payment record:", err);
  }
}

/**
 * Get a specific payment by ID.
 */
export function getX402PaymentById(paymentId: string): StoredX402Payment | undefined {
  return getStoredX402Payments().find((p) => p.id === paymentId);
}

/**
 * Create a new x402 payment request from an endpoint call.
 */
export function createX402PaymentRequest(
  endpoint: string,
  amount: string,
  recipientAddress: `0x${string}`,
  currency: string = DEFAULT_X402_CURRENCY,
  description?: string
): X402PaymentRequest {
  return {
    endpoint,
    amount,
    currency,
    recipientAddress,
    description,
  };
}

/**
 * Validate an x402 payment request.
 */
export function validateX402Request(request: X402PaymentRequest): { valid: boolean; error?: string } {
  if (!request.endpoint || typeof request.endpoint !== "string") {
    return { valid: false, error: "Invalid endpoint URL" };
  }
  if (!request.amount || typeof request.amount !== "string") {
    return { valid: false, error: "Invalid payment amount" };
  }
  if (!request.recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(request.recipientAddress)) {
    return { valid: false, error: "Invalid recipient address" };
  }
  if (!request.currency || typeof request.currency !== "string") {
    return { valid: false, error: "Invalid currency" };
  }
  return { valid: true };
}

/**
 * Execute an endpoint call with optional x402 payment.
 */
export async function executeEndpointCall(
  callRequest: EndpointCallRequest
): Promise<EndpointCallResponse> {
  const now = Date.now();

  try {
    if (callRequest.requiresPayment && callRequest.payment) {
      return { success: false, error: "x402 settlement is disabled until a signed BSC transaction adapter is implemented.", timestamp: now };
    }

    if (!/^https:\/\//i.test(callRequest.endpoint)) {
      throw new Error("Agent endpoint must use HTTPS.");
    }

    // A2A JSON-RPC: the method field in HevoLaunch is the agent skill
    // (for example `negotiate`), while the transport method is message/send.
    // This reaches the live endpoint declared by the mainnet registry rather
    // than returning an internal/demo runtime response.
    const skill = callRequest.method || "negotiate";
    const messageId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `hevo-${Date.now()}`;
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
      body: JSON.stringify({
        endpoint: callRequest.endpoint,
        agentId: callRequest.agentId,
        chainId: callRequest.chainId,
        payload,
      }),
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
    return {
      success: false,
      error: err instanceof Error ? err.message : "Endpoint call failed",
      timestamp: Date.now(),
    };
  }
}

export interface AgentQuote {
  budgetRaw: string;
  currency: string;
  anchoredTask: string;
  estimatedCompletionSeconds?: number;
  quoteExpiresAt?: number;
}

/** Request a provider quote without payment or wallet access. */
export async function negotiateAgentQuote(
  request: Pick<EndpointCallRequest, "endpoint" | "agentId" | "chainId">,
  taskDescription: string
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
    requiresPayment: false,
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
  const quote = provider as {
    accepted?: unknown;
    terms?: { price?: unknown; currency?: unknown };
    estimated_completion_seconds?: unknown;
    quote_expires_at?: unknown;
  };
  if (quote.accepted !== true || typeof quote.terms?.price !== "string" || !/^\d+$/.test(quote.terms.price)) {
    throw new Error("Provider rejected the requested task or returned an invalid quote.");
  }
  return {
    budgetRaw: quote.terms.price,
    currency: typeof quote.terms.currency === "string" ? quote.terms.currency : "$U",
    anchoredTask: JSON.stringify({
      type: "erc8183-signed-quote",
      request: partData?.request,
      request_hash: partData?.request_hash,
      response: partData?.response,
      response_hash: partData?.response_hash,
      negotiation_hash: partData?.negotiation_hash,
      provider_sig: partData?.provider_sig,
      chain_id: partData?.chain_id,
      verifying_contract: partData?.verifying_contract,
    }),
    estimatedCompletionSeconds: typeof quote.estimated_completion_seconds === "number"
      ? quote.estimated_completion_seconds
      : undefined,
    quoteExpiresAt: typeof quote.quote_expires_at === "number" ? quote.quote_expires_at : undefined,
  };
}

/**
 * Check if an agent endpoint requires x402 payment.
 */
export function checkEndpointPaymentRequired(_endpoint?: string): boolean {
  void _endpoint;
  return true;
}

/**
 * Get payment requirements for an endpoint.
 */
export async function getEndpointPaymentRequirements(
  _endpoint?: string
): Promise<{
  requiresPayment: boolean;
  amount?: string;
  currency?: string;
} | null> {
  void _endpoint;
  return null;
}
