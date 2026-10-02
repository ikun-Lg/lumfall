const assert = require("assert");
const supertest = require("supertest");
const { serviceStart } = require("../index");

describe("serviceStart default options", function () {
  this.timeout(30000);

  let previousPort;

  beforeEach(() => {
    previousPort = process.env.PORT;
    process.env.PORT = "0";
  });

  afterEach(() => {
    process.env.PORT = previousPort;
  });

  it("applies homePath/name defaults when only some options are provided", async () => {
    const app = serviceStart({ name: "defaults-test" });

    assert.strictEqual(app.options.name, "defaults-test");
    assert.strictEqual(app.options.homePath, "/view/health");

    const request = supertest(app.callback());
    const response = await request.get("/no-such-route");

    assert.strictEqual(response.status, 302);
    assert.match(response.headers.location, /\/view\/health$/);

    await app.stop();
  });

  it("applies defaults when called without arguments", async () => {
    const app = serviceStart();

    assert.strictEqual(app.options.name, "lumfall");
    assert.strictEqual(app.options.homePath, "/view/health");

    await app.stop();
  });

  it("keeps explicitly provided options intact", async () => {
    const app = serviceStart({ name: "explicit", homePath: "/custom" });

    assert.strictEqual(app.options.name, "explicit");
    assert.strictEqual(app.options.homePath, "/custom");

    const request = supertest(app.callback());
    const response = await request.get("/no-such-route");

    assert.strictEqual(response.status, 302);
    assert.match(response.headers.location, /\/custom$/);

    await app.stop();
  });
});
