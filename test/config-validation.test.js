const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const configLoader = require("../lumfall-core/loader/config");

describe("configuration validation", () => {
  let baseDir;

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-config-"));
    fs.mkdirSync(path.join(baseDir, "config"));
  });

  afterEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true });
  });

  function writeConfig(filename, source) {
    fs.writeFileSync(path.join(baseDir, "config", filename), source);
  }

  function loadConfig(options = {}) {
    const app = {
      baseDir,
      env: { get: () => "local" },
      options,
    };
    configLoader(app);
    return app.config;
  }

  it("preserves the existing config merge precedence", () => {
    writeConfig(
      "config.default.js",
      'module.exports = { value: "business-default", businessOnly: true };',
    );
    writeConfig(
      "config.local.js",
      'module.exports = { value: "business-local" };',
    );

    const config = loadConfig();

    assert.strictEqual(config.value, "business-local");
    assert.strictEqual(config.businessOnly, true);
    assert.strictEqual(config.name, "LG");
  });

  it("accepts values matching the optional JSON schema", () => {
    writeConfig("config.default.js", 'module.exports = { port: 3000 };');

    const config = loadConfig({
      configSchema: {
        type: "object",
        required: ["port"],
        properties: { port: { type: "integer", minimum: 1 } },
      },
    });

    assert.strictEqual(config.port, 3000);
  });

  it("rejects merged values that violate the schema with field details", () => {
    writeConfig("config.default.js", 'module.exports = { port: "3000" };');

    assert.throws(
      () =>
        loadConfig({
          configSchema: {
            type: "object",
            properties: { port: { type: "integer" } },
          },
        }),
      /\[config\].*local.*\.port.*should be integer/,
    );
  });

  it("rejects config modules that do not export plain objects", () => {
    writeConfig("config.default.js", "module.exports = new Date();");

    assert.throws(
      () => loadConfig(),
      /\[config\].*config\.default\.js must export a plain object/,
    );
  });

  it("reports invalid schema definitions clearly", () => {
    assert.throws(
      () => loadConfig({ configSchema: { type: "not-a-json-schema-type" } }),
      /\[config\] options\.configSchema is invalid/,
    );
  });
});