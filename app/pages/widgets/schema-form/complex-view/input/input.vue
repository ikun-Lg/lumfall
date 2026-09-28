<template>
  <a-row align="center" justify="space-between" class="form-item">
    <a-row class="item-label" v-if="schema.label" justify="end" align="center">
      <a-row
        class="required"
        v-if="schema.option?.required"
        justify="end"
        align="center"
      >
        *
      </a-row>
      {{ schema.label }}
    </a-row>
    <a-row class="item-value" justify="start" align="center">
      <a-input
        v-model="dtoValue"
        v-bind="schema.option"
        class="component"
        :error="!!validateTips"
        @focus="onFocus"
        @blur="onBlur"
        :placeholder="placeholder"
      ></a-input>
    </a-row>
    <a-row class="validate-tips" v-if="validateTips">
      {{ validateTips }}
    </a-row>
  </a-row>
</template>

<script lang="js" setup>
import { ref, toRefs, watch, inject } from "vue";

const ajv = inject("ajv");

const props = defineProps({
  schemaKey: String,
  schema: Object,
  model: String,
});
const { schemaKey } = props;
const { schema, model } = toRefs(props);

const name = ref("input");
const dtoValue = ref();
const validateTips = ref(null);
const placeholder = ref(
  schema.value.option?.placeholder || `请输入${schema.value.label}`,
);

const initData = () => {
  const currentSchema = schema.value;
  dtoValue.value = model.value ?? currentSchema.option?.default;
  validateTips.value = null;

  const { minLength, maxLength, pattern } = currentSchema;

  const ruleList = [];
  if (currentSchema.option?.placeholder) {
    ruleList.push(currentSchema.option.placeholder);
  }

  if (minLength) {
    ruleList.push(`最少${minLength}个字符`);
  }

  if (maxLength) {
    ruleList.push(`最多${maxLength}个字符`);
  }

  if (pattern) {
    ruleList.push(`格式: ${pattern}`);
  }

  placeholder.value = ruleList.join("|");
};

watch(
  [model, schema],
  () => {
    initData();
  },
  {
    immediate: true,
    deep: true,
  },
);

const validate = () => {
  validateTips.value = null;
  const currentSchema = schema.value;
  const { type } = currentSchema;

  if (currentSchema.option?.required && !dtoValue.value) {
    validateTips.value = `${currentSchema.label}不能为空`;
    return false;
  }

  if (dtoValue.value) {
    const validateFn = ajv.compile(currentSchema);
    const valid = validateFn(dtoValue.value);
    if (!valid && validateFn.errors && validateFn.errors.length > 0) {
      const { keyword, params } = validateFn.errors[0];
      if (keyword === "type") {
        validateTips.value = `${currentSchema.label}必须是${type}`;
      } else if (keyword === "maxLength") {
        validateTips.value = `${currentSchema.label}长度不能超过${params.limit}`;
      } else if (keyword === "minLength") {
        validateTips.value = `${currentSchema.label}长度不能小于${params.limit}`;
      } else if (keyword === "pattern") {
        validateTips.value = `${currentSchema.label}格式不正确`;
      } else {
        console.error(`${currentSchema.label}不符合要求`, validateFn.errors[0]);
        validateTips.value = `${currentSchema.label}不符合要求`;
      }
      return false;
    }
  }

  return true;
};

const getValue = () => {
  return dtoValue.value !== undefined
    ? {
        [schemaKey]: dtoValue.value,
      }
    : {};
};

const onFocus = () => {
  validateTips.value = null;
};

const onBlur = () => {
  validate();
};

defineExpose({
  validate,
  getValue,
  name,
});
</script>

<style lang="less" scoped></style>
