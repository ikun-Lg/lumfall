module.exports = {
  name: "拼多多",
  desc: "拼多多是中国最大的电商平台之一，提供商品买卖、物流配送等服务。",
  homePage: "",
  menu: [
    {
      key: "product",
      name: "商品管理(pdd)",
    },
    {
      key: "client",
      name: "客户管理(pdd)",
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
              path: "",
            },
          },
          {
            key: "sider-search",
            name: "搜索",
            moduleType: "iframe",
            iframeConfig: {
              path: "",
            },
          },
        ],
      },
    },
    {
      key: "sider-search",
      name: "搜索",
      moduleType: "iframe",
      iframeConfig: {
        path: "",
      },
    },
  ],
};
