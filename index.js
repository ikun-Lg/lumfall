const LumfallCore = require("./lumfall-core/index");

const FEBuildDev = require("./app/webpack/dev.js");
const FEBuildProd = require("./app/webpack/prod.js");

module.exports = {
  Controller: {
    Base: require("./app/controller/base.js"),
  },
  Service: {
    Base: require("./app/service/base.js"),
  },

  frontendBuild(env) {
    if (env === "local") {
      FEBuildDev();
    } else if (env === "prod") {
      FEBuildProd();
    }
  },

  serviceStart(options = {}) {
    // 默认值在内部合并：部分传参（如只传 name）时 homePath 仍套用默认值，
    // 不会退化成 "/"（issue #42）；显式传入的选项正常覆盖默认值
    const app = LumfallCore.start({
      homePath: "/view/health",
      name: "lumfall",
      ...options,
    });
    return app;
  },
};
