"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Play,
} from "lucide-react";

import type { Agent } from "@/lib/types";
import { executeEndpointCall, type EndpointCallRequest, type EndpointCallResponse } from "@/lib/agent-endpoint";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type CallStage = "setup" | "calling" | "result";

export function EndpointCallDialog({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<CallStage>("setup");
  const [method, setMethod] = useState("negotiate");
  const [parameters, setParameters] = useState('{"task_description":"Read-only BNB Chain analysis. Do not execute trades, move funds, or request wallet access.","terms":{"deliverables":"Return a sourced result with assumptions and risks.","quality_standards":"Do not fabricate APR or PnL. Mark unavailable values clearly."}}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<EndpointCallResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetEndpoint = agent.a2aEndpoint || null;
  const canCallDirectly = Boolean(targetEndpoint) && agent.endpointStatus === "healthy";

  async function handleCall() {
    if (!targetEndpoint) return;
    
    setLoading(true);
    setError(null);
    setStage("calling");

    try {
      // Parse parameters if provided
      let parsedParams: Record<string, string | number | boolean | null | undefined> | undefined;
      if (parameters.trim()) {
        try {
          const parsed = JSON.parse(parameters);
          // Basic validation to ensure it's an object
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            parsedParams = parsed as Record<string, string | number | boolean | null | undefined>;
          } else {
            throw new Error("Parameters must be a JSON object");
          }
        } catch {
          throw new Error("Invalid JSON in parameters field");
        }
      }

      const callRequest: EndpointCallRequest = {
        endpoint: targetEndpoint,
        agentId: agent.agentId,
        chainId: agent.identityChainId,
        method: method || undefined,
        parameters: parsedParams,
      };

      const result = await executeEndpointCall(callRequest);
      setResponse(result);
      setStage("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Endpoint call failed");
      setResponse({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: Date.now(),
      });
      setStage("result");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStage("setup");
    setResponse(null);
    setError(null);
    setMethod("negotiate");
    setParameters('{"task_description":"Read-only BNB Chain analysis. Do not execute trades, move funds, or request wallet access.","terms":{"deliverables":"Return a sourced result with assumptions and risks.","quality_standards":"Do not fabricate APR or PnL. Mark unavailable values clearly."}}');
  }

  function handleClose() {
    setOpen(false);
    handleReset();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          disabled={!canCallDirectly}
          variant={canCallDirectly ? "default" : "outline"}
        >
          {canCallDirectly ? (
            <>
              <Play className="mr-2 h-4 w-4" />
              Call Endpoint
            </>
          ) : (
            <>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Endpoint Unavailable
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {stage === "setup" && (
          <>
            <DialogHeader>
              <DialogTitle>Call {agent.name} Endpoint</DialogTitle>
              <DialogDescription>
                Directly call the agent&apos;s A2A/MCP endpoint with custom parameters.
              </DialogDescription>
            </DialogHeader>

            {!canCallDirectly && (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertTitle>Endpoint Not Available</AlertTitle>
                <AlertDescription>
                  This agent does not have a configured A2A endpoint or the endpoint is currently unhealthy.
                </AlertDescription>
              </Alert>
            )}

            {canCallDirectly && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Endpoint URL</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={agent.a2aEndpoint || ""}
                      readOnly
                      className="font-mono text-xs"
                    />
                    {agent.a2aEndpoint && (
                      <a
                        href={agent.a2aEndpoint}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Method (optional)</label>
                    <Input
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      placeholder="e.g., negotiate"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Parameters (JSON, optional)</label>
                  <Textarea
                    value={parameters}
                    onChange={(e) => setParameters(e.target.value)}
                    placeholder='{"task_description":"Read-only BNB analysis","terms":{"deliverables":"Return a sourced result","quality_standards":"No fabricated metrics"}}'
                    className="font-mono text-xs"
                    rows={4}
                  />
                </div>

                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}

              </div>
            )}

            <DialogFooter>
              <Button
                onClick={handleCall}
                disabled={!canCallDirectly || loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Checking Requirements..." : "Continue"}
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === "calling" && (
          <>
            <DialogHeader>
              <DialogTitle>Calling Endpoint</DialogTitle>
              <DialogDescription>
                Executing call to {agent.name} endpoint...
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Executing endpoint call...
              </p>
            </div>
          </>
        )}

        {stage === "result" && response && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {response.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Call Successful
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Call Failed
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {response.success 
                  ? "The endpoint responded successfully." 
                  : response.error || "The endpoint call failed."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {response.data && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Response Data</label>
                  <pre className="rounded-lg border border-border bg-muted p-3 text-xs overflow-auto max-h-48">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              )}

              {response.error && (
                <Alert variant="destructive">
                  <AlertTriangle />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{response.error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleReset}>
                Make Another Call
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
