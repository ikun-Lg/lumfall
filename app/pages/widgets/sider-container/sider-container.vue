<template>
  <a-layout class="sider-container">
    <a-layout-sider width="200" class="aside">
      <slot name="menu-content"></slot>
    </a-layout-sider>
    <a-layout-content>
      <slot name="main-content"></slot>
    </a-layout-content>
  </a-layout>
</template>

<script setup></script>

<style lang="less" scoped>
.sider-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: var(--color-fill-2);

  .aside {
    flex: 0 0 auto;
    height: 100%;
    background-color: var(--color-bg-2);
    border-right: 1px solid var(--color-border-2);
    overflow-y: auto;
  }

  :deep(.arco-layout-content) {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    overflow: auto;
    // padding: 24px;
    background-color: var(--color-fill-2);
  }
}
</style>
