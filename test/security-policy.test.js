/* eslint-disable vue/one-component-per-file */
const assert = require("assert");
const md5 = require("md5");

const apiSignVerifyFactory = require("../app/middleware/api-sign-verify");
const projectHandlerFactory = require("../app/middleware/project-handler");
const securityPolicyFactory = require("../app/middleware/security-policy");

describe("security policy middleware", () => {
  it("preserves defaults: signature off and project key enforcement on", async () => {
    const calls = [];
    const app = {
      config: {},
      middlewares: {
        apiSignVerify: () => calls.push("signature"),
        projectHandler: async (_ctx, next) => {
          calls.push("project-key");
          await next();
        },
      },
    };
    const policy = securityPolicyFactory(app);

    await policy({}, async () => calls.push("next"));

    assert.deepStrictEqual(calls, ["project-key", "next"]);
  });

  it("enables signature verification before project key checks by policy", async () => {
    const calls = [];
    const app = {
      config: { security: { apiSignature: { enabled: true } } },
      middlewares: {
        apiSignVerify: async (_ctx, next) => {
          calls.push("signature");
          await next();
        },
        projectHandler: async (_ctx, next) => {
          calls.push("project-key");
          await next();
        },
      },
    };

    await securityPolicyFactory(app)({}, async () => calls.push("next"));

    assert.deepStrictEqual(calls, ["signature", "project-key", "next"]);
  });

  it("allows a host app to disable project key checks centrally", async () => {
    let continued = false;
    const app = {
      config: { security: { projectKey: { enabled: false } } },
      middlewares: {
        apiSignVerify: () => assert.fail("signature should remain disabled"),
        projectHandler: () => assert.fail("project key check should be disabled"),
      },
    };

    await securityPolicyFactory(app)({}, async () => {
      continued = true;
    });

    assert.strictEqual(continued, true);
  });

  it("supports configured project-key headers and additional free paths", async () => {
    const app = {
      config: {
        security: {
          projectKey: {
            headerName: "x-project-key",
            freePaths: ["/api/project/public"],
          },
        },
      },
    };
    const middleware = projectHandlerFactory(app);
    let nextCalled = false;
    const ctx = {
      path: "/api/project/item",
      request: { headers: { "x-project-key": "demo-project" } },
    };

    await middleware(ctx, async () => {
      nextCalled = true;
    });
    assert.strictEqual(ctx.projectKey, "demo-project");
    assert.strictEqual(nextCalled, true);

    await middleware(
      { path: "/api/project/public", request: { headers: {} } },
      async () => {
        nextCalled = true;
      },
    );
    assert.strictEqual(nextCalled, true);
  });

  it("rejects future timestamps and accepts a valid configured signature", async () => {
    const app = {
      config: {
        security: {
          apiSignature: { secret: "test-secret", maxAgeMs: 1000 },
        },
      },
      logger: { info() {} },
    };
    const middleware = apiSignVerifyFactory(app);
    const futureTimestamp = Date.now() + 60_000;
    const futureContext = {
      path: "/api/private",
      method: "GET",
      request: {
        headers: {
          s_t: String(futureTimestamp),
          s_sign: md5(`test-secret_${futureTimestamp}`),
        },
      },
    };
    let continued = false;

    await middleware(futureContext, async () => {
      continued = true;
    });
    assert.strictEqual(futureContext.body.code, 445);
    assert.strictEqual(continued, false);

    const timestamp = Date.now();
    const validContext = {
      path: "/api/private",
      method: "GET",
      request: {
        headers: {
          s_t: String(timestamp),
          s_sign: md5(`test-secret_${timestamp}`),
        },
      },
    };
    await middleware(validContext, async () => {
      continued = true;
    });
    assert.strictEqual(continued, true);
  });

  it("keeps project-key checks enabled by default", async () => {
    const middleware = projectHandlerFactory({ config: {} });
    const context = {
      path: "/api/project/product",
      request: { headers: {} },
    };
    let continued = false;

    await middleware(context, async () => {
      continued = true;
    });

    assert.strictEqual(context.body.code, 446);
    assert.strictEqual(continued, false);
  });
});