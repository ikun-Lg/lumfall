/**
 * demo middleware: record request duration and log it
 * access via app.middleware.customModule.customMiddleware
 */
module.exports = (app) => {
  const logger = (ctx) => console.log(`[customMiddleware] ${ctx.method} ${ctx.url}`);

  return async (ctx, next) => {
    const start = Date.now();
    logger(ctx);
    await next();
    const cost = Date.now() - start;
    console.log(`[customMiddleware] ${ctx.method} ${ctx.url} cost ${cost}ms`);
  };
};
