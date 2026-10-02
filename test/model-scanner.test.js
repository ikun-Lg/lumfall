const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const modelScanner = require("../model/index");

describe("model scanner", function () {
  this.timeout(30000);

  describe("parseModelPath (path matching)", () => {
    it("parses project entries from windows-style backslash paths", () => {
      // 模拟 Windows 反斜杠路径经归一化后的结果
      const normalized = "C:/app/model/business/project/taobao.js";
      assert.deepStrictEqual(modelScanner.parseModelPath(normalized), {
        type: "project",
        modelKey: "business",
        projectKey: "taobao",
      });
    });

    it("parses model entries", () => {
      assert.deepStrictEqual(
        modelScanner.parseModelPath("/var/app/model/course/model.js"),
        { type: "model", modelKey: "course" },
      );
    });

    it("keeps keys undefined for paths outside the model layout", () => {
      assert.deepStrictEqual(modelScanner.parseModelPath("/x/other/a.js"), {
        type: "model",
        modelKey: undefined,
      });
    });
  });

  describe("scan (real filesystem via cwd)", function () {
    let fixtureDir;
    let previousCwd;

    before(() => {
      previousCwd = process.cwd();
      fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-model-scan-"));
      const modelDir = path.join(fixtureDir, "model", "business");
      fs.mkdirSync(path.join(modelDir, "project"), { recursive: true });
      // 目录名恰好含 index.js：旧规则（路径含 index.js 即跳过）会误伤，新规则保留
      const trickyDir = path.join(fixtureDir, "model", "index.js-notes");
      fs.mkdirSync(trickyDir, { recursive: true });
      fs.writeFileSync(
        path.join(modelDir, "model.js"),
        'module.exports = { model: "dashboard", name: "电商系统", menu: [] };\n',
      );
      fs.writeFileSync(
        path.join(modelDir, "project", "taobao.js"),
        'module.exports = { name: "淘宝", desc: "d", homePage: "/todo", menu: [] };\n',
      );
      // 扫描器自身的 index.js 必须跳过
      fs.writeFileSync(path.join(modelDir, "project", "index.js"), "module.exports = {};\n");
      fs.writeFileSync(
        path.join(trickyDir, "model.js"),
        'module.exports = { model: "dashboard", name: "笔记", menu: [] };\n',
      );
      process.chdir(fixtureDir);
    });

    after(() => {
      process.chdir(previousCwd);
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    });

    it("scans models and projects with auto-injected keys", () => {
      const modelList = modelScanner({});

      const business = modelList.find((item) => item.model?.key === "business");
      assert.strictEqual(business.model.name, "电商系统");
      assert.strictEqual(business.project.taobao.key, "taobao");
      assert.strictEqual(business.project.taobao.modelKey, "business");
    });

    it("keeps model files under directories containing index.js in the name", () => {
      const modelList = modelScanner({});
      const notes = modelList.find((item) => item.model?.key === "index.js-notes");

      assert.strictEqual(notes.model.name, "笔记");
    });

    it("skips the scanner's own index.js", () => {
      const modelList = modelScanner({});

      assert.strictEqual(modelList.length, 2);
    });
  });
});
