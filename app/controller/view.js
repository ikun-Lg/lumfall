const { sep } = require("path");

module.exports = (app) => {
  return class ViewController {
    /**
     * render page
     * @param {object} ctx context
     */
    async renderPage(ctx) {
      await ctx.render(`output${sep}entry.${ctx.params.page}`, {
        name: app?.options?.name,
        env: app?.env?.get(),
      });
    }
  };
};
