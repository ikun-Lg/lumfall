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
    <SchemaForm
      ref="schemaFormRef"
      v-loading="loading"
      :schema="components[name]?.schema"
      :model="dtoModel"
    />
    <template #footer>
      <a-row justify="end" align="center" :gutter="16">
        <a-button @click="isShow = false">取消</a-button>
        <a-button type="primary" @click="save">{{ saveBtnText }}</a-button>
      </a-row>
    </template>
  </a-drawer>
</template>

<script lang="js" setup>
import { ref, defineExpose, inject } from "vue";
import $curl from "$sunsetCurl";
import { Notification } from "@arco-design/web-vue";
import SchemaForm from "$sunsetSchemaForm";

const { api, components } = inject("schemaViewData") || {};

const emit = defineEmits(["command"]);

const name = ref("editForm");
const schemaFormRef = ref(null);

const isShow = ref(false);
const loading = ref(false);
const title = ref("");
const saveBtnText = ref("");
const mainKey = ref("");
const mainValue = ref("");
const dtoModel = ref({});

const show = (rowData) => {
  const { config } = components.value[name.value];
  title.value = config.title;
  saveBtnText.value = config.saveBtnText;
  mainKey.value = config.mainKey;
  mainValue.value = config.mainKey ? rowData[config.mainKey] : "";
  dtoModel.value = {};

  isShow.value = true;

  fetchFormData();
};

const close = () => {
  isShow.value = false;
};

const fetchFormData = async () => {
  if (loading.value) return;

  loading.value = true;
  const res = await $curl({
    method: "get",
    url: `${api.value}`,
    query: {
      [mainKey.value]: mainValue.value,
    },
  });
  loading.value = false;

  if (!res || !res.success || !res.data) {
    return;
  }

  dtoModel.value = res.data;
};

const save = async () => {
  if (loading.value) return;
  if (!schemaFormRef.value.validate()) {
    return;
  }
  loading.value = true;

  const res = await $curl({
    method: "put",
    url: api.value,
    data: {
      [mainKey.value]: mainValue.value,
      ...schemaFormRef.value.getValue(),
    },
  });

  loading.value = false;

  if (!res || !res.success) {
    Notification.error({
      title: "错误",
      content: res?.message || "保存失败",
    });
    return;
  }

  Notification.success({
    title: "成功",
    content: res?.message || "保存成功",
  });

  close();

  emit("command", { event: "loadTableData" });
};

defineExpose({
  show,
  name,
});
</script>

<style lang="scss" scoped></style>
