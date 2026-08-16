const path = require("path");

module.exports = (app) => {
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
