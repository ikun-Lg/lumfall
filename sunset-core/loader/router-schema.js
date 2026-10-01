const path = require("path");
const glob = require("glob");

/**
 * router-schema loader
 * @param {object} app Koa instance
 *
 * 'json-schema & ajv' are used to enforce API rules, working in conjunction with the api-params-verify middleware.
 *
 * app/router-schema/**.js
 *
 * Each file exports a map of API identifier -> JSON Schema, or a factory `(app) => map`:
 *   module.exports = {
 *     '/api/user/login': { type: 'object', properties: { username: { type: 'string' } } },
 *   }
 *   // or: module.exports = (app) => ({ '/api/user/login': {...} })
 *
 * output:
 *   app.routerSchema = { '${api}': jsonSchema, ... }
 */
module.exports = (app) => {
  app.routerSchema = {};

  const sunsetDir = path.resolve(__dirname, "..", "..");
  const sunsetSchemaDir = path.join(sunsetDir, "app", "router-schema");
  const sunsetFiles = glob.sync("**/*.js", { cwd: sunsetSchemaDir });
  sunsetFiles.forEach((file) => handleFile(file, sunsetSchemaDir));

  const businessSchemaDir = path.join(app.businessPath, "router-schema");
  if (path.resolve(sunsetSchemaDir) !== path.resolve(businessSchemaDir)) {
    const businessFiles = glob.sync("**/*.js", { cwd: businessSchemaDir });
    businessFiles.forEach((file) => handleFile(file, businessSchemaDir));
  }

  function handleFile(file, schemaDir) {
    // glob v7 always returns `/`-separated results regardless of platform,
    // normalize to path.sep before joining
    const normalizedFile = file.split("/").join(path.sep);
    const schemaModule = require(path.join(schemaDir, normalizedFile));
    const schemaMap =
      typeof schemaModule === "function" ? schemaModule(app) : schemaModule;

    if (!schemaMap || typeof schemaMap !== "object") {
      return;
    }

    Object.assign(app.routerSchema, schemaMap);
  }
};
