<template>
  <HeaderContainer :title="projectName">
    <template #menu-content>
      <a-menu
        :selected-keys="activeKeys"
        mode="horizontal"
        @menu-item-click="handleMenuClick"
      >
        <template v-for="item in menuStore.menuList">
          <SubMenu
            v-if="item.subMenu && item.subMenu.length > 0"
            :menuItem="item"
          />
          <a-menu-item v-else :key="item.key">{{ item.name }}</a-menu-item>
        </template>
      </a-menu>
    </template>
    <template #setting-content>
      <a-dropdown @select="handleProjectSelect">
        <a-button type="text">{{ projectName }}<icon-down /></a-button>
        <template v-if="projectStore.projectList.length > 1" #content>
          <a-doption
            v-for="project in projectStore.projectList"
            :key="project.key"
            :value="project.key"
            :disabled="project.name === projectName"
          >
            {{ project.name }}
          </a-doption>
        </template>
      </a-dropdown>
    </template>
    <template #main-content>
      <slot name="main-content" />
    </template>
  </HeaderContainer>
</template>

<script setup>
import { ref, watch } from "vue";
import HeaderContainer from "$sunsetHeaderContainer";
import SubMenu from "./complex-view/sub-menu/sub-menu.vue";
import { useMenuStore } from "$sunsetStore/menu.js";
import { useProjectStore } from "$sunsetStore/project.js";
import { dashboardPath } from "$sunsetPage/dashboard/route-path.js";
import { useRoute } from "vue-router";

const route = useRoute();
const menuStore = useMenuStore();
const projectStore = useProjectStore();

defineProps({
  projectName: String,
});

const emit = defineEmits(["menu-select"]);

const activeKeys = ref([]);

const setActiveKeys = function () {
  const menuItem = menuStore.findMenuItem({
    key: "key",
    value: route.query.key,
  });
  if (!menuItem) return;

  activeKeys.value = [menuItem.key];
};

watch(
  () => route.query.key,
  () => {
    setActiveKeys();
  },
  { immediate: true },
);

watch(
  () => menuStore.menuList,
  () => {
    setActiveKeys();
  },
  { immediate: true, deep: true },
);

const handleMenuClick = (key) => {
  if (key) {
    const menuItem = menuStore.findMenuItem({ key: "key", value: key });
    emit("menu-select", menuItem);
  }
};

const handleProjectSelect = (event) => {
  const projectItem = projectStore.projectList.find(
    (item) => item.key === event,
  );
  if (!projectItem || !projectItem.homePage) {
    return;
  }

  const { origin } = window.location;
  window.location.replace(`${origin}${dashboardPath(projectItem.homePage)}`);
};

// watch 已带 immediate: true，无需在 onMounted 中手动调用
</script>
