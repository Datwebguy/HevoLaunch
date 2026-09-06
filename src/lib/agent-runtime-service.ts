import { slugToBackendEndpoint } from "@/lib/flyio-backend";

const FLYIO_BACKEND_URL = "https://hevo-agents.fly.dev";

export interface AgentRuntimeResponse {
  success: boolean;
  agent: string;
  method: string;
  parameters?: Record<string, unknown>;
  result: {
    message: string;
    timestamp: number;
    output: string;
  };
}

/**
 * Execute agent runtime via real A2A JSON-RPC calls to the live Fly.io backend.
 */
export async function executeAgentRuntime(
  agentSlug: string,
  method: string,
  parameters?: Record<string, unknown>
): Promise<AgentRuntimeResponse> {
  const backendRoute = slugToBackendEndpoint(agentSlug);
  const endpointUrl = `${FLYIO_BACKEND_URL}/${backendRoute}/a2a`;

  try {
    const payload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "message/send",
      params: {
        data: {
          skill: method,
          task_description:
            (parameters?.task_description as string) ||
            (parameters?.task as string) ||
            `Task execution for ${agentSlug}`,
          ...(parameters || {}),
        },
      },
    };

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Agent runtime returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const resultObj = data.result || data;

    return {
      success: true,
      agent: agentSlug,
      method,
      parameters,
      result: {
        message: resultObj.message || `Successfully executed ${method} on ${agentSlug}`,
        timestamp: Date.now(),
        output: JSON.stringify(resultObj, null, 2),
      },
    };
  } catch (error) {
    console.warn(`[AgentRuntime] Failed live call to ${endpointUrl}:`, error);
    return {
      success: false,
      agent: agentSlug,
      method,
      parameters,
      result: {
        message: `Runtime error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        output: JSON.stringify({ error: String(error) }),
      },
    };
  }
}

/**
 * Health check for agent runtime via live /ping
 */
export async function checkAgentRuntimeHealth(
  agentSlug: string
): Promise<{ status: string; endpoint: string }> {
  const backendRoute = slugToBackendEndpoint(agentSlug);
  const pingUrl = `${FLYIO_BACKEND_URL}/${backendRoute}/ping`;

  try {
    const response = await fetch(pingUrl, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60 },
    });
    if (response.ok) {
      return {
        status: "healthy",
        endpoint: `${FLYIO_BACKEND_URL}/${backendRoute}`,
      };
    }
  } catch (err) {
    console.warn(`[AgentRuntime] Health check failed for ${pingUrl}:`, err);
  }

  return {
    status: "unhealthy",
    endpoint: `${FLYIO_BACKEND_URL}/${backendRoute}`,
  };
}