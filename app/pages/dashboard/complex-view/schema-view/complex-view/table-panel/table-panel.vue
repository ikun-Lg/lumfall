<template>
  <a-card class="table-panel">
    <a-row
      v-if="tableConfig?.headerButtons?.length > 0"
      justify="end"
      class="operation-panel"
    >
      <a-button
        v-for="item in tableConfig?.headerButtons"
        :key="item.label"
        v-bind="item"
        @click="operationHandler({ btnConfig: item })"
      >
        {{ item.label }}
      </a-button>
    </a-row>
    <SchemaTable
      ref="schemaTableRef"
      :schema="tableSchema"
      :api="api"
      :apiParams="apiParams"
      :buttons="tableConfig?.rowButtons ?? []"
      @operate="operationHandler"
    ></SchemaTable>
  </a-card>
</template>

<script setup>
import SchemaTable from "$sunsetSchemaTable";
import { inject, ref } from "vue";
import { Modal } from "@arco-design/web-vue";
import $curl from "$sunsetCurl";
import { Notification } from "@arco-design/web-vue";

const emit = defineEmits(["operate"]);

const { api, tableSchema, tableConfig, apiParams } = inject("schemaViewData");

const schemaTableRef = ref(null);

const EventKeyMap = {
  delete: removeData,
};

function removeData({ btnConfig, rowData }) {
  const { eventOption } = btnConfig;
  if (!eventOption?.params) {
    return;
  }

  const { params } = eventOption;

  const removeKey = Object.keys(params)[0];
  const removeValue = params[removeKey];
  const removeValueList = removeValue.split("::");
  let finalRemoveValue;
  if (removeValueList[0] === "schema" && removeValueList[1]) {
    finalRemoveValue = rowData[removeValueList[1]];
  }

  Modal.confirm({
    title: "确认删除",
    content: "确定要删除该条数据吗？删除后不可恢复。",
    onOk: async () => {
      schemaTableRef.value.showLoading();
      const res = await $curl({
        method: "delete",
        url: `${api.value}`,
        data: {
          [removeKey]: finalRemoveValue,
        },
        errorMessage: "delete fail",
      });
      schemaTableRef.value.hideLoading();

      if (!res || !res.success) {
        return;
      }

      Notification.success({
        title: "Delete Success",
        content: "Delete Success!",
      });

      await initTableData();
    },
  });
}

const operationHandler = ({ btnConfig, rowData }) => {
  const { eventKey } = btnConfig;
  console.log("eventKey", eventKey);

  if (EventKeyMap[eventKey]) {
    EventKeyMap[eventKey]({ btnConfig, rowData });
  } else {
    emit("operate", { btnConfig, rowData });
  }
};

const loadTableData = async () => {
  await schemaTableRef.value.loadTableData();
};

const initTableData = async () => {
  await schemaTableRef.value.initTableData();
};

defineExpose({ loadTableData, initTableData });
</script>

<style lang="less" scoped>
.table-panel {
  flex: 1;
  min-height: 0;
  width: 100%;
  border-radius: 8px;

  // :deep(.arco-card-body) {
  //   display: flex;
  //   flex-direction: column;
  //   height: 100%;
  //   min-height: 0;
  //   padding: 16px 20px 12px;
  // }

  .operation-panel {
    flex: 0 0 auto;
    margin-bottom: 12px;
  }
}
</style>
