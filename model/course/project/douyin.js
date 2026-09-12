module.exports = {
  name: "抖音课堂",
  desc: "课程系统 ",
  homePage: "/todo?projectKey=douyin&key=video",
  menu: [
    {
      key: "traffic",
      name: "流量管理",
      menuType: "module",
      moduleType: "sider",
      siderConfig: {
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
