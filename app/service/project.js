module.exports = (app) => {
  const BaseService = require("./base")(app);
  return class ProjectService extends BaseService {
    async getList() {
      return [
        {
          id: 1,
          name: "Project 1",
        },
        {
          id: 2,
          name: "Project 2",
        },
      ];
    }
  };
};
