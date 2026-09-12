module.exports = {
  "/api/project/product/list": {
    get: {
      query: {
        type: "object",
        properties: {
          page: {
            type: "string",
          },
          pageSize: {
            type: "string",
          },
        },
      },
    },
  },
  "/api/project/productEnum/list": {
    get: {},
  },
  "/api/project/product": {
    delete: {
      body: {
        type: "object",
        properties: {
          productId: {
            type: "string",
          },
        },
        required: ["productId"],
      },
    },
  },
};
