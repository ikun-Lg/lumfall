const path = require("path");
const glob = require("glob");
const { camelCase } = require("./utils");

/**
 * middleware loader
 * @param {object} app Koa instance
 *
 * load all middleware,use `app.middleware.${dir}.${file}}` to access
 *
 * eg: app/middleware
 *       |
 *       |-- custom-module
 *              |
 *              |-- custom-middleware.js
 *
 *  => app.middleware.customModule.customMiddleware
 */
module.exports = (app) => {
  app.middlewares = {};

  const sunsetMiddlewareDir = path.join(
    __dirname,
    `..${path.sep}..${path.sep}app${path.sep}middleware`,
  );
  const sunsetFiles = glob.sync("**/*.js", { cwd: sunsetMiddlewareDir });
  sunsetFiles.forEach((file) => handleFile(file, sunsetMiddlewareDir));

  const businessMiddlewareDir = path.join(app.businessPath, "middleware");
  if (path.resolve(sunsetMiddlewareDir) !== path.resolve(businessMiddlewareDir)) {
    const businessFiles = glob.sync("**/*.js", { cwd: businessMiddlewareDir });
    businessFiles.forEach((file) => handleFile(file, businessMiddlewareDir));
  }

  function handleFile(file, middlewareDir) {
    // glob v7 always returns `/`-separated results regardless of platform,
    // normalize to path.sep before splitting
    const normalizedFile = file.split("/").join(path.sep);
    const parts = normalizedFile.split(path.sep);
    const fileName = parts.pop();
    const moduleName = camelCase(fileName.replace(/\.js$/, ""));

    // build nested dir object, eg: custom-module => app.middleware.customModule
    const target = parts.reduce(
      (obj, dirName) =>
        (obj[camelCase(dirName)] = obj[camelCase(dirName)] || {}),
      app.middlewares,
    );

    const middleware = require(path.join(middlewareDir, normalizedFile));
    // support factory pattern: module.exports = (app) => (ctx, next) => {}
    target[moduleName] =
      typeof middleware === "function" ? middleware(app) : middleware;
  }
};
