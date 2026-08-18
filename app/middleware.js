const path = require("path");

module.exports = (app) => {
  // static files
  const koaStatic = require("koa-static");
  app.use(koaStatic(path.join(app.businessPath, "public")));

  // template render engine
  const koaNunjucks = require("koa-nunjucks-2");
  app.use(
    koaNunjucks({
      ext: "tpl",
      path: path.join(app.businessPath, "public"),
      nunjucksConfig: {
        noCache: true,
        trimBlocks: true,
      },
    }),
  );

  const bodyParser = require("koa-bodyparser");
  app.use(
    bodyParser({
      formLimit: "1000mb",
      enableTypes: ["json", "form", "text"],
    }),
  );

  // API sign verification, runs before router, inside errorHandler's try/catch
  app.use(app.middlewares.apiSignVerify)

  app.use(app.middlewares.errorHandler)
};
