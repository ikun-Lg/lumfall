const assert = require("assert");
const supertest = require("supertest");

const lumfallCore = require("../lumfall-core");
const monitoringFactory = require("../app/middleware/monitoring");

function createContext({
  method = "GET",
  path = "/api/probe",
  headers = {},
  status = 200,
} = {}) {
  const responseHeaders = {};

  return {
    method,
    path,
    status,
    request: { headers },
    set(name, value) {
      responseHeaders[name] = value;
    },
    responseHeaders,
  };
}

describe("monitoring middleware", () => {
  it("is a passthrough when monitoring is not configured", async () => {
    const middleware = monitoringFactory({ options: {} });
    const context = createContext();
    let continued = false;

    await middleware(context, async () => {
      continued = true;
    });

    assert.strictEqual(continued, true);
    assert.strictEqual(context.traceId, undefined);
    assert.deepStrictEqual(context.responseHeaders, {});
  });

  it("records request timing and a generated correlation id", async () => {
    const events = [];
    const middleware = monitoringFactory({
      options: {
        monitoring: {
          onRequestStart: (payload) => events.push(["start", payload]),
          onRequestEnd: (payload) => events.push(["end", payload]),
        },
      },
      logger: { warn() {} },
    });
    const context = createContext({ method: "POST", path: "/api/probe" });

    await middleware(context, async () => {
      context.status = 204;
    });

    const [[startName, start], [endName, end]] = events;
    assert.strictEqual(startName, "start");
    assert.strictEqual(endName, "end");
    assert.deepStrictEqual(
      { method: start.method, path: start.path },
      { method: "POST", path: "/api/probe" },
    );
    assert.match(context.traceId, /^[0-9a-f-]{36}$/);
    assert.strictEqual(context.responseHeaders["X-Trace-Id"], context.traceId);
    assert.strictEqual(end.traceId, context.traceId);
    assert.strictEqual(end.status, 204);
    assert.strictEqual(typeof end.durationMs, "number");
    assert(end.durationMs >= 0);
  });

  it("reuses the incoming trace header for correlation", async () => {
    const middleware = monitoringFactory({
      options: { monitoring: { onRequestEnd() {} } },
      logger: { warn() {} },
    });
    const context = createContext({ headers: { "x-trace-id": "upstream-42" } });

    await middleware(context, async () => {});

    assert.strictEqual(context.traceId, "upstream-42");
    assert.strictEqual(context.responseHeaders["X-Trace-Id"], "upstream-42");
  });

  it("supports a custom trace header", async () => {
    const middleware = monitoringFactory({
      options: { monitoring: { traceHeader: "x-request-id", onRequestEnd() {} } },
      logger: { warn() {} },
    });
    const context = createContext({ headers: { "x-request-id": "req-7" } });

    await middleware(context, async () => {});

    assert.strictEqual(context.traceId, "req-7");
    assert.strictEqual(context.responseHeaders["X-Request-Id"], "req-7");
  });

  it("reports errors and still propagates the original error", async () => {
    const expectedError = new Error("downstream failed");
    let receivedError;
    let receivedDuration;
    const middleware = monitoringFactory({
      options: {
        monitoring: {
          onRequestError({ error, durationMs }) {
            receivedError = error;
            receivedDuration = durationMs;
          },
        },
      },
      logger: { warn() {} },
    });

    await assert.rejects(
      () => middleware(createContext(), async () => {
        throw expectedError;
      }),
      (error) => error === expectedError,
    );

    assert.strictEqual(receivedError, expectedError);
    assert(receivedDuration >= 0);
  });

  it("keeps the request outcome when hooks themselves throw", async () => {
    const warnings = [];
    const middleware = monitoringFactory({
      options: {
        monitoring: {
          onRequestStart() {
            throw new Error("start hook failed");
          },
          onRequestEnd() {
            throw new Error("end hook failed");
          },
          onRequestError() {
            throw new Error("error hook failed");
          },
        },
      },
      logger: {
        warn(message) {
          warnings.push(message);
        },
      },
    });

    await assert.doesNotReject(() => middleware(createContext(), async () => {}));

    const expectedError = new Error("original failure");
    await assert.rejects(
      () => middleware(createContext(), async () => {
        throw expectedError;
      }),
      (error) => error === expectedError,
    );

    assert.strictEqual(warnings.length, 4);
    assert(warnings.every((message) => message.startsWith("[monitoring]")));
  });

  it("rejects invalid monitoring configuration", () => {
    assert.throws(
      () => monitoringFactory({ options: { monitoring: "yes" } }),
      /\[monitoring\] options\.monitoring must be a plain object/,
    );
    assert.throws(
      () => monitoringFactory({ options: { monitoring: { onRequest: () => {} } } }),
      /\[monitoring\] unknown option or hook "onRequest"/,
    );
    assert.throws(
      () => monitoringFactory({ options: { monitoring: { onRequestEnd: "nope" } } }),
      /\[monitoring\] hook "onRequestEnd" must be a function/,
    );
    assert.throws(
      () => monitoringFactory({ options: { monitoring: { traceHeader: "" } } }),
      /\[monitoring\] traceHeader must be a non-empty string/,
    );
  });
});

describe("monitoring integration", function () {
  this.timeout(30000);

  let app;
  let previousPort;

  before(async () => {
    previousPort = process.env.PORT;
    process.env.PORT = "0";
    app = lumfallCore.start({
      name: "Monitoring Test",
      homePath: "/",
      monitoring: {},
    });
    await new Promise((resolve, reject) => {
      if (app.server.listening) {
        resolve();
        return;
      }
      app.server.once("listening", resolve);
      app.server.once("error", reject);
    });
  });

  after(async () => {
    if (app?.server?.listening) {
      await new Promise((resolve, reject) =>
        app.server.close((error) => (error ? reject(error) : resolve())),
      );
    }
    if (previousPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = previousPort;
    }
  });

  it("echoes the correlation id and records a real request", async () => {
    const events = [];
    app.options.monitoring.onRequestStart = (payload) =>
      events.push(["start", payload]);
    app.options.monitoring.onRequestEnd = (payload) =>
      events.push(["end", payload]);

    const response = await supertest(app.callback())
      .get("/health/live")
      .set("x-trace-id", "int-trace-1");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers["x-trace-id"], "int-trace-1");
    assert.deepStrictEqual(
      events.map(([name]) => name),
      ["start", "end"],
    );
    assert.strictEqual(events[0][1].path, "/health/live");
    assert.strictEqual(events[1][1].status, 200);
  });

  it("observes a downstream template error without changing the response", async () => {
    const errors = [];
    app.options.monitoring.onRequestError = (payload) => errors.push(payload);

    const response = await supertest(app.callback()).get(
      "/view/definitely-missing-page",
    );

    assert.strictEqual(response.status, 302);
    assert.strictEqual(errors.length, 1);
    assert.match(errors[0].error.message, /template not found/);
    assert.strictEqual(errors[0].path, "/view/definitely-missing-page");
  });
});
