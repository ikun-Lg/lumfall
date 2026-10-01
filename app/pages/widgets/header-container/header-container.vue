<template>
  <a-layout class="header-container">
    <a-layout-header class="header">
      <div class="title-panel">
        <img :src="logo" class="logo" />
        <span class="text">{{ title }}</span>
      </div>
      <div class="menu-panel">
        <slot name="menu-content"></slot>
      </div>
      <div class="setting-panel">
        <slot name="setting-content"></slot>
        <a-dropdown @select="handleUserCommand">
          <div class="user-panel">
            <img :src="avatar" class="avatar" />
            <span class="user-name">{{ userName }}</span>
            <icon-down class="user-arrow" />
          </div>
          <template #content>
            <a-doption value="logout"> 退出登录 </a-doption>
          </template>
        </a-dropdown>
      </div>
    </a-layout-header>
    <a-layout-content class="main-container">
      <slot name="main-content"></slot>
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { ref } from "vue";
import logo from "$sunsetAssert/logo.svg";
import avatar from "$sunsetAssert/avatar.svg";

defineProps({
  title: String,
});

const userName = ref("管理员");
const handleUserCommand = (v, e) => {
  console.log(v);
};
</script>

<style lang="less" scoped>
.header-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: var(--color-fill-2);

  .header {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    height: 60px;
    padding: 0 24px;
    background-color: var(--color-bg-2);
    border-bottom: 1px solid var(--color-fill-3);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    z-index: 10;
  }

  .title-panel {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
    padding-right: 24px;
    border-right: 1px solid var(--color-fill-3);
    margin-right: 16px;

    .logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      object-fit: cover;
      flex: 0 0 auto;
    }

    .text {
      font-size: 17px;
      font-weight: 600;
      color: var(--color-text-1);
      line-height: 1;
      white-space: nowrap;
    }
  }

  .menu-panel {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    height: 100%;

    :deep(.arco-menu) {
      flex: 1 1 auto;
      min-width: 0;
      background: transparent;
    }
  }

  .setting-panel {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: auto;
    padding-left: 16px;
    flex: 0 0 auto;
  }

  .user-panel {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    border-radius: 20px;
    padding: 4px 8px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--color-fill-2);

      .user-arrow {
        color: var(--color-text-2);
      }
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
      flex: 0 0 auto;
    }

    .user-name {
      font-size: 14px;
      color: var(--color-text-1);
      line-height: 1;
      white-space: nowrap;
    }

    .user-arrow {
      font-size: 12px;
      color: var(--color-text-3);
      transition: transform 0.2s ease;
    }
  }

  :deep(.arco-dropdown-open) .user-arrow {
    transform: rotate(180deg);
  }

  .main-container {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    background-color: var(--color-fill-2);
  }
}
</style>
