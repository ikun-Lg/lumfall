<template>
  <a-row align="center" justify="space-between" class="form-item">
    <a-row v-if="schema.label" class="item-label" justify="end" align="center">
      <a-row
        v-if="schema.option?.required"
        class="required"
        justify="end"
        align="center"
      >
        *
      </a-row>
      {{ schema.label }}
    </a-row>
    <a-row class="item-value" justify="start" align="center">
      <a-select
        v-model="dtoValue"
        :options="schema.option?.enumList"
        v-bind="schema.option"
        class="component"
        :error="!!validateTips"
        :placeholder="placeholder"
        @focus="onFocus"
        @blur="onBlur"
      />
    </a-row>
    <a-row v-if="validateTips" class="validate-tips">
      {{ validateTips }}
    </a-row>
  </a-row>
</template>

<script setup>
import { inject, ref, toRefs, watch } from "vue";

const ajv = inject("ajv");

const props = defineProps({
  schemaKey: {
    type: String,
    default: "",
  },
  schema: {
    type: Object,
    default: () => ({ option: {} }),
  },
  model: {
    type: [String, Number, Boolean, Array, Object],
    default: undefined,
  },
});
const { schema, model } = toRefs(props);

const name = ref("select");
const dtoValue = ref();
const validateTips = ref(null);
const placeholder = ref("");

const initData = () => {
  const currentSchema = schema.value;
  dtoValue.value = model.value ?? currentSchema.option?.default ?? "";
  validateTips.value = null;
  placeholder.value =
    currentSchema.option?.placeholder || `请选择${currentSchema.label}`;
};

watch([model, schema], initData, { immediate: true, deep: true });

const validate = () => {
  validateTips.value = null;
  const value = dtoValue.value;
  const currentSchema = schema.value;
  const label = currentSchema.label || props.schemaKey;

  if (
    currentSchema.option?.required &&
    (value === undefined || value === null || value === "")
  ) {
    validateTips.value = `${label}不能为空`;
    return false;
  }

  if (value !== undefined && value !== null && value !== "") {
    let dtoEnum = [];
    if (currentSchema.option?.enumList) {
      dtoEnum = currentSchema.option.enumList.map((item) => item.value);
    }
    const validateFn = ajv.compile({
      ...currentSchema,
      ...{ enum: dtoEnum },
    });
    if (!validateFn(value)) {
      const error = validateFn.errors?.[0];
      validateTips.value =
        error?.keyword === "enum" ? `${label}选项无效` : `${label}不符合要求`;
      return false;
    }
  }

  return true;
};

const getValue = () =>
  dtoValue.value !== undefined ? { [props.schemaKey]: dtoValue.value } : {};

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
