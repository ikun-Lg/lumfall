/**
 * demo controller: hello world
 * access via app.controllers.customModule.customController
 */
module.exports = (app) =>
  class CustomController {
    /**
     * GET /api/hello?name=xxx
     * @param {object} ctx Koa context
     */
    async index(ctx) {
      const { name = "world" } = ctx.query;
      ctx.body = {
        code: 0,
        message: "ok",
        data: { hello: name },
      };
    }
  };
