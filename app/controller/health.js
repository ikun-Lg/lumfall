module.exports = (app) =>
  class HealthController {
    live(ctx) {
      ctx.status = 200;
      ctx.set("Cache-Control", "no-store");
      ctx.body = { status: "ok" };
    }

    async ready(ctx) {
      const result = await app.health.readiness();
      ctx.status = result.status === "ok" ? 200 : 503;
      ctx.set("Cache-Control", "no-store");
      ctx.body = result;
    }
  };