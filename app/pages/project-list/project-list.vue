<template>
    <HeaderContainer title="项目列表">
        <template #main-content>
            <a-spin :loading="loading">
                <div v-for="item in modelList" :key="item.model?.key">
                    <div class="model-panel">
                        <a-row align="middle">
                            <div class="title">{{ item.model?.name }}</div>
                        </a-row>
                         <a-divider />
                    </div>
                    <a-row class="project-list">
                        <a-card
                            v-for="projectItem in item.project"
                            :key="projectItem.key"
                            class="project-card"
                        >
                            <template #title>{{ projectItem?.name }}</template>
                            <div class="content">{{ projectItem?.desc }}</div>
                            <template #actions>
                                <a-row justify="end">
                                    <a-button
                                        type="text"
                                        @click="onEnter(projectItem)"
                                    >
                                        进入
                                    </a-button>
                                </a-row>
                            </template>
                        </a-card>
                    </a-row>
                </div>
            </a-spin>
        </template>
    </HeaderContainer>
</template>

<script setup>
import $curl from "$common/curl.js";
import HeaderContainer from "$widgets/header-container/header-container.vue";
import { onMounted, ref } from "vue";

const loading = ref(false);

const modelList = ref([]);
async function getModelList() {
    loading.value = true;
    const res = await $curl({
        method: "get",
        url: "/api/project/model_list",
        errorMessage: "获取项目列表失败",
    });
    loading.value = false;

    if (!res || !res.success || !res.data) {
        return;
    }

    modelList.value = res.data;
}

const onEnter = (project) => {
    console.log("enter", project);
};

onMounted(() => {
    getModelList();
});
</script>

<style lang="less" scoped>
.model-panel {
    margin-bottom: 24px;

    .title {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-1);
        margin-bottom: 12px;
    }
}

.project-list {
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
}

.project-card {
    width: 280px;
    cursor: pointer;
    transition:
        box-shadow 0.2s ease,
        transform 0.2s ease;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
    }

    .content {
        min-height: 64px;
        color: var(--color-text-2);
        font-size: 14px;
        line-height: 1.5;
    }
}
</style>
