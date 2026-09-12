<template>
  <HeaderContainer title="项目列表">
    <template #main-content>
      <div class="project-list-page">
        <a-spin :loading="loading" class="page-spin">
          <section
            v-for="item in modelList"
            :key="item.model?.key"
            class="model-panel"
          >
            <div class="model-title">
              <span class="title-bar"></span>
              <span class="title-text">{{ item.model?.name }}</span>
              <span class="title-count"
                >{{ Object.keys(item.project ?? {}).length }} 个项目</span
              >
            </div>
            <div class="project-grid">
              <a-card
                v-for="projectItem in item.project"
                :key="projectItem.key"
                class="project-card"
                hoverable
                @click="onEnter(projectItem)"
              >
                <template #title>{{ projectItem?.name }}</template>
                <div class="content">{{ projectItem?.desc }}</div>
                <template #actions>
                  <a-button type="text" class="enter-btn">
                    进入
                    <icon-right />
                  </a-button>
                </template>
              </a-card>
            </div>
          </section>
        </a-spin>
      </div>
    </template>
  </HeaderContainer>
</template>

<script setup>
import HeaderContainer from "$widgets/header-container/header-container.vue";
import { onMounted, ref } from "vue";
import $curl from "$common/curl.js";

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
  const { origin } = window.location;
  window.open(`${origin}/view/dashboard${project?.homePage}`);
};

onMounted(() => {
  getModelList();
});
</script>

<style lang="less">
* {
  box-sizing: border-box;
}
.project-list-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 24px 48px;

  :deep(.arco-spin) {
    display: block;
    width: 100%;
  }
}

.model-panel {
  background-color: var(--color-bg-2);
  border-radius: 8px;
  padding: 20px 24px 24px;

  & + .model-panel {
    margin-top: 16px;
  }

  .model-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .title-bar {
      width: 4px;
      height: 16px;
      border-radius: 2px;
      background: rgb(var(--primary-6));
    }

    .title-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-1);
      line-height: 1;
    }

    .title-count {
      font-size: 12px;
      color: var(--color-text-3);
      line-height: 1;
      margin-top: 2px;
    }
  }
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  border-radius: 8px;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  :deep(.arco-card-title) {
    font-size: 15px;
    font-weight: 600;
  }

  .content {
    min-height: 44px;
    color: var(--color-text-2);
    font-size: 13px;
    line-height: 1.6;
  }

  .enter-btn {
    color: rgb(var(--primary-6));

    &:hover {
      background-color: var(--color-primary-light-1);
    }
  }
}
</style>
