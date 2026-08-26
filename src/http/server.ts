import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { DecisionService } from "../decisions/decisionService.js";
import { MetricsService } from "../metrics/judgment.js";
import { DoubleDownWorkflow } from "../orchestrator/doubleDown.js";
import { FactoryPipeline } from "../orchestrator/pipeline.js";
import { MetricsSnapshot } from "../types.js";

export interface ApiServerDependencies {
  decisions: DecisionService;
  pipeline: FactoryPipeline;
  metrics: MetricsService;
  decisionsApiKey?: string;
  doubleDown?: Pick<DoubleDownWorkflow, "executeApprovedDecision" | "scanPublishedProducts">;
}

export interface RouteResult {
  status: number;
  body: unknown;
}

export interface RouteRequestOptions {
  headers?: Record<string, string | string[] | undefined>;
}

export function createApiServer(deps: ApiServerDependencies) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      const needsBody = req.method === "POST";
      const result = await routeRequest(deps, req.method ?? "GET", url.pathname, needsBody ? await readJson(req) : undefined, {
        headers: req.headers
      });
      return json(res, result.status, result.body);
    } catch (error) {
      return json(res, 500, { error: error instanceof Error ? error.message : String(error) });
    }
  });
}

export async function routeRequest(
  deps: ApiServerDependencies,
  method: string,
  pathname: string,
  body: unknown = {},
  options: RouteRequestOptions = {}
): Promise<RouteResult> {
  if (method === "GET" && pathname === "/healthz") {
    return { status: 200, body: { ok: true } };
  }
  if (method === "GET" && pathname === "/decisions") {
    const auth = authorizeDecisionsRequest(deps, options.headers);
    if (auth) return auth;
    return { status: 200, body: { decisions: await deps.decisions.listPending() } };
  }
  const decisionMatch = pathname.match(/^\/decisions\/([^/]+)\/(approve|reject)$/);
  if (method === "POST" && decisionMatch) {
    const auth = authorizeDecisionsRequest(deps, options.headers);
    if (auth) return auth;
    const status = decisionMatch[2] === "approve" ? "approved" : "rejected";
    const decision = await deps.decisions.updateStatus(decisionMatch[1], status);
    const doubleDown = status === "approved" ? await deps.doubleDown?.executeApprovedDecision(decision) : undefined;
    return { status: 200, body: doubleDown ? { decision, doubleDown } : { decision } };
  }
  if (method === "POST" && pathname === "/tasks/generate") {
    const count = Number((body as { count?: unknown }).count ?? 3);
    return { status: 200, body: { result: await deps.pipeline.run(count) } };
  }
  if (method === "POST" && pathname === "/tasks/double-down") {
    if (!deps.doubleDown) return { status: 503, body: { error: "double_down_not_configured" } };
    return { status: 200, body: { results: await deps.doubleDown.scanPublishedProducts() } };
  }
  if (method === "POST" && pathname === "/metrics") {
    return { status: 201, body: { metrics: await deps.metrics.record(body as MetricsSnapshot) } };
  }
  return { status: 404, body: { error: "not_found" } };
}

function authorizeDecisionsRequest(
  deps: ApiServerDependencies,
  headers: Record<string, string | string[] | undefined> = {}
): RouteResult | undefined {
  if (!deps.decisionsApiKey) return undefined;
  const provided = headerValue(headers, "x-api-key");
  if (provided === deps.decisionsApiKey) return undefined;
  return { status: 401, body: { error: "unauthorized" } };
}

function headerValue(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
