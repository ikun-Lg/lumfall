const path = require("path");
const glob = require("glob");
const { camelCase } = require("./utils");

/**
 * service loader
 * @param {object} app Koa instance
 *
 * load all services,use `app.services.${dir}.${file}}` to access
 *
 * eg: app/service
 *       |
 *       |-- custom-module
 *              |
 *              |-- custom-service.js
 *
 *  => app.services.customModule.customService
 */
module.exports = (app) => {
  app.services = {};

  const lumfallDir = path.resolve(__dirname, "..", "..");
  const lumfallServiceDir = path.join(lumfallDir, "app", "service");
  const businessServiceDir = path.join(app.businessPath, "service");

  loadServices(lumfallServiceDir);
  if (path.resolve(lumfallServiceDir) !== path.resolve(businessServiceDir)) {
    loadServices(businessServiceDir);
  }

  function loadServices(serviceDir) {
    const files = glob.sync("**/*.js", { cwd: serviceDir });

    files.forEach((file) => {
      // glob v7 always returns `/`-separated results regardless of platform,
      // normalize to path.sep before splitting
      const normalizedFile = file.split("/").join(path.sep);
      const parts = normalizedFile.split(path.sep);
      const fileName = parts.pop();
      const moduleName = camelCase(fileName.replace(/\.js$/, ""));

      // build nested dir object, eg: custom-module => app.services.customModule
      const target = parts.reduce(
        (obj, dirName) =>
          (obj[camelCase(dirName)] = obj[camelCase(dirName)] || {}),
        app.services,
      );

      const servicePath = path.join(serviceDir, normalizedFile);
      const serviceFactory = require(servicePath);
      if (typeof serviceFactory !== "function") {
        throw new Error(
          `[service] ${servicePath} must export a factory function`,
        );
      }

      const service = serviceFactory(app);
      if (typeof service !== "function" || !service.prototype) {
        throw new Error(
          `[service] ${servicePath} factory must return a class or constructor`,
        );
      }
      target[moduleName] = new service(app);
    });
  }
};
