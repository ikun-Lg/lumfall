const path = require("path");
const glob = require("glob");

const LOADER_NAMES = [
  "middleware",
  "router-schema",
  "controller",
  "service",
  "config",
  "extend",
  "router",
];

module.exports = (app) => ({
  getManifest() {
    const routes = (app.router?.stack || [])
      .map((route) => ({
        path: Array.isArray(route.path) ? route.path.slice().sort() : route.path,
        methods: route.methods.slice().sort(),
      }))
      .sort((left, right) => {
        const pathOrder = JSON.stringify(left.path).localeCompare(
          JSON.stringify(right.path),
        );
        return pathOrder || left.methods.join(",").localeCompare(right.methods.join(","));
      });

    const pages = collectPages(app);
    const healthChecks = app.health?.list?.() || [];

    return {
      version: require("../package.json").version,
      environment: app.env?.get?.() || "local",
      loaders: LOADER_NAMES.slice(),
      routes,
      pages,
      healthChecks,
    };
  },
});

function collectPages(app) {
  const frameworkPagesDir = path.resolve(__dirname, "..", "app", "pages");
  const businessPagesDir = path.join(app.businessPath, "pages");
  const pages = new Map();
  const directories = [{ directory: frameworkPagesDir, source: "framework" }];

  if (path.resolve(businessPagesDir) !== path.resolve(frameworkPagesDir)) {
    directories.push({ directory: businessPagesDir, source: "business" });
  }

  directories.forEach(({ directory, source }) => {
    glob.sync("**/entry.*.js", { cwd: directory }).forEach((file) => {
      const name = path.basename(file, ".js").replace(/^entry\./, "");
      pages.set(name, {
        name,
        entry: file.split(path.sep).join("/"),
        route: `/view/${name}`,
        source,
      });
    });
  });

  return Array.from(pages.values()).sort((left, right) => left.name.localeCompare(right.name));
}