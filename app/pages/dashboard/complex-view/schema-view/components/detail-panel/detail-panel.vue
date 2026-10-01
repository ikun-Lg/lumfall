<template>
  <a-drawer
    :visible="isShow"
    :title="title"
    :width="550"
    :maskClosable="false"
    :unmount-on-close="true"
    @cancel="close"
  >
    <template #title>{{ title }}</template>
    <a-card v-loading="laoding" class="detail-panel-card">
      <a-row
        v-for="(item, key) in components[name]?.schema?.properties"
        :key="key"
        align="center"
        class="detail-panel-row"
      >
        <a-col :span="8" class="detail-panel-label"> {{ item.label }}: </a-col>
        <a-col :span="16" class="detail-panel-value">
          {{ dtoModel[key] }}
        </a-col>
      </a-row>
    </a-card>
    <template #footer>
      <a-row justify="end" align="center" :gutter="16">
        <a-button @click="isShow = false">关闭</a-button>
      </a-row>
    </template>
  </a-drawer>
</template>

<script lang="js" setup>
import { ref, inject } from "vue";
import $curl from "$lumfallCurl";

const { api, components } = inject("schemaViewData") || {};

const name = ref("detailPanel");
const isShow = ref(false);
const laoding = ref(false);
const title = ref("");
const mainKey = ref("");
const mainValue = ref("");
const dtoModel = ref({});

const show = (rowData) => {
  const { config } = components.value[name.value];

  title.value = config.title || "详情";
  mainKey.value = config.mainKey;
  mainValue.value = rowData[config.mainKey];
  dtoModel.value = {};

  isShow.value = true;

  fetchFormData();
};

const close = () => {
  isShow.value = false;
};

const fetchFormData = async () => {
  if (laoding.value) return;
  laoding.value = true;

  const res = await $curl({
    method: "get",
    url: api.value,
    query: {
      [mainKey.value]: mainValue.value,
    },
  });

  laoding.value = false;

  if (!res || !res.success || !res.data) {
    return;
  }

  dtoModel.value = res.data;
};

defineExpose({
  show,
  name,
});
</script>

<style lang="less" scoped>
.detail-panel-card {
  width: 100%;

  :deep(.arco-card-body) {
    padding: 8px 20px;
  }
}

.detail-panel-row {
  min-height: 48px;
  padding: 12px 0;
  border-bottom: 1px solid #f2f3f5;

  &:last-child {
    border-bottom: 0;
  }
}

.detail-panel-label {
  color: #86909c;
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
}

.detail-panel-value {
  min-width: 0;
  color: #1d2129;
  font-size: 14px;
  line-height: 24px;
  overflow-wrap: anywhere;
}
</style>
