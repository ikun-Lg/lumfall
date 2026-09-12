<template>
  <iframe v-if="path.length > 0" :src="path" class="iframe"></iframe>
  <a-empty v-else class="empty">
    <template #image>
      <icon-exclamation-circle-fill />
    </template>
    iframe 地址未配置或不可访问
  </a-empty>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useMenuStore } from "$store/menu.js";
import { IconExclamationCircleFill } from "@arco-design/web-vue/es/icon";

const route = useRoute();
const menuStore = useMenuStore();

const path = ref("");
const setPath = () => {
  const { key, siderKey } = route.query;

  const menuItem = menuStore.findMenuItem({
    key: "key",
    value: siderKey ?? key,
  });
  console.log("menuItem", menuItem);

  path.value = menuItem?.iframeConfig?.path ?? "";
};

watch(
  [() => route.query.key, () => route.query.siderKey, () => menuStore.menuList],
  () => {
    setPath();
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>

<style lang="less" scoped>
.iframe {
  border: 0;
  width: 100%;
  height: 100%;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
