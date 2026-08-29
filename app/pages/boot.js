import { createApp } from "vue";
import ArcoVue from "@arco-design/web-vue";
import "@arco-design/web-vue/dist/arco.css";
import ArcoVueIcon from "@arco-design/web-vue/es/icon";
import pinia from "$store";
import { createRouter, createWebHashHistory } from "vue-router";

import "$assert/custom.css";

export default (pageComponent, { routes = [], libs = [] } = {}) => {
  const app = createApp(pageComponent);
  app.use(ArcoVue);
  app.use(pinia);
  app.use(ArcoVueIcon);

  if (libs && libs.length) {
    for (let i = 0; i < libs.length; i++) {
      app.use(libs[i]);
    }
  }

  if (routes && routes.length) {
    const router = createRouter({
      history: createWebHashHistory(),
      routes,
    });
    app.use(router);
    router.isReady().then(() => {
      app.mount("#root");
    });
  } else {
    app.mount("#root");
  }
};
