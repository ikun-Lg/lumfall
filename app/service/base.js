module.exports = (app) => {
  /**
   * service base class
   */
  return class BaseService {
    constructor() {
      this.app = app;
    }

    get config() {
      return this.app.config;
    }
  };
};
