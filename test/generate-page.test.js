const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { generatePage, main } = require("../scripts/generate-page");

describe("page scaffolding CLI", () => {
  let rootDir;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-page-cli-"));
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it("generates a page entry and Vue component under the current project", () => {
    const result = generatePage({ rootDir, name: "order-detail" });

    assert.strictEqual(
      fs.readFileSync(result.entryPath, "utf8"),
      'import boot from "$lumfallBoot";\nimport Page from "./order-detail.vue";\n\nboot(Page);\n',
    );
    assert.match(
      fs.readFileSync(result.componentPath, "utf8"),
      /<h1>Order Detail<\/h1>/,
    );
  });

  it("uses the framework header alias when requested", () => {
    const result = generatePage({ rootDir, name: "orders", withHeader: true });
    const component = fs.readFileSync(result.componentPath, "utf8");

    assert.match(component, /\$lumfallHeaderContainer/);
    assert.match(component, /<template #main-content>/);
  });

  it("rejects traversal, invalid names, and existing pages", () => {
    assert.throws(
      () => generatePage({ rootDir, name: "../outside" }),
      /lowercase kebab-case/,
    );
    assert.throws(
      () => generatePage({ rootDir, name: "Bad_Name" }),
      /lowercase kebab-case/,
    );

    generatePage({ rootDir, name: "existing" });
    assert.throws(
      () => generatePage({ rootDir, name: "existing" }),
      /page directory already exists/,
    );
  });

  it("rejects missing page names and unknown CLI options", () => {
    assert.throws(() => main([]), /Usage: pnpm new-page/);
    assert.throws(() => main(["reports", "--unknown"]), /Usage: pnpm new-page/);
  });
});