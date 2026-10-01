const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const configLoader = require("../lumfall-core/loader/config");

describe("config loader", () => {
  let baseDir;

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-config-loader-"));
    fs.mkdirSync(path.join(baseDir, "config"));
  });

  afterEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true });
  });

  function loadConfig() {
    const app = { baseDir, env: { get: () => "local" } };
    configLoader(app);
    return app.config;
  }

  it("merges business environment values over business defaults", () => {
    fs.writeFileSync(
      path.join(baseDir, "config", "config.default.js"),
      'module.exports = { name: "business", enabled: true };\n',
    );
    fs.writeFileSync(
      path.join(baseDir, "config", "config.local.js"),
      'module.exports = { name: "local-business" };\n',
    );

    assert.deepStrictEqual(loadConfig(), {
      name: "local-business",
      enabled: true,
    });
  });

  it("rejects config exports that are not plain objects", () => {
    fs.writeFileSync(
      path.join(baseDir, "config", "config.default.js"),
      "module.exports = [];\n",
    );

    assert.throws(
      () => loadConfig(),
      /\[config\].*config\.default\.js must export a plain object/,
    );
  });
});