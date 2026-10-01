<template>
  <a-config-provider :locale="zhCN">
    <HeaderView :projectName="projectName" @menu-select="handleMenuSelect">
      <template #main-content>
        <router-view></router-view>
      </template>
    </HeaderView>
  </a-config-provider>
</template>

<script setup>
import { onMounted, ref } from "vue";
import zhCN from "@arco-design/web-vue/es/locale/lang/zh-cn";
import HeaderView from "./complex-view/header-view/header-view.vue";
import $curl from "$sunsetCurl";
import { useMenuStore } from "$sunsetStore/menu.js";
import { useProjectStore } from "$sunsetStore/project.js";
import { dashboardPath } from "$sunsetPage/dashboard/route-path.js";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const menuStore = useMenuStore();
const projectStore = useProjectStore();

const projectName = ref("");

const handleMenuSelect = (menuItem) => {
  const { moduleType, key, customConfig } = menuItem;

  if (key === route.query.key) return;

  const pathMap = {
    sider: dashboardPath("/sider"),
    iframe: dashboardPath("/iframe"),
    schema: dashboardPath("/schema"),
    custom: dashboardPath(customConfig?.path),
  };

  router.push({
    path: pathMap[moduleType],
    query: {
      key,
      projectKey: route.query.projectKey,
    },
  });
};

async function getProjectList() {
  const res = await $curl({
    method: "get",
    url: "/api/project/list",
    query: {
      projectKey: route.query.projectKey,
    },
  });

  if (!res || !res.success || !res.data) {
    return;
  }

  projectStore.setProjectList(res.data);
}

async function getProjectConfig() {
  const res = await $curl({
    method: "get",
    url: "/api/project",
    query: {
      projectKey: route.query.projectKey,
    },
  });

  if (!res || !res.success || !res.data) {
    return;
  }

  const { name, menu } = res.data;
  projectName.value = name;

  menuStore.setMenuList(menu);
}

onMounted(() => {
  getProjectList();
  getProjectConfig();
});
</script>

<style lang="less">
* {
  box-sizing: border-box;
}

.arco-dropdown-open .arco-icon-down {
  transform: rotate(180deg);
}
</style>
