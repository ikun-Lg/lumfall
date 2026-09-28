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
    get: {
      query: {
        type: "object",
        properties: {
          productId: {
            type: "string",
          },
        },
        required: ["productId"],
      },
    },
    post: {
      body: {
        type: "object",
        properties: {
          productName: {
            type: "string",
          },
          price: {
            type: "number",
          },
          inventory: {
            type: "number",
          },
        },
        required: ["productName"],
      },
    },
    put: {
      body: {
        type: "object",
        properties: {
          productId: {
            type: "string",
          },
          productName: {
            type: "string",
          },
          price: {
            type: "number",
          },
          inventory: {
            type: "number",
          },
        },
        required: ["productId"],
      },
    },
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
