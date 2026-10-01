/* eslint-disable vue/one-component-per-file */
const assert = require("assert");
const lumfallCore = require("../lumfall-core");

describe("diagnostics manifest", function () {
  this.timeout(30000);

  let previousPort;
  let app;

  before(() => {
    previousPort = process.env.PORT;
    process.env.PORT = "0";
    app = lumfallCore.start({ name: "Diagnostics Test", homePath: "/" });
  });

  after((done) => {
    if (app?.server) {
      app.server.close(done);
      return;
    }
    done();
  });

  after(() => {
    if (previousPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = previousPort;
    }
  });

  it("reports stable loader, route, page, and health-check metadata", () => {
    const unregister = app.health.register("diagnostics-test", async () => true, {
      timeoutMs: 250,
    });
    app.config.privateToken = "do-not-expose";

    try {
      const manifest = app.diagnostics.getManifest();

      assert.deepStrictEqual(manifest.loaders, [
        "middleware",
        "router-schema",
        "controller",
        "service",
        "config",
        "extend",
        "router",
      ]);
      assert(manifest.routes.some((route) => route.path === "/health/live"));
      assert(manifest.pages.some((page) => page.name === "health"));
      assert(manifest.healthChecks.some((check) => check.name === "diagnostics-test"));
      assert(!JSON.stringify(manifest).includes("do-not-expose"));
      assert(!JSON.stringify(manifest).includes("privateToken"));
    } finally {
      unregister();
    }
  });

  it("returns serializable snapshots that reflect current registrations", () => {
    const manifest = app.diagnostics.getManifest();

    assert.doesNotThrow(() => JSON.stringify(manifest));
    assert(!manifest.healthChecks.some((check) => check.name === "diagnostics-test"));
  });

  it("includes relative page entry paths and preserves duplicate route registrations", () => {
    app.router.stack.push(
      { path: "/diagnostics/duplicate", methods: ["POST"] },
      { path: "/diagnostics/duplicate", methods: ["GET"] },
    );

    const manifest = app.diagnostics.getManifest();
    const healthPage = manifest.pages.find((page) => page.name === "health");
    const duplicateRoutes = manifest.routes.filter(
      (route) => route.path === "/diagnostics/duplicate",
    );
    const serializedRoutes = manifest.routes.map((route) =>
      JSON.stringify([route.path, route.methods]),
    );

    assert.strictEqual(healthPage.entry, "health/entry.health.js");
    assert.strictEqual(duplicateRoutes.length, 2);
    assert.deepStrictEqual(serializedRoutes, serializedRoutes.slice().sort());
  });
});