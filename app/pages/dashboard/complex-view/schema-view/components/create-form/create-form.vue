<template>
  <a-drawer
    @cancel="close"
    :visible="isShow"
    :title="name"
    :width="550"
    :unmount-on-close="true"
  >
    <template #title>{{ title }}</template>
    <SchemaForm ref="schemaFormRef" :schema="components[name]?.schema" />
    <template #footer>
      <a-row justify="end" align="center" :gutter="16">
        <a-button @click="isShow = false">取消</a-button>
        <a-button type="primary" @click="save">{{ saveBtnText }}</a-button>
      </a-row>
    </template>
  </a-drawer>
</template>

<script setup>
import { ref, inject, defineEmits } from "vue";
import SchemaForm from "$sunsetSchemaForm";
import $curl from "$sunsetCurl";
import { Notification } from "@arco-design/web-vue";

const { api, components } = inject("schemaViewData") || {};

const emit = defineEmits(["command"]);

const schemaFormRef = ref(null);
const name = ref("createForm");
const isShow = ref(false);
const loading = ref(false);
const title = ref("");
const saveBtnText = ref("");

const show = () => {
  const { config } = components.value[name.value];

  title.value = config.title || "创建";
  saveBtnText.value = config.saveBtnText || "保存";

  isShow.value = true;
};

const close = () => {
  isShow.value = false;
};

const save = async (rowData) => {
  if (loading.value) return;
  if (!schemaFormRef.value.validate()) {
    return;
  }
  loading.value = true;

  const res = await $curl({
    method: "post",
    url: api.value,
    data: {
      ...schemaFormRef.value.getValue(),
    },
  });

  loading.value = false;

  if (!res || !res.success) {
    return;
  }

  Notification.success({
    title: "成功",
    content: res?.message || "保存成功",
  });

  close();
  emit("command", {
    event: "loadTableData",
  });
};

defineExpose({
  name,
  show,
});
</script>

<style lang="less" scoped></style>
