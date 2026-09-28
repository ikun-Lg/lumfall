<template>
  <a-form
    v-if="schema && schema.properties"
    class="schema-search-bar"
    layout="inline"
  >
    <a-form-item
      v-for="(schemaItem, key) in schema.properties"
      :key="key"
      :label="schemaItem.label"
      class="schema-search-bar-item"
    >
      <component
        :ref="searchComList"
        :is="SearchItemConfig[schemaItem.option?.componentType].component"
        :schemaKey="key"
        :schema="schemaItem"
        @load="handleChildLoad"
      />
    </a-form-item>
    <a-form-item class="schema-search-bar-actions">
      <a-space>
        <a-button type="primary" class="search-btn" @click="search"
          >查询</a-button
        >
        <a-button class="reset-btn" @click="reset">重置</a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { toRefs, defineProps, defineEmits, ref } from "vue";
import SearchItemConfig from "./complex-view/search-item-config";

const props = defineProps({
  /**
     * {
          "type": "object",
          "properties": {
            "key": {
              ...schema,
              "type": "",
              "label": "",
              "option":{
                ...aComponentConfig, // 标准acro-component-column 配置
                componentType:"",
                default:""
              }
            }
          }
     */
  schema: Object,
});

const { schema } = toRefs(props);

const emit = defineEmits(["load", "search", "reset"]);

const searchComList = ref([]);

const getValue = () => {
  let dtoObj = {};
  searchComList.value.forEach((com) => {
    dtoObj = { ...dtoObj, ...com?.getValue() };
  });
  return dtoObj;
};

let childComLoadedCopunt = 0;
const handleChildLoad = () => {
  childComLoadedCopunt++;
  if (childComLoadedCopunt === Object.keys(schema?.value?.properties).length) {
    emit("load", getValue());
  }
};

const search = () => {
  emit("search", getValue());
};

const reset = () => {
  searchComList.value.forEach((com) => {
    com?.reset();
  });
  emit("reset");
};

defineExpose({
  reset,
  getValue,
});
</script>
<style lang="less">
.schema-search-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 24px;
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;

  .input {
    width: 180px;
  }

  .select {
    width: 180px;
  }

  :deep(.arco-form-item) {
    margin-bottom: 0;
  }

  :deep(.arco-form-item-label) {
    color: var(--color-text-2);
  }

  .schema-search-bar-item {
    min-width: 220px;
  }

  .schema-search-bar-actions {
    margin-left: auto;
  }

  .search-btn,
  .reset-btn {
    width: 80px;
  }
}
</style>
