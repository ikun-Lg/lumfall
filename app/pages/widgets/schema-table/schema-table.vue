<template>
  <div class="schema-table">
  <a-table
    v-if="schema && schema.properties"
    :loading="loading"
    :data="tableData"
    :pagination="false"
    stripe
    class="table"
  >
    <template #columns>
      <template v-for="(schemaItem, key) in schema.properties" :key="key">
        <a-table-column
          v-if="schemaItem.option?.visible !== false"
          :title="schemaItem.label"
          :data-index="key"
          v-bind="getColumnOption(schemaItem)"
        >
          <template
            v-if="getEnumList(schemaItem).length > 0"
            #cell="{ record }"
          >
            <a-tag
              :color="getEnumColor(getEnumList(schemaItem), record[key])"
              class="enum-tag"
            >
              {{ getEnumLabel(getEnumList(schemaItem), record[key]) }}
            </a-tag>
          </template>
        </a-table-column>
      </template>
      <a-table-column
        v-if="buttons?.length > 0"
        title="操作"
        fixed="right"
        :width="operationWidth"
      >
        <template #cell="scoped">
          <a-space :size="4">
            <a-button
              v-for="item in buttons"
              :key="item.label"
              :status="item.type"
              v-bind="item"
              type="text"
              @click="
                operationHandler({ btnConfig: item, rowData: scoped.record })
              "
            >
              {{ item.label }}
            </a-button>
          </a-space>
        </template>
      </a-table-column>
    </template>
  </a-table>
    <a-row class="pagination">
      <a-pagination
        :current="currentPage"
        :page-size="pageSize"
        :page-size-options="[10, 20, 50, 100, 200]"
        :total="total"
        @page-size-change="onPageSizeChange"
        @change="onPageChange"
        show-total
        show-jumper
        show-page-size
      ></a-pagination>
    </a-row>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, toRefs, watch } from "vue";
import $curl from "$sunsetCurl";

const emit = defineEmits(["operate"]);

const props = defineProps({
  /**
     * {
          "type":"object",
          "properties":{
            "key":{
              ...schema,
              "type":"",
              "label":"",
              "tableOption":{
                ...aTableColumnConfig,
                "toFixed": 0,
                "visible":true
              }
            },
            ...
          }
     */
  schema: Object,
  api: String,
  apiParams: Object,
  /**
   * [{
      label:"",
      eventKey:"",
      eventOption:{},
    ...aButtonConfig,
     }]
   */
  buttons: Array,
});

const { schema, api, buttons, apiParams } = toRefs(props);

const loading = ref(false);
const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(50);
const total = ref(0);

const operationWidth = computed(() => {
  return buttons.value?.length > 0
    ? buttons.value.reduce((pre, cur) => {
        return pre + cur.label.length * 14 + 26;
      }, 30)
    : 50;
});

// 默认开启省略号 + tooltip，防止长文本撑破列宽
const getColumnOption = (schemaItem) => {
  return { ellipsis: true, tooltip: true, ...(schemaItem.option || {}) };
};

// tableOption.enumList：把 1/0 之类的枚举值渲染成可读标签
const ENUM_TAG_COLORS = [
  "green",
  "orangered",
  "arcoblue",
  "orange",
  "purple",
  "cyan",
  "gold",
  "magenta",
];

const getEnumList = (schemaItem) => {
  return schemaItem?.option?.enumList ?? [];
};

const getEnumLabel = (enumList, value) => {
  const matched = enumList.find((item) => String(item.value) === String(value));
  return matched?.label ?? value;
};

const getEnumColor = (enumList, value) => {
  const index = enumList.findIndex(
    (item) => String(item.value) === String(value),
  );
  return index >= 0 ? ENUM_TAG_COLORS[index % ENUM_TAG_COLORS.length] : "gray";
};

let timerId = null;
const loadTableData = async () => {
  clearTimeout(timerId);
  timerId = setTimeout(async () => {
    await fetchTableData();
    timerId = null;
  }, 100);
};
const fetchTableData = async () => {
  if (!api.value) {
    return;
  }

  showLoading();

  const res = await $curl({
    method: "get",
    url: `${api.value}/list`,
    query: {
      ...apiParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    },
  });

  hideLoading();

  if (!res || !res.data || !Array.isArray(res.data)) {
    tableData.value = [];
    total.value = 0;
    return;
  }

  tableData.value = buildTableData(res.data);
  total.value = res.metadata.total;
};

const buildTableData = (data) => {
  if (!schema.value?.properties) {
    return data;
  }

  return data.map((rowItem) => {
    for (const dKey in rowItem) {
      const schemaItem = schema.value.properties[dKey];

      if (schemaItem?.option?.toFixed) {
        rowItem[dKey] =
          rowItem[dKey].toFixed &&
          Number(rowItem[dKey]).toFixed(schemaItem.option.toFixed);
      }
    }

    return rowItem;
  });
};

const showLoading = () => {
  loading.value = true;
};

const hideLoading = () => {
  loading.value = false;
};

const initTableData = () => {
  currentPage.value = 1;
  pageSize.value = 50;
  nextTick(async () => {
    await loadTableData();
  });
};

watch(
  [schema, api, apiParams],
  () => {
    initTableData();
  },
  {
    deep: true,
  },
);

const operationHandler = ({ btnConfig, rowData }) => {
  emit("operate", { btnConfig, rowData });
};

const onPageChange = async (page) => {
  currentPage.value = page;
  await loadTableData();
};

const onPageSizeChange = async (size) => {
  pageSize.value = size;
  await loadTableData();
};

defineExpose({
  initTableData,
  loadTableData,
  showLoading,
  hideLoading,
});

onMounted(() => {
  initTableData();
});
</script>

<style lang="less" scoped>
.schema-table {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;

  .table {
    flex: 1;

    :deep(.arco-table-th) {
      background-color: var(--color-fill-1);
      font-weight: 600;
    }

    .enum-tag {
      border-radius: 4px;
    }
  }

  .pagination {
    flex: 0 0 auto;
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    padding: 4px 0;
  }
}
</style>
