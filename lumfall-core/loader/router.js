const path = require("path");
const fs = require("fs");
const glob = require("glob");
const KoaRouter = require("koa-router");

/**
 * router loader
 * @param {object} app koa instance
 *
 * resolve all js files under app/router/, each file registers routes directly:
 *   module.exports = (app, router) => {
 *     const { view: ViewController } = app.controllers;
 *     router.get("/view/:page", ViewController.renderPage.bind(ViewController));
 *   }
 *
 * output:
 *   app.router = KoaRouter instance, routes registered via app.use
 */
module.exports = (app) => {
  const router = new KoaRouter();
  const lumfallDir = path.resolve(__dirname, "..", "..");
  const lumfallRouterDir = path.join(lumfallDir, "app", "router");
  const businessRouterDir = path.join(app.businessPath, "router");

  loadRoutes(businessRouterDir);
  if (path.resolve(lumfallRouterDir) !== path.resolve(businessRouterDir)) {
    loadRoutes(lumfallRouterDir);
  }

  function loadRoutes(routerDir) {
    if (!fs.existsSync(routerDir)) {
      return;
    }

    const files = glob.sync("**/*.js", { cwd: routerDir });

    files.forEach((file) => {
      // glob v7 always returns `/`-separated results regardless of platform,
      // normalize to path.sep before joining
      const normalizedFile = file.split("/").join(path.sep);
      const mod = require(path.join(routerDir, normalizedFile));
      if (typeof mod !== "function") {
        throw new Error(`[router] ${file} must export a function`);
      }
      mod(app, router);
    });
  }

  router.get("*", async (ctx, next) => {
    ctx.status = 302; // redirect to 302
    ctx.redirect(app?.options?.homePath || "/");
  });

  app.router = router;
  app.use(router.routes());
  app.use(router.allowedMethods());
};
