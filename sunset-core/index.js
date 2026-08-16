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
   * 启动项目
   * @param {Object} options
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

    serviceLoader(app);
    console.log(`[start] load service done`);

    configLoader(app);
    console.log(`[start] load config done`);

    extendLoader(app);
    console.log(`[start] load extend done`);

    routerLoader(app);
    console.log(`[start] load router done`);

    try {
      const port = process.env.PORT || 3000;
      const host = process.env.IP || "0.0.0.0";
      app.listen(port, host);
      console.log("Server running on http://" + host + ":" + port);
    } catch (error) {
      console.error("Failed to start server:", error);
    }
  },
};
