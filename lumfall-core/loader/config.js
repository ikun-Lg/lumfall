const path = require("path");
const fs = require("fs");
const Ajv = require("ajv");

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
    if (!isPlainObject(config)) {
      throw new Error(
        `[config] ${filePath} must export a plain object`,
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

  const configSchema = app.options?.configSchema;
  if (configSchema !== undefined) {
    if (!isPlainObject(configSchema)) {
      throw new Error("[config] options.configSchema must be a plain object");
    }

    let validate;
    try {
      validate = new Ajv({ allErrors: true }).compile(configSchema);
    } catch (error) {
      throw new Error(`[config] options.configSchema is invalid: ${error.message}`);
    }

    if (!validate(app.config)) {
      const errors = validate.errors
        .map(({ dataPath, message }) => `${dataPath || "/"} ${message}`)
        .join("; ");
      throw new Error(
        `[config] merged configuration for "${env}" is invalid: ${errors}`,
      );
    }
  }
};

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
