<template>
  <div class="todo-page">
    <a-empty class="empty">
      <template #image>
        <icon-code class="empty-icon" />
      </template>
      功能开发中
      <template #subtitle> 敬请期待 </template>
    </a-empty>
  </div>
</template>

<script setup></script>

<style lang="less" scoped>
.todo-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 320px;

  .empty {
    color: var(--color-text-3);
    font-size: 14px;

    .empty-icon {
      font-size: 48px;
      color: var(--color-text-4);
    }
  }
}
</style>
