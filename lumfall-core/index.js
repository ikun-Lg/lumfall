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
const createDiagnostics = require("./diagnostics");
const registerPlugins = require("./plugins");

const { sep } = path;
const lifecycleHookNames = new Set([
  "beforeStart",
  "beforeRouteLoad",
  "afterRouteLoad",
  "afterStart",
  "onError",
  "beforeStop",
  "afterStop",
]);

// 挂载点叶子条目计数（目录命名空间递归、函数/实例/原始值记 1），仅用于启动摘要日志。
// 配置可能含密钥与连接串，任何 loader 的日志都不打印内容本身（issue #43）
const isPlainMountObject = (value) =>
  Boolean(value) &&
  typeof value === 'object' &&
  Object.getPrototypeOf(value) === Object.prototype;

const countLoaded = (value) =>
  isPlainMountObject(value)
    ? Object.values(value).reduce((sum, item) => sum + countLoaded(item), 0)
    : 1;

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
    const lifecycle = options.lifecycle || {};

    const callStartupHook = (name, ...args) => {
      const hook = lifecycle[name];
      if (hook === undefined) {
        return;
      }
      if (typeof hook !== "function") {
        throw new TypeError(`[lifecycle] hook "${name}" must be a function`);
      }

      const result = hook(...args);
      if (result && typeof result.then === "function") {
        result.catch(() => {});
        throw new Error(
          `[lifecycle] hook "${name}" must be synchronous; use beforeStop/afterStop for async teardown`,
        );
      }
    };

    try {
      if (!isPlainObject(lifecycle)) {
        throw new TypeError("[lifecycle] options.lifecycle must be a plain object");
      }
      Object.entries(lifecycle).forEach(([name, hook]) => {
        if (!lifecycleHookNames.has(name)) {
          throw new Error(`[lifecycle] unknown hook "${name}"`);
        }
        if (typeof hook !== "function") {
          throw new TypeError(`[lifecycle] hook "${name}" must be a function`);
        }
      });

      console.log(`[start] env: ${app.env.get()}`);
      callStartupHook("beforeStart", app);

      middlewareLoader(app);
      console.log(`[start] load middleware done (${countLoaded(app.middlewares)})`);

      routerSchemaLoader(app);
      console.log(`[start] load router schema done (${countLoaded(app.routerSchema)})`);

      controllerLoader(app);
      console.log(`[start] load controller done (${countLoaded(app.controllers)})`);

      serviceLoader(app);
      console.log(`[start] load service done (${countLoaded(app.services)})`);

      configLoader(app);
      // 配置可能含密钥/连接串，不打印内容，仅输出键数量（issue #43）
      console.log(`[start] load config done (${Object.keys(app.config).length} keys)`);

      extendLoader(app);
      console.log(`[start] load extend done`);

      registerPlugins(app, options.plugins);

      const lumfallMiddlewarePath = path.resolve(
        __dirname,
        `..${sep}app${sep}middleware.js`,
      );
      const businessMiddlewarePath = `${app.businessPath}${sep}middleware.js`;

      if (fs.existsSync(lumfallMiddlewarePath)) {
        require(lumfallMiddlewarePath)(app);
        console.log(`[start] load lumfall global middleware done`);
      } else {
        console.warn(`[start] no lumfall global middleware.js, skip`);
      }

      if (!fs.existsSync(businessMiddlewarePath)) {
        console.warn(`[start] no global middleware.js, skip`);
      } else if (businessMiddlewarePath === lumfallMiddlewarePath) {
        console.log(
          `[start] global middleware.js is lumfall built-in, skip duplicate`,
        );
      } else {
        require(businessMiddlewarePath)(app);
        console.log(`[start] load global middleware done`);
      }

      callStartupHook("beforeRouteLoad", app);
      routerLoader(app);
      console.log(`[start] load router done`);
      callStartupHook("afterRouteLoad", app);
      app.diagnostics = createDiagnostics(app);

      const port = process.env.PORT || 3000;
      const host = process.env.IP || "0.0.0.0";
      app.server = app.listen(port, host);
      console.log("Server running on http://" + host + ":" + port);
      callStartupHook("afterStart", app);

      let stopPromise;
      app.stop = () => {
        if (!stopPromise) {
          stopPromise = (async () => {
            await lifecycle.beforeStop?.(app);
            if (app.server) {
              await closeServer(app.server);
            }
            await lifecycle.afterStop?.(app);
          })();
        }
        return stopPromise;
      };

      return app;
    } catch (error) {
      try {
        lifecycle.onError?.(error, app);
      } catch (hookError) {
        hookError.cause = error;
        throw hookError;
      }
      throw error;
    }
  },
};

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    const close = () => {
      server.close((error) => (error ? reject(error) : resolve()));
    };

    if (server.listening) {
      close();
      return;
    }

    const onError = (error) => {
      server.removeListener("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      close();
    };

    server.once("error", onError);
    server.once("listening", onListening);
  });
}
