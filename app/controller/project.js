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

    getProjectList(ctx) {
      const { projectKey } = ctx.request.query;
      const { project: projectService } = app.services;
      const projectList = projectService.getProjectList({ projectKey });

      const dtoProjectList = projectList.map(
        ({ key, name, desc, homePage, modelKey }) => ({
          key,
          name,
          desc,
          homePage,
          modelKey,
        }),
      );

      this.success(ctx, dtoProjectList);
    }

    getProject(ctx) {
      const { projectKey } = ctx.request.query;
      const { project: projectService } = app.services;
      const project = projectService.getProject({ projectKey });

      if (!project) {
        this.fail(ctx, "获取项目异常", 50000);
        return;
      }

      this.success(ctx, project);
    }
  };
};