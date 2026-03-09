/**
 * HTTP client for calling Python backend orchestrators.
 *
 * Routes requests to Dummy_Agent or Mislink_Agent based on workflow field.
 * Mislink uses /api/gateway/* prefix; Dummy uses /api/*.
 */

import type {
  GatewayProcessRequest,
  GatewayProcessResponse,
  GatewayDecisionRequest,
  GatewayDecisionResponse,
  GatewayRunResponse,
  GatewayErrorResponse,
  GatewayResult,
} from "../contracts/gateway";
import { logInfo, logError } from "../log";

function getBaseUrl(workflow: string): string {
  if (workflow === "mislink") {
    return process.env.MISLINK_AGENT_BASE_URL || "http://localhost:8001";
  }
  return process.env.DUMMY_AGENT_BASE_URL || "http://localhost:8000";
}

function getProcessPath(workflow: string): string {
  return workflow === "mislink" ? "/api/gateway/process" : "/api/process";
}

function getDecisionPath(workflow: string): string {
  return workflow === "mislink" ? "/api/gateway/decision" : "/api/decision";
}

function getRunPath(workflow: string, runId: string): string {
  return workflow === "mislink"
    ? `/api/gateway/runs/${runId}`
    : `/api/runs/${runId}`;
}

async function callBackend<T>(url: string, init?: RequestInit): Promise<GatewayResult<T>> {
  const start = Date.now();
  try {
    const resp = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    const data = await resp.json();
    const duration = Date.now() - start;

    logInfo("backend_response", {
      source: "backend",
      backend_url: url,
      status_code: resp.status,
      duration_ms: duration,
    });

    if (!resp.ok && data.ok === undefined) {
      return {
        ok: false,
        error: "backend_http_error",
        message: `Backend returned ${resp.status}: ${resp.statusText}`,
      };
    }

    return data;
  } catch (err) {
    const duration = Date.now() - start;
    logError("backend_unreachable", {
      source: "backend",
      backend_url: url,
      duration_ms: duration,
      error: err instanceof Error ? err.message : "unknown",
    });
    return {
      ok: false,
      error: "backend_unreachable",
      message: err instanceof Error ? err.message : "Failed to reach backend",
    };
  }
}

export async function processTicket(
  req: GatewayProcessRequest,
): Promise<GatewayResult<GatewayProcessResponse>> {
  const base = getBaseUrl(req.workflow);
  const path = getProcessPath(req.workflow);
  return callBackend<GatewayProcessResponse>(`${base}${path}`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function submitDecision(
  req: GatewayDecisionRequest,
): Promise<GatewayResult<GatewayDecisionResponse>> {
  const base = getBaseUrl(req.workflow);
  const path = getDecisionPath(req.workflow);
  return callBackend<GatewayDecisionResponse>(`${base}${path}`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getRun(
  workflow: string,
  runId: string,
): Promise<GatewayResult<GatewayRunResponse>> {
  const base = getBaseUrl(workflow);
  const path = getRunPath(workflow, runId);
  return callBackend<GatewayRunResponse>(`${base}${path}`);
}
