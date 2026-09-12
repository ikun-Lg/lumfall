<template>
  <a-card class="search-panel">
    <schema-search-bar
      :schema="searchSchema"
      @load="onLoad"
      @search="onSearch"
      @reset="onReset"
    />
  </a-card>
</template>

<script setup>
import { inject } from "vue";
import SchemaSearchBar from "$widgets/schema-search-bar/schema-search-bar.vue";

const { searchSchema } = inject("schemaViewData");

const emit = defineEmits(["search"]);

const onLoad = (searchValObj) => {
  emit("search", searchValObj);
};

const onSearch = (searchValObj) => {
  emit("search", searchValObj);
};

const onReset = () => {
  emit("search", {});
};
</script>

<style lang="less" scoped>
.search-panel {
  border-radius: 8px;

  :deep(.arco-card-body) {
    padding: 0;
  }
}
</style>
