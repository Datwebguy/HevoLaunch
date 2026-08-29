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
  X402PaymentResponse, 
  X402PaymentStatus,
  EndpointCallRequest,
  EndpointCallResponse 
} from "@/lib/types";

// Re-export types for convenience
export type { 
  X402PaymentRequest, 
  X402PaymentResponse, 
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
 * Simulate x402 payment execution (placeholder for real implementation).
 * In production, this would interact with the actual x402 payment protocol
 * via smart contracts or the Altana SDK.
 */
export async function executeX402Payment(
  request: X402PaymentRequest,
  paymentId: string
): Promise<X402PaymentResponse> {
  const now = Date.now();
  
  // Validate the request first
  const validation = validateX402Request(request);
  if (!validation.valid) {
    return {
      status: "failed",
      error: validation.error,
      timestamp: now,
    };
  }

  // Create payment record
  const paymentRecord: StoredX402Payment = {
    id: paymentId,
    endpoint: request.endpoint,
    amount: request.amount,
    currency: request.currency,
    recipientAddress: request.recipientAddress,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  saveX402Payment(paymentRecord);

  try {
    // TODO: Implement actual x402 payment execution
    // This would involve:
    // 1. Creating payment signature
    // 2. Calling x402 smart contract
    // 3. Getting transaction hash
    // 4. Waiting for confirmation
    
    // For now, simulate a successful payment
    // In production, replace with actual blockchain interaction
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const updatedRecord: StoredX402Payment = {
      ...paymentRecord,
      status: "paid",
      txHash: `0x${randomHex(64)}` as `0x${string}`, // Simulated tx hash
      updatedAt: Date.now(),
    };
    saveX402Payment(updatedRecord);

    return {
      status: "paid",
      paymentId,
      txHash: updatedRecord.txHash,
      timestamp: Date.now(),
    };
  } catch (err) {
    const failedRecord: StoredX402Payment = {
      ...paymentRecord,
      status: "failed",
      error: err instanceof Error ? err.message : "Payment execution failed",
      updatedAt: Date.now(),
    };
    saveX402Payment(failedRecord);

    return {
      status: "failed",
      error: failedRecord.error,
      timestamp: Date.now(),
    };
  }
}

/**
 * Execute an endpoint call with optional x402 payment.
 */
export async function executeEndpointCall(
  callRequest: EndpointCallRequest
): Promise<EndpointCallResponse> {
  const now = Date.now();
  const paymentId = generatePaymentId();

  try {
    // Execute payment if required
    let paymentResult: X402PaymentResponse | undefined;
    if (callRequest.requiresPayment && callRequest.payment) {
      paymentResult = await executeX402Payment(callRequest.payment, paymentId);
      
      if (paymentResult.status !== "paid") {
        return {
          success: false,
          error: `Payment failed: ${paymentResult.error}`,
          payment: paymentResult,
          timestamp: now,
        };
      }
    }

    // Execute the actual endpoint call
    // TODO: Implement actual MCP/A2A protocol calling
    // This would involve:
    // 1. Protocol-specific request formatting
    // 2. HTTP request to the endpoint
    // 3. Response parsing and validation
    
    // For now, simulate a successful call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        message: "Endpoint call executed successfully",
        endpoint: callRequest.endpoint,
        method: callRequest.method || "default",
        parameters: callRequest.parameters ? JSON.stringify(callRequest.parameters) : undefined,
      } as Record<string, string | number | boolean | null | undefined>,
      payment: paymentResult,
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

/**
 * Check if an agent endpoint requires x402 payment.
 * This would typically be determined by the agent's metadata or a pre-flight request.
 */
export function checkEndpointPaymentRequired(endpoint: string): boolean {
  // TODO: Implement actual endpoint checking
  // This could involve:
  // 1. Making a pre-flight OPTIONS request
  // 2. Checking agent metadata
  // 3. Caching the result
  
  // For now, assume payment is required for all endpoints
  return true;
}

/**
 * Get payment requirements for an endpoint.
 */
export async function getEndpointPaymentRequirements(
  endpoint: string
): Promise<{ requiresPayment: boolean; amount?: string; currency?: string } | null> {
  try {
    // TODO: Implement actual payment requirement discovery
    // This would involve calling the endpoint or checking agent metadata
    
    // For now, return a placeholder
    return {
      requiresPayment: true,
      amount: "1", // Default 1 unit
      currency: DEFAULT_X402_CURRENCY,
    };
  } catch {
    return null;
  }
}