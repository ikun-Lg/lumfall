module.exports = {
  "/api/project/model_list": {
    get: {},
  },
  "/api/project/list": {
    get: {
      query: {
        type: "object",
        properties: {
          projectKey: {
            type: "string",
          },
        },
      },
    },
  },
  "/api/project": {
    get: {
      query: {
        type: "object",
        properties: {
          projectKey: {
            type: "string",
          },
        },
        required: ["projectKey"],
      },
    },
  },
};
