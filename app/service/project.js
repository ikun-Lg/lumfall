module.exports = (app) => {
  const BaseService = require("./base")(app);
  const modelList = require("../../model/index")(app);
  return class ProjectService extends BaseService {
    async getModelList() {
      return modelList;
    }
    getProjectList({ projectKey }) {
      return modelList.reduce((preList, modelItem) => {
        const { project } = modelItem;

        if (projectKey && !project[projectKey]) {
          return preList;
        }

        for (const pKey in project) {
          preList.push(project[pKey]);
        }

        return preList;
      }, []);
    }
    getProject({ projectKey }) {
      let projectConfig;

      modelList.forEach((item) => {
        if (item.project[projectKey]) {
          projectConfig = item.project[projectKey];
        }
      });
      return projectConfig;
    }
  };
};
