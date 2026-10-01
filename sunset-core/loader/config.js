const path = require("path");
const fs = require("fs");

/**
 * config loader
 * @param {object} app koa instance
 *
 * config local/beta/prod, read different config env config
 * env config -> default config -> app config
 *
 * default config: config/config.default.js
 * local config: config/config.local.js
 * beta config: config/config.beta.js
 * prod config: config/config.prod.js
 */
module.exports = (app) => {
  app.config = {};

  const frameworkConfigDir = path.resolve(__dirname, "..", "..", "config");
  const businessConfigDir = path.join(app.baseDir || process.cwd(), "config");

  const loadConfigFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const mod = require(filePath);
    const config = typeof mod === "function" ? mod(app) : mod;
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      throw new Error(
        `[config] ${path.basename(filePath)} must export a plain object, got ${
          Array.isArray(config) ? "array" : typeof config
        }`,
      );
    }

    return config;
  };

  const loadConfig = (name, configDir) => {
    const file = path.join(configDir, `config.${name}.js`);
    return loadConfigFile(file);
  };

  const frameworkDefaultConfig = loadConfig("default", frameworkConfigDir);
  const businessDefaultConfig = loadConfig("default", businessConfigDir);
  const env = typeof app.env?.get === "function" ? app.env.get() : "local";

  const frameworkEnvConfig = loadConfig(env, frameworkConfigDir);
  const businessEnvConfig = loadConfig(env, businessConfigDir);

  app.config = {
    ...frameworkDefaultConfig,
    ...businessDefaultConfig,
    ...frameworkEnvConfig,
    ...businessEnvConfig,
  };
};
