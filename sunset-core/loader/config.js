const path = require("path");
const fs = require("fs");

/**
 * config loader
 * @param {object} app koa instance
 *
 * config local/beta/prod, read different config env.config
 * env.config -> default.config -> app.config
 *
 * default config: config/config.default.js
 * local config: config/config.local.js
 * beta config: config/config.beta.js
 * prod config: config/config.prod.js
 */
module.exports = (app) => {
  const configDir = path.join(app.baseDir, "config");

  app.config = {};

  if (!fs.existsSync(configDir)) {
    return;
  }

  // load a config file, support factory pattern: module.exports = (app) => ({...})
  const load = (name) => {
    const file = path.join(configDir, `config.${name}.js`);
    if (!fs.existsSync(file)) {
      return {};
    }
    const mod = require(file);
    const config = typeof mod === "function" ? mod(app) : mod;
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      throw new Error(
        `[config] config.${name}.js must export a plain object, got ${
          Array.isArray(config) ? "array" : typeof config
        }`,
      );
    }
    return config;
  };

  // env-specific config overrides default config
  const env = typeof app.env?.get === "function" ? app.env.get() : "local";
  app.config = { ...load("default"), ...load(env) };
};
