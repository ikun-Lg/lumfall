const fs = require("fs");
const path = require("path");
const glob = require("glob");

module.exports = (frameworkPagesDir, businessPagesDir) => {
  const pages = new Map();
  const sources = [{ directory: frameworkPagesDir, source: "framework" }];

  if (path.resolve(frameworkPagesDir) !== path.resolve(businessPagesDir)) {
    sources.push({ directory: businessPagesDir, source: "business" });
  }

  sources.forEach(({ directory, source }) => {
    if (!fs.existsSync(directory)) {
      return;
    }

    glob.sync("**/entry.*.js", { cwd: directory }).sort().forEach((relativeEntry) => {
      const filename = path.basename(relativeEntry, ".js");
      const name = filename.slice("entry.".length);
      const existing = pages.get(name);

      if (existing && existing.source === source) {
        throw new Error(
          `[pages] duplicate ${source} page entry "${name}": ${existing.relativeEntry} and ${relativeEntry}`,
        );
      }

      pages.set(name, { name, relativeEntry, source });
    });
  });

  return Array.from(pages.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
};