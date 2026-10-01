module.exports = (app, router) => {
  const { health: healthController } = app.controllers;

  router.get("/health/live", healthController.live.bind(healthController));
  router.get("/health/ready", healthController.ready.bind(healthController));
};