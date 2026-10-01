const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const controllerLoader = require("../lumfall-core/loader/controller");
const extendLoader = require("../lumfall-core/loader/extend");
const middlewareLoader = require("../lumfall-core/loader/middleware");
const routerSchemaLoader = require("../lumfall-core/loader/router-schema");
const serviceLoader = require("../lumfall-core/loader/service");

describe("loader export validation", () => {
  let businessPath;

  beforeEach(() => {
    businessPath = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-loader-"));
    ["controller", "extend", "middleware", "router-schema", "service"].forEach(
      (directory) => fs.mkdirSync(path.join(businessPath, directory)),
    );
  });

  afterEach(() => {
    fs.rmSync(businessPath, { recursive: true, force: true });
  });

  function writeModule(directory, filename, source) {
    fs.writeFileSync(path.join(businessPath, directory, filename), source);
  }

  function createApp() {
    return {
      businessPath,
      env: { isLocal: () => true },
    };
  }

  it("rejects middleware modules that do not export a factory", () => {
    writeModule("middleware", "invalid-middleware.js", "module.exports = {};");

    assert.throws(
      () => middlewareLoader(createApp()),
      /\[middleware\].*invalid-middleware\.js.*factory function/,
    );
  });

  it("rejects middleware factories that do not return middleware", () => {
    writeModule(
      "middleware",
      "invalid-middleware.js",
      "module.exports = () => ({});",
    );

    assert.throws(
      () => middlewareLoader(createApp()),
      /\[middleware\].*factory must return a middleware function/,
    );
  });

  it("rejects controller factories that do not return a constructor", () => {
    writeModule("controller", "invalid-controller.js", "module.exports = () => ({});");

    assert.throws(
      () => controllerLoader(createApp()),
      /\[controller\].*invalid-controller\.js.*class or constructor/,
    );
  });

  it("rejects service modules that do not export a factory", () => {
    writeModule("service", "invalid-service.js", "module.exports = {};");

    assert.throws(
      () => serviceLoader(createApp()),
      /\[service\].*invalid-service\.js.*factory function/,
    );
  });

  it("rejects extend modules instead of silently skipping them", () => {
    writeModule("extend", "invalid-extend.js", "module.exports = {};");

    assert.throws(
      () => extendLoader(createApp()),
      /\[extend\].*invalid-extend\.js.*factory function/,
    );
  });

  it("rejects router schema modules that are not maps or factories", () => {
    writeModule("router-schema", "invalid-schema.js", "module.exports = false;");

    assert.throws(
      () => routerSchemaLoader(createApp()),
      /\[router-schema\].*invalid-schema\.js.*schema map or factory/,
    );
  });

  it("rejects router schema factories that do not return maps", () => {
    writeModule(
      "router-schema",
      "invalid-schema.js",
      "module.exports = () => [];",
    );

    assert.throws(
      () => routerSchemaLoader(createApp()),
      /\[router-schema\].*factory must return a schema map/,
    );
  });
});