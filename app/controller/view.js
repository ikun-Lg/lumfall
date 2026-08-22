const { sep } = require("path");

module.exports = (app) => {
  const BaseController = require("./base")(app);
  return class ViewController {
    /**
     * render page
     * @param {object} ctx context
     */
    async renderPage(ctx) {
      await ctx.render(`dist${sep}entry.${ctx.params.page}`, {
        name: app?.options?.name,
        env: app?.env?.get(),
      });
    }
  };
};
