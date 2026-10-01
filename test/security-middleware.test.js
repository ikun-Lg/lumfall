const assert = require("assert");
const apiParamsVerifyFactory = require("../app/middleware/api-params-verify");
const projectHandlerFactory = require("../app/middleware/project-handler");

describe("security and request validation middleware", () => {
  it("allows project-global paths without a project key", async () => {
    const middleware = projectHandlerFactory({});
    let continued = false;

    await middleware(
      { path: "/api/project/model_list", request: { headers: {} } },
      async () => {
        continued = true;
      },
    );

    assert.strictEqual(continued, true);
  });

  it("rejects project-scoped paths without a project key", async () => {
    const middleware = projectHandlerFactory({});
    const context = {
      path: "/api/project/product",
      request: { headers: {} },
    };

    await middleware(context, async () => assert.fail("request should be rejected"));

    assert.strictEqual(context.body.code, 446);
  });

  it("attaches a valid project key to the request context", async () => {
    const middleware = projectHandlerFactory({});
    const context = {
      path: "/api/project/product",
      request: { headers: { project_key: "store-a" } },
    };
    let continued = false;

    await middleware(context, async () => {
      continued = true;
    });

    assert.strictEqual(context.projectKey, "store-a");
    assert.strictEqual(continued, true);
  });

  it("returns validation error 442 for invalid request data", async () => {
    const middleware = apiParamsVerifyFactory({
      routerSchema: {
        "/api/probe": {
          post: { body: { type: "object", required: ["name"] } },
        },
      },
      logger: { info() {} },
    });
    const context = {
      path: "/api/probe",
      method: "POST",
      request: { body: {}, query: {}, headers: {} },
      params: {},
    };
    let continued = false;

    await middleware(context, async () => {
      continued = true;
    });

    assert.strictEqual(context.body.code, 442);
    assert.strictEqual(continued, false);
  });
});