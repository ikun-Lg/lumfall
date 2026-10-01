const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const controllerLoader = require("../lumfall-core/loader/controller");
const extendLoader = require("../lumfall-core/loader/extend");
const middlewareLoader = require("../lumfall-core/loader/middleware");
const routerSchemaLoader = require("../lumfall-core/loader/router-schema");
const serviceLoader = require("../lumfall-core/loader/service");

describe("core loaders", () => {
  let businessPath;
  let app;

  beforeEach(() => {
    businessPath = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-loaders-"));
    ["controller", "extend", "middleware", "router-schema", "service"].forEach(
      (directory) => fs.mkdirSync(path.join(businessPath, directory)),
    );
    app = { businessPath, env: { isLocal: () => true } };
    fs.writeFileSync(
      path.join(businessPath, "controller", "probe-controller.js"),
      "module.exports = () => class ProbeController {};\n",
    );
    fs.writeFileSync(
      path.join(businessPath, "extend", "probe-extend.js"),
      'module.exports = () => ({ ready: true });\n',
    );
    fs.writeFileSync(
      path.join(businessPath, "middleware", "probe-middleware.js"),
      "module.exports = () => async (_ctx, next) => next();\n",
    );
    fs.writeFileSync(
      path.join(businessPath, "router-schema", "probe.js"),
      'module.exports = { "/api/probe": { get: {} } };\n',
    );
    fs.writeFileSync(
      path.join(businessPath, "service", "probe-service.js"),
      "module.exports = () => class ProbeService {};\n",
    );
  });

  afterEach(() => {
    fs.rmSync(businessPath, { recursive: true, force: true });
  });

  it("mounts valid controller, service, middleware, extend, and schema modules", () => {
    middlewareLoader(app);
    routerSchemaLoader(app);
    controllerLoader(app);
    serviceLoader(app);
    extendLoader(app);

    assert.strictEqual(
      app.controllers.probeController.constructor.name,
      "ProbeController",
    );
    assert.strictEqual(
      app.services.probeService.constructor.name,
      "ProbeService",
    );
    assert.strictEqual(typeof app.middlewares.probeMiddleware, "function");
    assert.deepStrictEqual(app.probeExtend, { ready: true });
    assert.deepStrictEqual(app.routerSchema["/api/probe"], { get: {} });
  });
});