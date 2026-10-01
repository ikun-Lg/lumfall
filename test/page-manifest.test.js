/* eslint-disable vue/one-component-per-file */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const viewControllerFactory = require("../app/controller/view");
const discoverPageManifest = require("../lumfall-core/page-manifest");

describe("page manifest validation", () => {
  let root;
  let frameworkPagesDir;
  let businessPagesDir;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-pages-"));
    frameworkPagesDir = path.join(root, "framework-pages");
    businessPagesDir = path.join(root, "app", "pages");
    fs.mkdirSync(frameworkPagesDir, { recursive: true });
    fs.mkdirSync(businessPagesDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function writeEntry(directory, relativePath) {
    const entryPath = path.join(directory, relativePath);
    fs.mkdirSync(path.dirname(entryPath), { recursive: true });
    fs.writeFileSync(entryPath, "module.exports = () => {};\n");
    return entryPath;
  }

  it("reports duplicate entries within the same page source", () => {
    writeEntry(frameworkPagesDir, "health/entry.health.js");
    writeEntry(frameworkPagesDir, "legacy/entry.health.js");

    assert.throws(
      () => discoverPageManifest(frameworkPagesDir, businessPagesDir),
      /\[pages\] duplicate framework page entry "health"/,
    );
  });

  it("allows business pages to override framework pages by name", () => {
    writeEntry(frameworkPagesDir, "health/entry.health.js");
    writeEntry(businessPagesDir, "health/entry.health.js");

    const pages = discoverPageManifest(frameworkPagesDir, businessPagesDir);

    assert.deepStrictEqual(pages, [
      {
        name: "health",
        relativeEntry: "health/entry.health.js",
        source: "business",
      },
    ]);
  });

  it("returns a page-specific 404 for an unknown page", async () => {
    const app = {
      businessPath: path.join(root, "app"),
      logger: { info() {} },
    };
    const ViewController = viewControllerFactory(app);
    const context = { params: { page: "missing" }, request: { query: {} } };

    await new ViewController().renderPage(context);

    assert.strictEqual(context.status, 404);
    assert.strictEqual(context.body.code, 4041);
    assert.match(context.body.message, /missing/);
  });

  it("returns a clear 503 when a discovered page template is missing", async () => {
    const app = {
      businessPath: path.join(root, "app"),
      logger: { info() {} },
    };
    const ViewController = viewControllerFactory(app);
    const context = { params: { page: "health" }, request: { query: {} } };

    await new ViewController().renderPage(context);

    assert.strictEqual(context.status, 503);
    assert.strictEqual(context.body.code, 5031);
    assert.match(context.body.message, /health.*not built/);
  });

  it("renders a built page using the existing template name", async () => {
    const distDir = path.join(root, "app", "public", "dist");
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, "entry.health.tpl"), "");

    let renderedTemplate;
    const app = {
      businessPath: path.join(root, "app"),
      logger: { info() {} },
      options: { name: "test-app" },
      env: { get: () => "local" },
    };
    const ViewController = viewControllerFactory(app);
    const context = {
      params: { page: "health" },
      request: { query: {} },
      render: async (template) => {
        renderedTemplate = template;
      },
    };

    await new ViewController().renderPage(context);

    assert.strictEqual(renderedTemplate, path.join("dist", "entry.health"));
  });
});