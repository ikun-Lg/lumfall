module.exports = (app) => {
  return {
    isLocal() {
      return process.env._ENV === "local";
    },
    isBeta() {
      return process.env._ENV === "beta";
    },
    isProd() {
      return process.env._ENV === "prod";
    },
    get() {
      return process.env._ENV ?? "local";
    },
  };
};
