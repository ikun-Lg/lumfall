module.exports = (app, router) => {
  const { project: projectController } = app.controllers;

  router.get(
    "/api/project/model_list",
    projectController.getModelList.bind(projectController),
  );

  router.get(
    "/api/project/list",
    projectController.getProjectList.bind(projectController),
  );

  router.get(
    "/api/project",
    projectController.getProject.bind(projectController),
  );
};
