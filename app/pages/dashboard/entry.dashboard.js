import boot from "$page/boot.js";
import Dashboard from "./dashboard.vue";

const routes = [];

routes.push({
  path: "/view/dashboard/iframe",
  component: () => import("./complex-view/iframe-view/iframe-view.vue"),
});

routes.push({
  path: "/view/dashboard/schema",
  component: () => import("./complex-view/schema-view/schema-view.vue"),
});

routes.push({
  path: "/view/dashboard/todo",
  component: () => import("./todo/todo.vue"),
});

routes.push({
  path: "/view/dashboard/sider",
  component: () => import("./complex-view/sider-view/sider-view.vue"),
  children: [
    {
      path: "iframe",
      component: () => import("./complex-view/iframe-view/iframe-view.vue"),
    },
    {
      path: "schema",
      component: () => import("./complex-view/schema-view/schema-view.vue"),
    },
    {
      path: "todo",
      component: () => import("./todo/todo.vue"),
    },
  ],
});

routes.push({
  path: "/view/dashboard/sider/:chapters+",
  component: () => import("./complex-view/sider-view/sider-view.vue"),
});

boot(Dashboard, { routes });
