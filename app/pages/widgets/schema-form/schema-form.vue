<template>
  <a-row v-if="schema && schema.properties" class="schema-form">
    <template v-for="(itemSchema, key) in schema.properties">
      <component
        ref="formComListRef"
        v-show="itemSchema.option?.visible !== false"
        :is="FormItemConfig[itemSchema.option?.componentType]?.component"
        :schema="itemSchema"
        :model="model ? model[key] : undefined"
        :schemaKey="key"
      ></component>
    </template>
  </a-row>
</template>

<script lang="js" setup>
import { ref, toRefs, provide } from "vue";
import FormItemConfig from "./form-item-config.js";
import Ajv from "ajv";

const ajv = new Ajv();

provide("ajv", ajv);

const props = defineProps({
  /**
     * schema config:
     * {
          "type": "object",
          "properties": {
            "key": {
              ...schema,
              "type": "",
              "label": "",
              "option":{
                 ...aComponentConfig,
                "componentType":"", // 创建表单项组件类型: input | select | dynamicSelect | dateRange
                "required": false, // 表单项是否必填
                "visible": true,
                "disabled": false,
                "default":"",

                "enumList":[],
              }
            },
            ...
          },
        }
     */
  schema: Object,
  // 表单数据
  model: Object,
});

const { schema } = toRefs(props);

const formComListRef = ref([]);

const validate = () => {
    return  formComListRef.value.every((com) => {
        if (com.validate) {
            const result = com.validate();
            return result;
        }
        return true
    })
};

const getValue = () => {
    return formComListRef.value.reduce((acc, com) => {
        if (com.getValue) {
            const value = com.getValue();
            return { ...acc, ...value };
        }
        return acc;
    }, {});
};

defineExpose({
  validate,
  getValue,
});
</script>

<style lang="less" scoped>
.schema-form {
  display: flex;
  flex-direction: column;
  width: 100%;

  :deep(.form-item) {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    width: 100%;
    margin-bottom: 16px;
  }

  :deep(.item-label) {
    box-sizing: border-box;
    flex: 0 0 120px;
    min-height: 32px;
    padding-right: 12px;
    color: #333;
  }

  :deep(.required) {
    margin-right: 4px;
    color: #f53f3f;
  }

  :deep(.item-value) {
    flex: 1;
    min-width: 0;
  }

  :deep(.component) {
    width: 100%;
  }

  :deep(.validate-tips) {
    box-sizing: border-box;
    width: calc(100% - 120px);
    margin-left: 120px;
    padding-top: 4px;
    color: #f53f3f;
    font-size: 12px;
    line-height: 20px;
  }
}
</style>
