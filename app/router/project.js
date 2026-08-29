module.exports = (app, router) => {
  const { project: projectController } = app.controllers;

  router.get(
    "/api/project/model_list",
    projectController.getModelList.bind(projectController),
  );
};
