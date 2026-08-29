module.exports = (app) => {
  const BaseService = require("./base")(app);
  const modelList = require("../../model/index")(app);
  return class ProjectService extends BaseService {
    async getModelList() {
      return modelList;
    }
  };
};
