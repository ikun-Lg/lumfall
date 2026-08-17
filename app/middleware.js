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
};
