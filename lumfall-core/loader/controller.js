const path = require("path");
const glob = require("glob");
const { camelCase } = require("./utils");

/**
 * controller loader
 * @param {object} app Koa instance
 *
 * load all controllers,use `app.controllers.${dir}.${file}}` to access
 *
 * eg: app/controller
 *       |
 *       |-- custom-module
 *              |
 *              |-- custom-controller.js
 *
 *  => app.controllers.customModule.customController
 */
module.exports = (app) => {
  app.controllers = {};

  const lumfallDir = path.resolve(__dirname, "..", "..");
  const lumfallControllerDir = path.join(lumfallDir, "app", "controller");
  const businessControllerDir = path.join(app.businessPath, "controller");

  loadControllers(lumfallControllerDir);
  if (path.resolve(lumfallControllerDir) !== path.resolve(businessControllerDir)) {
    loadControllers(businessControllerDir);
  }

  function loadControllers(controllerDir) {
    const files = glob.sync("**/*.js", { cwd: controllerDir });

    files.forEach((file) => {
      // glob v7 always returns `/`-separated results regardless of platform,
      // normalize to path.sep before splitting
      const normalizedFile = file.split("/").join(path.sep);
      const parts = normalizedFile.split(path.sep);
      const fileName = parts.pop();
      const moduleName = camelCase(fileName.replace(/\.js$/, ""));

      // build nested dir object, eg: custom-module => app.controllers.customModule
      const target = parts.reduce(
        (obj, dirName) =>
          (obj[camelCase(dirName)] = obj[camelCase(dirName)] || {}),
        app.controllers,
      );

      const controllerPath = path.join(controllerDir, normalizedFile);
      const controllerFactory = require(controllerPath);
      if (typeof controllerFactory !== "function") {
        throw new Error(
          `[controller] ${controllerPath} must export a factory function`,
        );
      }

      const controller = controllerFactory(app);
      if (typeof controller !== "function" || !controller.prototype) {
        throw new Error(
          `[controller] ${controllerPath} factory must return a class or constructor`,
        );
      }
      target[moduleName] = new controller(app);
    });
  }
};
