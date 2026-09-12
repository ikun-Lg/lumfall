<template>
  <a-sub-menu :title="menuItem.name">
    <div v-for="item in menuItem.subMenu" :key="item.key">
      <SubMenu
        v-if="item.subMenu && item.subMenu.length > 0"
        :menuItem="item"
      ></SubMenu>
      <a-menu-item v-else :key="item.key">{{ item.name }}</a-menu-item>
    </div>
  </a-sub-menu>
</template>

<script setup>
const { menuItem } = defineProps(["menuItem"]);
</script>

<style lang="less" scoped></style>
