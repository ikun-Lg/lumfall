const path = require("path");
const fs = require("fs");
const glob = require("glob");
const { camelCase } = require("./utils");

/**
 * extend loader
 * @param {object} app Koa instance
 *
 * load all extend files and attach to app directly, use `app.${file}` to access
 * skips (with a warning) when the name already exists on app,
 * so framework internals like `app.config` are never overwritten
 *
 * eg: app/extend
 *        |
 *        |-- custom-extend.js
 *
 *  => app.customExtend
 */
module.exports = (app) => {
  const lumfallDir = path.resolve(__dirname, "..", "..");
  const lumfallExtendDir = path.join(lumfallDir, "app", "extend");
  const businessExtendDir = path.join(app.businessPath, "extend");

  loadExtends(lumfallExtendDir);
  if (path.resolve(lumfallExtendDir) !== path.resolve(businessExtendDir)) {
    loadExtends(businessExtendDir);
  }

  function loadExtends(extendDir) {
    if (!fs.existsSync(extendDir)) {
      return;
    }

    const files = glob.sync("**/*.js", { cwd: extendDir });

    files.forEach((file) => {
      // glob v7 always returns `/`-separated results regardless of platform,
      // normalize to path.sep before splitting
      const normalizedFile = file.split("/").join(path.sep);
      const extendName = camelCase(path.basename(normalizedFile, ".js"));

      if (extendName in app) {
        console.warn(`[extend] skip ${extendName}: key already exists on app`);
        return;
      }

      const mod = require(path.join(extendDir, normalizedFile));
      // support factory pattern: module.exports = (app) => ({...})
      if (typeof mod !== "function") {
        console.warn(
          `[extend] skip ${extendName}: module.exports is not a function`,
        );
        return;
      }
      app[extendName] = mod(app);
    });
  }
};
