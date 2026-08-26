import assert from "node:assert/strict";
import test from "node:test";
import { routeRequest } from "../src/http/server.js";

test("API exposes health and pending decisions", async () => {
  const deps = {
    decisions: {
      async listPending() { return [{ id: "d1", type: "ship", status: "pending" }]; },
      async updateStatus() { throw new Error("unused"); },
      async create() { throw new Error("unused"); }
    } as never,
    pipeline: { async run() { return { generated: 0, demandPassed: 0, duplicates: 0, decisionsCreated: 0 }; } } as never,
    metrics: { async record(value: unknown) { return value; } } as never
  };

  assert.deepEqual(await routeRequest(deps, "GET", "/healthz"), { status: 200, body: { ok: true } });
  assert.deepEqual(await routeRequest(deps, "GET", "/decisions"), {
    status: 200,
    body: { decisions: [{ id: "d1", type: "ship", status: "pending" }] }
  });
});

test("decisions API requires x-api-key when configured", async () => {
  const deps = {
    decisions: {
      async listPending() { return [{ id: "d1", type: "ship", status: "pending" }]; },
      async updateStatus() { return { id: "d1", status: "approved" }; },
      async create() { throw new Error("unused"); }
    } as never,
    pipeline: { async run() { throw new Error("unused"); } } as never,
    metrics: { async record(value: unknown) { return value; } } as never,
    decisionsApiKey: "secret-key"
  };

  assert.deepEqual(await routeRequest(deps, "GET", "/decisions"), {
    status: 401,
    body: { error: "unauthorized" }
  });
  assert.deepEqual(await routeRequest(deps, "GET", "/decisions", {}, { headers: { "x-api-key": "secret-key" } }), {
    status: 200,
    body: { decisions: [{ id: "d1", type: "ship", status: "pending" }] }
  });
  assert.deepEqual(
    await routeRequest(deps, "POST", "/decisions/d1/approve", {}, { headers: { "x-api-key": "secret-key" } }),
    {
      status: 200,
      body: { decision: { id: "d1", status: "approved" } }
    }
  );
});

test("approving a double-down decision executes configured workflow", async () => {
  let executedId = "";
  const deps = {
    decisions: {
      async listPending() { throw new Error("unused"); },
      async updateStatus() { return { id: "d2", type: "double-down", status: "approved" }; },
      async create() { throw new Error("unused"); }
    } as never,
    pipeline: { async run() { throw new Error("unused"); } } as never,
    metrics: { async record(value: unknown) { return value; } } as never,
    decisionsApiKey: "secret-key",
    doubleDown: {
      async executeApprovedDecision(decision: { id: string }) {
        executedId = decision.id;
        return { submissionId: "sub-1", status: "submitted" };
      }
    } as never
  };

  assert.deepEqual(
    await routeRequest(deps, "POST", "/decisions/d2/approve", {}, { headers: { "x-api-key": "secret-key" } }),
    {
      status: 200,
      body: {
        decision: { id: "d2", type: "double-down", status: "approved" },
        doubleDown: { submissionId: "sub-1", status: "submitted" }
      }
    }
  );
  assert.equal(executedId, "d2");
});
