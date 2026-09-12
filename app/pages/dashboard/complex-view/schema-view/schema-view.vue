<template>
  <div class="schema-view">
    <SearchPanel
      v-if="
        searchSchema?.properties &&
        Object.keys(searchSchema?.properties).length > 0
      "
      @search="onSearch"
    ></SearchPanel>
    <TablePanel @operate="onTableOperate"></TablePanel>
  </div>
</template>

<script setup>
import { provide, ref } from "vue";
import SearchPanel from "./complex-view/search-panel/search-panel.vue";
import TablePanel from "./complex-view/table-panel/table-panel.vue";
import { useSchema } from "./hook/schema.js";

const { api, tableSchema, tableConfig, searchConfig, searchSchema } =
  useSchema();

const apiParams = ref({});
provide("schemaViewData", {
  api,
  tableSchema,
  tableConfig,
  searchConfig,
  searchSchema,
  apiParams,
});

const onSearch = (searchValObj) => {
  apiParams.value = searchValObj;
};

const onTableOperate = () => {};
</script>

<style lang="less" scoped>
.schema-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px 20px 20px;
  box-sizing: border-box;
}
</style>
