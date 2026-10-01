const assert = require("assert");
const lumfallCore = require("../lumfall-core");
const registerPlugins = require("../lumfall-core/plugins");

describe("plugin registration", () => {
  it("keeps the default startup path lightweight with an empty registry", () => {
    const app = {};

    registerPlugins(app);

    assert.deepStrictEqual(app.plugins, {});
  });

  it("registers plugins in stable dependency order and exposes their API", () => {
    const calls = [];
    const app = {};

    registerPlugins(app, [
      {
        name: "consumer",
        dependencies: ["storage"],
        register(instance) {
          calls.push(`consumer:${instance.plugins.storage.ready}`);
          return { ready: true };
        },
      },
      {
        name: "storage",
        register() {
          calls.push("storage");
          return { ready: true };
        },
      },
      {
        name: "metrics",
        register() {
          calls.push("metrics");
        },
      },
    ]);

    assert.deepStrictEqual(calls, ["storage", "consumer:true", "metrics"]);
    assert.deepStrictEqual(app.plugins, {
      storage: { ready: true },
      consumer: { ready: true },
      metrics: {},
    });
  });

  it("rejects duplicate names and malformed plugin definitions", () => {
    assert.throws(
      () =>
        registerPlugins({}, [
          { name: "duplicate", register() {} },
          { name: "duplicate", register() {} },
        ]),
      /\[plugin\] duplicate plugin name "duplicate"/,
    );
    assert.throws(
      () => registerPlugins({}, [{ name: "missing-register" }]),
      /\[plugin\].*must provide register\(app\)/,
    );
  });

  it("rejects missing dependencies and dependency cycles", () => {
    assert.throws(
      () =>
        registerPlugins({}, [
          { name: "consumer", dependencies: ["missing"], register() {} },
        ]),
      /\[plugin\].*depends on unknown plugin "missing"/,
    );
    assert.throws(
      () =>
        registerPlugins({}, [
          { name: "first", dependencies: ["second"], register() {} },
          { name: "second", dependencies: ["first"], register() {} },
        ]),
      /\[plugin\] dependency cycle detected: first -> second -> first/,
    );
  });

  it("rejects invalid and asynchronous plugin results", () => {
    assert.throws(
      () =>
        registerPlugins({}, [
          { name: "invalid", register: () => [] },
        ]),
      /\[plugin\].*must return a plain object or undefined/,
    );
    assert.throws(
      () =>
        registerPlugins({}, [
          { name: "async", register: async () => ({}) },
        ]),
      /\[plugin\].*must be synchronous/,
    );
  });

  it("registers startup plugins after config and extension loaders", async function () {
    this.timeout(30000);
    const previousPort = process.env.PORT;
    process.env.PORT = "0";

    try {
      const app = lumfallCore.start({
        plugins: [
          {
            name: "startup-check",
            register(instance) {
              assert.ok(instance.config);
              assert.ok(instance.env);
              return { ready: true };
            },
          },
        ],
      });
      assert.deepStrictEqual(app.plugins["startup-check"], { ready: true });
      await new Promise((resolve, reject) => {
        if (app.server.listening) {
          resolve();
          return;
        }
        app.server.once("listening", resolve);
        app.server.once("error", reject);
      });
      await new Promise((resolve, reject) =>
        app.server.close((error) => (error ? reject(error) : resolve())),
      );
    } catch (error) {
      throw error;
    } finally {
      if (previousPort === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = previousPort;
      }
    }
  });

  it("includes the plugin name when registration throws", () => {
    assert.throws(
      () =>
        registerPlugins({}, [
          {
            name: "broken-plugin",
            register() {
              throw new Error("setup failed");
            },
          },
        ]),
      /\[plugin\] plugin "broken-plugin" registration failed: setup failed/,
    );
  });
});