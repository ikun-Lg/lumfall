const path = require("path");
const fs = require("fs");
const glob = require("glob");
const KoaRouter = require("koa-router");

/**
 * router loader
 * @param {object} app koa instance
 *
 * resolve all js files under app/router/, register them on a KoaRouter instance
 *
 * each file exports a map of api path -> route config, or a factory `(app) => map`:
 *   module.exports = (app) => ({
 *     '/api/hello': { method: 'GET', controller: 'customModule.customController', action: 'index' },
 *   })
 *
 * controller is resolved from app.controllers by its dotted path;
 * action must be a method on the resolved controller instance
 *
 * output:
 *   app.router = KoaRouter instance, routes registered via app.use
 */
module.exports = (app) => {
  const routerDir = path.join(app.businessPath, "router");

  const router = new KoaRouter();

  // resolve controller instance from dotted path, or use the reference directly
  const resolveController = (name) => {
    if (typeof name !== "string") {
      return name;
    }
    const instance = name
      .split(".")
      .reduce((obj, key) => obj && obj[key], app.controllers);
    if (!instance) {
      throw new Error(`[router] controller not found: ${name}`);
    }
    return instance;
  };

  if (fs.existsSync(routerDir)) {
    const files = glob.sync("**/*.js", { cwd: routerDir });

    files.forEach((file) => {
      // glob v7 always returns `/`-separated results regardless of platform,
      // normalize to path.sep before joining
      const normalizedFile = file.split("/").join(path.sep);
      const mod = require(path.join(routerDir, normalizedFile));
      const routeMap = typeof mod === "function" ? mod(app) : mod;

      if (!routeMap || typeof routeMap !== "object") {
        throw new Error(`[router] ${file} must export an object`);
      }

      Object.entries(routeMap).forEach(
        ([apiPath, { method, controller, action }]) => {
          const instance = resolveController(controller);

          if (typeof instance[action] !== "function") {
            throw new Error(
              `[router] action not found: ${controller}.${action} for ${apiPath}`,
            );
          }

          // wrap to keep `this` bound to the controller instance
          const handler = (ctx, next) => instance[action](ctx, next);
          router[method.toLowerCase()](apiPath, handler);
        },
      );
    });
  }

  router.get("*", async (ctx, next) => {
    ctx.status = 302; // redirect to 302
    ctx.redirect(app?.options?.homePath || "/");
  });

  app.use(router.routes());
  app.use(router.allowedMethods());
};
