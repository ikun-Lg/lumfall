<template>
  <div class="schema-view">
    <SearchPanel
      v-if="
        searchSchema?.properties &&
        Object.keys(searchSchema?.properties).length > 0
      "
      @search="onSearch"
    ></SearchPanel>
    <TablePanel ref="tablePanelRef" @operate="onTableOperate"></TablePanel>
    <component
      v-for="(item, key) in components"
      :key="key"
      :is="ComponentConfig[key]?.component"
      ref="comListRef"
      @command="onComponentCommand"
    />
  </div>
</template>

<script setup>
import { provide, ref } from "vue";
import SearchPanel from "./complex-view/search-panel/search-panel.vue";
import TablePanel from "./complex-view/table-panel/table-panel.vue";
import { useSchema } from "./hook/schema.js";
import ComponentConfig from "./components/component-config.js";

const {
  api,
  tableSchema,
  tableConfig,
  searchConfig,
  searchSchema,
  components,
} = useSchema();

const apiParams = ref({});
provide("schemaViewData", {
  api,
  tableSchema,
  tableConfig,
  searchConfig,
  searchSchema,
  apiParams,
  components,
});

const tablePanelRef = ref(null);
const comListRef = ref([]);

const onSearch = (searchValObj) => {
  apiParams.value = searchValObj;
};

const onTableOperate = ({btnConfig,rowData}) => {
  const {eventKey} = btnConfig
  if(EventHandlerMap[eventKey]){
    EventHandlerMap[eventKey]({btnConfig,rowData})
  }
};

const showComponent = ({btnConfig, rowData}) => {
  // Implementation for showing component
  const {comName} = btnConfig.eventOption;
  if(!comName) {
    console.warn("No component name provided in eventOption");
    return
  };
  const comRef = comListRef.value.find((com) => com.name === comName);
  if(!comRef || typeof comRef.show !== 'function') {
    console.warn(`Component with name ${comName} not found or does not have a show method`);
    return;
  }

  comRef.show(rowData);
};

const EventHandlerMap = {
  showComponent,
};

const onComponentCommand = (data)=>{
  const {event} = data;
  if(event === 'loadTableData'){
    tablePanelRef.value.loadTableData()
  }
}
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
