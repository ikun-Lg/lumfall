module.exports = (app) => {
  const BaseController = require("./base")(app);
  return class ProjectController extends BaseController {
    async getModelList(ctx) {
      const { project: projectService } = app.services;
      const modelList = await projectService.getModelList();

      const dtoModelList = modelList.reduce((preList, item) => {
        const { model, project } = item;

        const { key, name, desc } = model;
        const dtoModel = { key, name, desc };

        const dtoProject = {};
        for (const projectKey in project) {
          const { key, name, desc, homePage } = project[projectKey];
          dtoProject[projectKey] = { key, name, desc, homePage };
        }

        preList.push({
          model: dtoModel,
          project: dtoProject,
        });

        return preList;
      }, []);

      this.success(ctx, dtoModelList);
    }
  };
};
