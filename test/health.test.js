const assert = require("assert");
const supertest = require("supertest");
const lumfallCore = require("../lumfall-core");

describe("health endpoints", function () {
  this.timeout(30000);

  let app;
  let request;

  before(() => {
    app = lumfallCore.start({ name: "Lumfall Health Test", homePath: "/" });
    request = supertest(app.callback());
  });

  it("GET /health/live responds without running dependency checks", async () => {
    const response = await request.get("/health/live");

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { status: "ok" });
    assert.strictEqual(response.headers["cache-control"], "no-store");
  });

  it("GET /health/ready succeeds when registered checks pass", async () => {
    const unregister = app.health.register("test-dependency", async () => true);

    try {
      const response = await request.get("/health/ready");

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(response.body, {
        status: "ok",
        checks: [{ name: "test-dependency", status: "ok" }],
      });
    } finally {
      unregister();
    }
  });

  it("GET /health/ready fails closed without exposing probe errors", async () => {
    const unregisterFalse = app.health.register("false-probe", async () => false);
    const unregisterThrow = app.health.register("throw-probe", async () => {
      throw new Error("private dependency details");
    });

    try {
      const response = await request.get("/health/ready");

      assert.strictEqual(response.status, 503);
      assert.deepStrictEqual(response.body, {
        status: "error",
        checks: [
          { name: "false-probe", status: "error" },
          { name: "throw-probe", status: "error" },
        ],
      });
      assert(!JSON.stringify(response.body).includes("private dependency details"));
    } finally {
      unregisterFalse();
      unregisterThrow();
    }
  });

  it("times out slow readiness checks", async () => {
    const unregister = app.health.register(
      "slow-probe",
      () => new Promise((resolve) => setTimeout(resolve, 30)),
      { timeoutMs: 5 },
    );

    try {
      const response = await request.get("/health/ready");

      assert.strictEqual(response.status, 503);
      assert.deepStrictEqual(response.body.checks, [
        { name: "slow-probe", status: "error" },
      ]);
    } finally {
      unregister();
    }
  });

  after((done) => {
    if (app && app.server) {
      app.server.close(done);
      return;
    }
    done();
  });
});