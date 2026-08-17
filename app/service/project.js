module.exports = (app) => {
  return class ProjectService {
    constructor() {}
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
