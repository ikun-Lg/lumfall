module.exports = {
  name: "B站课堂",
  desc: "B站课堂 ",
  homePage:"/todo?projectKey=bilibili&key=video",
  menu: [
    {
      key: "video",
      name: "视频管理(b站)",
    },
    {
      key: "client",
      name: "用户管理(b站)",
    },
    {
      key: "course",
      name: "课程资料",
      menuType: "module",
      moduleType: "sider",
      siderConfig: {
        path: "/todo",
        menu: [
          {
            key: "pdf",
            name: "PDF",
            menuType: "module",
            moduleType: "custom",
            customConfig: {
              path: "/todo",
            },
          },
          {
            key: "excel",
            name: "Excel",
            menuType: "module",
            moduleType: "custom",
            customConfig: {
              path: "/todo",
            },
          },
          {
            key: "ppt",
            name: "PPT",
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
