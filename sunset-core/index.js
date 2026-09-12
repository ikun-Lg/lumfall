const Koa = require("koa");
const path = require("path");

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
  async start(options = {}) {
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

    // global middleware
    try {
      const middlewarePath = app.businessPath + `${sep}middleware.js`;
      const fs = require("fs");
      if (fs.existsSync(middlewarePath)) {
        require(middlewarePath)(app);
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
