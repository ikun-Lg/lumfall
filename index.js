const SunsetCore = require("./sunset-core/index");

const FEBuildDev = require("./app/webpack/dev.js");
const FEBuildProd = require("./app/webpack/prod.js");

module.exports = {
  frontendBuild(env) {
    if (env === "local") {
      FEBuildDev();
    } else if (env === "prod") {
      FEBuildProd();
    }
  },

  serviceStart(options = { homePath: "/view/health", name: "sunset" }) {
    const app = SunsetCore.start(options);
    return app;
  },
};
