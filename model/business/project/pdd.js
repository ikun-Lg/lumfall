module.exports = {
  name: "拼多多",
  desc: "拼多多是中国最大的电商平台之一，提供商品买卖、物流配送等服务。",
  homePage: "/schema?projectKey=pdd&key=product",
  menu: [
    {
      key: "product",
      name: "商品管理(pdd)",
    },
    {
      key: "client",
      name: "客户管理(pdd)",
      moduleType: "schema",
      schemaConfig: {
        api: "/api/client",
        schema: {},
      },
    },
    {
      key: "data",
      name: "数据管理(pdd)",
      menuType: "module",
      moduleType: "sider",
      siderConfig: {
        menu: [
          {
            key: "analysis",
            name: "数据分析(pdd)",
            menuType: "module",
            moduleType: "custom",
            customConfig: {
              path: "/todo",
            },
          },
          {
            key: "sider-search",
            name: "搜索",
            menuType: "module",
            moduleType: "iframe",
            iframeConfig: {
              path: "https://example.com",
            },
          },
          {
            key: "categories",
            name: "分类数据",
            menuType: "group",
            subMenu: [
              {
                key: "categoty-1",
                name: "一级分类",
                menuType: "module",
                moduleType: "custom",
                customConfig: {
                  path: "/todo",
                },
              },
              {
                key: "categoty-2",
                name: "二级分类",
                menuType: "module",
                moduleType: "iframe",
                iframeConfig: {
                  path: "https://example.com",
                },
              },
              {
                key: "categoty-3",
                name: "三级分类",
                menuType: "module",
                moduleType: "schema",
                schemaConfig: {
                  api: "/api/client",
                  schema: {},
                },
              },
            ],
          },
        ],
      },
    },
    {
      key: "search",
      name: "搜索",
      menuType: "module",
      moduleType: "iframe",
      iframeConfig: {
        path: "https://example.com",
      },
    },
  ],
};
