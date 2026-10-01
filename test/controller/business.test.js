const assert = require("assert");
const supertest = require("supertest");
const lumfallCore = require("../../lumfall-core");

describe("framework project APIs", function () {
  this.timeout(30000);

  let app;
  let request;
  let previousPort;

  before(async () => {
    previousPort = process.env.PORT;
    process.env.PORT = "0";
    app = lumfallCore.start({ name: "Project API Test", homePath: "/" });
    await new Promise((resolve, reject) => {
      if (app.server.listening) {
        resolve();
        return;
      }
      app.server.once("listening", resolve);
      app.server.once("error", reject);
    });
    request = supertest(app.callback());
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

  it("GET /api/project/model_list returns the discovered model list", async () => {
    const response = await request.get("/api/project/model_list");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.deepStrictEqual(response.body.data, []);
  });

  it("GET /api/project/list accepts a project filter and returns a list", async () => {
    const response = await request
      .get("/api/project/list")
      .query({ projectKey: "store-a" });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.deepStrictEqual(response.body.data, []);
  });

  it("GET /api/project requires projectKey according to its schema", async () => {
    const response = await request.get("/api/project");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.code, 442);
  });

  it("GET /api/project reports a missing project after valid input", async () => {
    const response = await request
      .get("/api/project")
      .query({ projectKey: "missing-project" });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.code, 50000);
  });
});