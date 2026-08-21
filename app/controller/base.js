module.exports = (app) => {
  /**
   * controller base class
   */
  return class BaseController {
    constructor() {
      this.app = app;
    }

    // service & config loaders run after controller loader, so resolve
    // lazily at request time instead of in the constructor
    get services() {
      return this.app.services;
    }
    get config() {
      return this.app.config;
    }

    /**
     * API resolve success union res struct
     * @param {object} ctx context
     * @param {object} data API response
     * @param {object} metadata
     */
    async success(ctx, data, metadata = {}) {
      ctx.status = 200;
      ctx.body = {
        success: true,
        data,
        metadata,
      };
    }

    /**
     *
     * API resolve fail union res struct
     * @param {object} ctx context
     * @param {object} data API response
     * @param {object} metadata
     */
    async fail(ctx, message, code) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        message,
        code,
      };
    }
  };
};
