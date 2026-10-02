const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const lumfallCore = require("../lumfall-core");

describe("startup logs", function () {
  this.timeout(30000);

  let app;
  let fixtureDir;
  let previousCwd;
  let previousPort;
  let captured;
  let originalLog;

  before(async () => {
    previousCwd = process.cwd();
    previousPort = process.env.PORT;
    process.env.PORT = "0";

    // fixture：配置中带敏感标记值，验证启动日志不泄露内容
    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-startup-logs-"));
    fs.mkdirSync(path.join(fixtureDir, "config"));
    fs.writeFileSync(
      path.join(fixtureDir, "config", "config.default.js"),
      'module.exports = { dbPassword: "SUPER-SECRET-VALUE-42", name: "log-test" };\n',
    );
    process.chdir(fixtureDir);

    captured = [];
    originalLog = console.log;
    console.log = (...args) => {
      captured.push(args.map((item) => String(item)).join(" "));
    };

    app = lumfallCore.start({});
  });

  after(async () => {
    console.log = originalLog;
    await app.stop();
    process.chdir(previousCwd);
    process.env.PORT = previousPort;
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  it("does not print merged config content (no secret leakage)", () => {
    const output = captured.join("\n");

    assert.ok(!output.includes("SUPER-SECRET-VALUE-42"));
    assert.ok(!output.includes("dbPassword"));
  });

  it("does not print mounted controllers/services/router-schema dumps", () => {
    const output = captured.join("\n");

    // 旧实现会 console.log 整个挂载点对象，这里断言不再出现对象 dump 的痕迹
    assert.ok(!/\[start\] load .* done.*\{/.test(output));
  });

  it("prints per-loader summary counts", () => {
    const output = captured.join("\n");

    assert.match(output, /\[start\] load middleware done \(\d+\)/);
    assert.match(output, /\[start\] load router schema done \(\d+\)/);
    assert.match(output, /\[start\] load controller done \(\d+\)/);
    assert.match(output, /\[start\] load service done \(\d+\)/);
    assert.match(output, /\[start\] load config done \(\d+ keys\)/);
    assert.match(output, /\[start\] load extend done/);
  });

  it("config values still reach app.config at runtime", () => {
    assert.strictEqual(app.config.dbPassword, "SUPER-SECRET-VALUE-42");
  });
});
