const Koa = require("koa");
const path = require("path");
const fs = require("fs");

const env = require("./env");
const middlewareLoader = require("./loader/middleware");
const routerSchemaLoader = require("./loader/router-schema");
const routerLoader = require("./loader/router");
const controllerLoader = require("./loader/controller");
const serviceLoader = require("./loader/service");
const configLoader = require("./loader/config");
const extendLoader = require("./loader/extend");

const { sep } = path;

module.exports = {
  /**
   * Start the project
   * @param {Object} options Startup parameters
   * options ={
   * name:"Project name",
   * homePath:"Project homepage"
   * }
   */
  start(options = {}) {
    const app = new Koa();

    app.options = options;

    app.baseDir = process.cwd();

    app.businessPath = path.resolve(app.baseDir, `.${sep}app`);

    app.env = env();
    console.log(`[start] env: ${app.env.get()}`);

    middlewareLoader(app);
    console.log(`[start] load middleware done`);
    console.log(app.middlewares);

    routerSchemaLoader(app);
    console.log(`[start] load router schema done`);
    console.log(app.routerSchema);

    controllerLoader(app);
    console.log(`[start] load controller done`);
    console.log(app.controllers);

    serviceLoader(app);
    console.log(`[start] load service done`);
    console.log(app.services);

    configLoader(app);
    console.log(`[start] load config done`);
    console.log(app.config);

    extendLoader(app);
    console.log(`[start] load extend done`);
    console.log(app.customExtend);

    // global middleware: skip business one when identical to sunset's, else app.use registers twice
    const sunsetMiddlewarePath = path.resolve(
      __dirname,
      `..${sep}app${sep}middleware.js`,
    );
    const businessMiddlewarePath = `${app.businessPath}${sep}middleware.js`;

    try {
      if (fs.existsSync(sunsetMiddlewarePath)) {
        require(sunsetMiddlewarePath)(app);
        console.log(`[start] load sunset global middleware done`);
      } else {
        console.warn(`[start] no sunset global middleware.js, skip`);
      }
    } catch (error) {
      console.error("Failed to load sunset global middleware:", error);
    }

    try {
      if (!fs.existsSync(businessMiddlewarePath)) {
        console.warn(`[start] no global middleware.js, skip`);
      } else if (businessMiddlewarePath === sunsetMiddlewarePath) {
        console.log(
          `[start] global middleware.js is sunset built-in, skip duplicate`,
        );
      } else {
        require(businessMiddlewarePath)(app);
        console.log(`[start] load global middleware done`);
      }
    } catch (error) {
      console.error("Failed to load global middleware:", error);
    }

    routerLoader(app);
    console.log(`[start] load router done`);

    try {
      const port = process.env.PORT || 3000;
      const host = process.env.IP || "0.0.0.0";
      app.server = app.listen(port, host);
      console.log("Server running on http://" + host + ":" + port);
    } catch (error) {
      console.error("Failed to start server:", error);
    }

    return app;
  },
};
