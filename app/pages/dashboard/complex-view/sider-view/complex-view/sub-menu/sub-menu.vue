<template>
  <a-sub-menu :key="menuItem.key">
    <template #title>
      {{ menuItem.name }}
    </template>
    <div :key="item.key" v-for="item in menuItem.subMenu">
      <sub-menu
        v-if="item.subMenu && item.subMenu.length > 0"
        :menu-item="item"
      >
      </sub-menu>
      <a-menu-item v-else :key="item.key">{{ item.name }}</a-menu-item>
    </div>
  </a-sub-menu>
</template>

<script setup>
const { menuItem } = defineProps(["menuItem"]);
</script>

<style lang="less" scoped></style>
