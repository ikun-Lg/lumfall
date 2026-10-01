module.exports = (app) => {
  return async (ctx, next) => {
    const security = app.config?.security || {};
    const projectKeyPolicy = security.projectKey || {};
    const continueRequest = () => {
      if (projectKeyPolicy.enabled === false) {
        return next();
      }
      return app.middlewares.projectHandler(ctx, next);
    };

    if (security.apiSignature?.enabled === true) {
      return app.middlewares.apiSignVerify(ctx, continueRequest);
    }

    return continueRequest();
  };
};