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
  const controllerDir = path.join(app.businessPath, "controller");

  app.controllers = {};

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

    const controller = require(path.join(controllerDir, normalizedFile))(app);
    // support factory pattern: module.exports = (app) => ({...})
    if (typeof controller !== "function") {
      throw new Error(`Controller ${moduleName} is not a class`);
    }
    target[moduleName] = new controller(app);
  });
};
