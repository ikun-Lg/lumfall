<template>
  <SiderContainer>
    <template #menu-content>
      <a-menu
        :default-selected-keys="activeKeys"
        @menu-item-click="onMenuClick"
      >
        <template v-for="item in menuList">
          <SubMenu
            v-if="item.subMenu && item.subMenu.length > 0"
            :menu-item="item"
          ></SubMenu>
          <a-menu-item v-else :key="item.key">
            {{ item.name }}
          </a-menu-item>
        </template>
      </a-menu>
    </template>
    <template #main-content>
      <router-view></router-view>
    </template>
  </SiderContainer>
</template>

<script setup>
import SiderContainer from "$widgets/sider-container/sider-container.vue";
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMenuStore } from "$store/menu.js";
import { dashboardPath } from "$page/dashboard/route-path.js";
import SubMenu from "./complex-view/sub-menu/sub-menu.vue";

const router = useRouter();
const route = useRoute();
const menuStore = useMenuStore();

const activeKeys = ref([]);
const setActiveKey = () => {
  let siderMenuItem = menuStore.findMenuItem({
    key: "key",
    value: route.query.siderKey,
  });

  if (!siderMenuItem) {
    const headerMenuItem = menuStore.findMenuItem({
      key: "key",
      value: route.query.key,
    });
    if (
      headerMenuItem &&
      headerMenuItem.siderConfig &&
      headerMenuItem.siderConfig.menu
    ) {
      const siderMenuList = headerMenuItem.siderConfig.menu;
      siderMenuItem = menuStore.findFirstMenuItem(siderMenuList);
      if (siderMenuItem) {
        onMenuClick(siderMenuItem.key);
      }
    }
  }

  activeKeys.value = [siderMenuItem?.key];
};

const menuList = ref([]);
const setMenuList = () => {
  const menuItem = menuStore.findMenuItem({
    key: "key",
    value: route.query.key,
  });

  if (menuItem && menuItem.siderConfig && menuItem.siderConfig.menu) {
    menuList.value = menuItem.siderConfig.menu;
  }
};

const handleMenuClick = (menuKey) => {
  const menuItem = menuStore.findMenuItem({ key: "key", value: menuKey });

  const { moduleType, key, customConfig } = menuItem;

  if (key === route.query.siderKey) {
    return;
  }

  const pathMap = {
    iframe: "/iframe",
    schema: "/schema",
    custom: customConfig?.path,
  };

  router.push({
    path: dashboardPath(`/sider${pathMap[moduleType] || ""}`),
    query: {
      key: route.query.key,
      siderKey: key,
      projectKey: route.query.projectKey,
    },
  });
};

const onMenuClick = (key) => {
  handleMenuClick(key);
};

watch(
  () => route.query.key,
  () => {
    setMenuList();
    setActiveKey();
  },
);

watch(
  () => menuStore.menuList,
  () => {
    setActiveKey();
    setMenuList();
  },
  {
    deep: true,
  },
);

onMounted(() => {
  setActiveKey();
  setMenuList();
});
</script>

<style lang="less" scoped></style>
