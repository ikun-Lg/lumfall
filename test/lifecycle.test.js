/* eslint-disable vue/one-component-per-file */
const assert = require("assert");
const lumfallCore = require("../lumfall-core");

describe("application lifecycle hooks", function () {
  this.timeout(30000);

  let previousPort;

  before(() => {
    previousPort = process.env.PORT;
    process.env.PORT = "0";
  });

  after(() => {
    if (previousPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = previousPort;
    }
  });

  it("runs startup hooks in order and awaits teardown hooks", async () => {
    const calls = [];
    const app = lumfallCore.start({
      name: "Lifecycle Test",
      lifecycle: {
        beforeStart: () => calls.push("beforeStart"),
        beforeRouteLoad: () => calls.push("beforeRouteLoad"),
        afterRouteLoad: () => calls.push("afterRouteLoad"),
        afterStart: () => calls.push("afterStart"),
        beforeStop: async () => {
          await Promise.resolve();
          calls.push("beforeStop");
        },
        afterStop: () => calls.push("afterStop"),
      },
    });

    assert.deepStrictEqual(calls, [
      "beforeStart",
      "beforeRouteLoad",
      "afterRouteLoad",
      "afterStart",
    ]);

    await app.stop();
    assert.deepStrictEqual(calls, [
      "beforeStart",
      "beforeRouteLoad",
      "afterRouteLoad",
      "afterStart",
      "beforeStop",
      "afterStop",
    ]);
  });

  it("calls onError and rethrows startup failures", () => {
    const expectedError = new Error("before start failed");
    let receivedError;

    assert.throws(
      () =>
        lumfallCore.start({
          lifecycle: {
            beforeStart() {
              throw expectedError;
            },
            onError(error) {
              receivedError = error;
            },
          },
        }),
      (error) => error === expectedError,
    );
    assert.strictEqual(receivedError, expectedError);
  });

  it("rejects unknown hooks and asynchronous startup hooks", () => {
    assert.throws(
      () => lumfallCore.start({ lifecycle: { unknownHook() {} } }),
      /\[lifecycle\] unknown hook "unknownHook"/,
    );

    assert.throws(
      () => lumfallCore.start({ lifecycle: { beforeStart: async () => {} } }),
      /hook "beforeStart" must be synchronous/,
    );
  });
});