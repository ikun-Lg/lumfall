<template>
    <a-layout class="header-container">
        <a-layout-header class="header">
            <a-row align="middle" class="header-row">
                <a-row align="middle" class="title-panel">
                    <img
                        src="https://p3-pc-sign.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_4d77737970574ab808896992ed87b0da.jpeg?lk3s=93de098e&x-expires=1788188400&x-signature=7sjFmg5TcHpp04XYwrYWjaI0Yc4%3D&from=2480802190&s=profile&se=false&sc=avatar&l=202608292337399E97CA848E2DA1F4350C"
                        class="logo"
                    />
                    <a-row class="text">
                        {{ title }}
                    </a-row>
                </a-row>
                <slot name="menu-content"></slot>
                <a-row justify="end" align="middle" class="setting-panel">
                    <slot name="setting-content"></slot>
                    <img
                        class="avatar"
                        src="https://p3-pc-sign.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_4d77737970574ab808896992ed87b0da.jpeg?lk3s=93de098e&x-expires=1788188400&x-signature=7sjFmg5TcHpp04XYwrYWjaI0Yc4%3D&from=2480802190&s=profile&se=false&sc=avatar&l=202608292337399E97CA848E2DA1F4350C"
                    />
                    <a-dropdown @select="handleUserCommand">
                        <span class="user-name"
                            >{{ userName }}
                            <icon-down />
                        </span>
                        <template #content>
                            <a-doption value="logout"> 退出登录 </a-doption>
                        </template>
                    </a-dropdown>
                </a-row>
            </a-row>
        </a-layout-header>
        <a-layout-content class="main-container">
            <slot name="main-content"></slot>
        </a-layout-content>
    </a-layout>
</template>

<script setup>
import { ref } from "vue";

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
        height: 64px;
        padding: 0 24px;
        background-color: var(--color-bg-2);
        border-bottom: 1px solid var(--color-border-2);

        .header-row {
            flex: 1 1 auto;
            width: 100%;

            .title-panel {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 0 0 auto;
            }

            .logo {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                flex: 0 0 auto;
            }

            .text {
                font-size: 18px;
                font-weight: 600;
                color: var(--color-text-1);
                line-height: 1;
            }

            .setting-panel {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-left: auto;
                flex: 0 0 auto;
            }

            .avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
                flex: 0 0 auto;
                cursor: pointer;
            }

            .user-name {
                font-size: 14px;
                color: var(--color-text-1);
                line-height: 1;
                cursor: pointer;
                user-select: none;

                &:hover {
                    color: rgb(var(--primary-6));
                }
            }
        }
    }

    .main-container {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 24px;
        background-color: var(--color-fill-2);
    }
}
</style>
