const fs = require("fs");
const path = require("path");
const discoverPageManifest = require("../../lumfall-core/page-manifest");

module.exports = (app) => {
  const frameworkPagesDir = path.resolve(__dirname, "..", "pages");
  const businessPagesDir = path.join(app.businessPath, "pages");
  const pages = new Set(
    discoverPageManifest(frameworkPagesDir, businessPagesDir).map(
      ({ name }) => name,
    ),
  );

  return class ViewController {
    /**
     * render page
     * @param {object} ctx context
     */
    async renderPage(ctx) {
      const pageName = ctx.params.page;
      if (!pages.has(pageName)) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          code: 4041,
          message: `Page "${pageName}" was not found`,
        };
        return;
      }

      const templatePath = path.join(
        app.businessPath,
        "public",
        "dist",
        `entry.${pageName}.tpl`,
      );
      if (!fs.existsSync(templatePath)) {
        ctx.status = 503;
        ctx.body = {
          success: false,
          code: 5031,
          message: `Page "${pageName}" is not built`,
        };
        return;
      }

      app.logger.info(`[ViewController] query: ${JSON.stringify(ctx.request.query)}`);
      app.logger.info(`[ViewController] params: ${JSON.stringify(ctx.params)}`);
      await ctx.render(path.join("dist", `entry.${pageName}`), {
        name: app?.options?.name,
        env: app?.env?.get(),
        options: JSON.stringify(app?.options),
        projectKey: ctx.request.query.projectKey
      });
    }
  };
};
