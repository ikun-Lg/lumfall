const { sep } = require("path");

module.exports = (app) => {
  const BaseController = require("./base")(app);
  return class ViewController {
    /**
     * render page
     * @param {object} ctx context
     */
    async renderPage(ctx) {
      app.logger.info(`[ViewController] query: ${JSON.stringify(ctx.request.query)}`);
      app.logger.info(`[ViewController] params: ${JSON.stringify(ctx.params)}`);
      await ctx.render(`dist${sep}entry.${ctx.params.page}`, {
        name: app?.options?.name,
        env: app?.env?.get(),
        options: JSON.stringify(app?.options),
        projectKey: ctx.request.query.projectKey
      });
    }
  };
};
