import boot from "$lumfallBoot";
import Dashboard from "./dashboard.vue";
import businessDashboardRouterConfig from "$businessDashboardRouterConfig";

const routes = [];

routes.push({
  path: "/view/dashboard/iframe",
  component: () => import("./complex-view/iframe-view/iframe-view.vue"),
});

routes.push({
  path: "/view/dashboard/schema",
  component: () => import("./complex-view/schema-view/schema-view.vue"),
});

const siderRoutes = [
  {
    path: "iframe",
    component: () => import("./complex-view/iframe-view/iframe-view.vue"),
  },
  {
    path: "schema",
    component: () => import("./complex-view/schema-view/schema-view.vue"),
  },
];

routes.push({
  path: "/view/dashboard/sider",
  component: () => import("./complex-view/sider-view/sider-view.vue"),
  children: siderRoutes,
});

// 业务拓展路由
if (typeof businessDashboardRouterConfig === "function") {
  businessDashboardRouterConfig({ routes, siderRoutes });
}

routes.push({
  path: "/view/dashboard/sider/:chapters+",
  component: () => import("./complex-view/sider-view/sider-view.vue"),
});

boot(Dashboard, { routes });
