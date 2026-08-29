module.exports = {
  name: "抖音课堂",
  desc: "课程系统 ",
  menu: [
    {
      key: "traffic",
      name: "流量管理",
      menuType: "module",
      moduleType: "sider",
      siderConfig: {
        path: "/todo",
        menu: [
          {
            key: "user-traffic",
            name: "用户流量",
            menuType: "module",
            moduleType: "custom",
            customConfig: {
              path: "/todo",
            },
          },
        ],
      },
    },
  ],
};
