const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const lumfallCore = require("../lumfall-core");

describe("nunjucks template cache", function () {
  this.timeout(30000);

  let fixtureDir;
  let previousCwd;
  let previousEnv;
  let previousPort;

  const tplLocations = () => [
    // 兼容按模式分目录前后的模板路径
    path.join(fixtureDir, "app", "public", "dist", "entry.cache.tpl"),
    path.join(fixtureDir, "app", "public", "dist", "prod", "entry.cache.tpl"),
    path.join(fixtureDir, "app", "public", "dist", "dev", "entry.cache.tpl"),
  ];

  const writeTpl = (content) => {
    tplLocations().forEach((file) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    });
  };

  const startApp = async () => {
    const app = lumfallCore.start({ name: "cache-test" });
    await new Promise((resolve, reject) => {
      if (app.server.listening) {
        resolve();
        return;
      }
      app.server.once("listening", resolve);
      app.server.once("error", reject);
    });
    return app;
  };

  before(() => {
    previousCwd = process.cwd();
    previousEnv = process.env._ENV;
    previousPort = process.env.PORT;
    process.env.PORT = "0";

    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-nunjucks-cache-"));
    fs.mkdirSync(path.join(fixtureDir, "config"));
    fs.writeFileSync(
      path.join(fixtureDir, "config", "config.default.js"),
      'module.exports = { name: "cache-test" };\n',
    );
    fs.mkdirSync(path.join(fixtureDir, "app", "pages", "cache"), { recursive: true });
    fs.writeFileSync(path.join(fixtureDir, "app", "pages", "cache", "entry.cache.js"), "");
    process.chdir(fixtureDir);
    writeTpl("v1:{{ name }}");
  });

  after(async () => {
    process.chdir(previousCwd);
    process.env._ENV = previousEnv;
    process.env.PORT = previousPort;
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  it("caches compiled templates in prod (disk changes need restart)", async () => {
    process.env._ENV = "prod";
    const app = await startApp();
    const request = require("supertest")(app.callback());

    const first = await request.get("/view/cache");
    assert.strictEqual(first.status, 200);
    assert.strictEqual(first.text, "v1:cache-test");

    writeTpl("v2:{{ name }}");
    const second = await request.get("/view/cache");
    assert.strictEqual(second.status, 200);
    assert.strictEqual(second.text, "v1:cache-test");

    await app.stop();
  });

  it("re-reads templates on every request in local (hot template edits)", async () => {
    process.env._ENV = "local";
    writeTpl("v2:{{ name }}");
    const app = await startApp();
    const request = require("supertest")(app.callback());

    const first = await request.get("/view/cache");
    assert.strictEqual(first.text, "v2:cache-test");

    writeTpl("v3:{{ name }}");
    const second = await request.get("/view/cache");
    assert.strictEqual(second.text, "v3:cache-test");

    await app.stop();
  });
});
