module.exports = (app) => {
  return class ProjectController {
    async getList(ctx) {
      const { project: projectService } = app.services;
      const res = await projectService.getList();
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: res,
        metadata: {},
      };
    }
  };
};
