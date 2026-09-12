<template>
  <a-select
    v-model="dtoValue"
    :options="schema?.option?.enumList"
    v-bind="schema.option"
    class="select"
  />
</template>
<script setup>
import { onMounted, ref } from "vue";

const { schemaKey, schema } = defineProps({
  schemaKey: String,
  schema: Object,
});

const emit = defineEmits(["load"]);

const dtoValue = ref();

const getValue = () => {
  return dtoValue.value !== undefined
    ? {
        [schemaKey]: dtoValue.value,
      }
    : {};
};

const reset = () => {
  dtoValue.value =
    schema?.option?.default ?? schema.option?.enumList?.[0]?.value;
};

onMounted(() => {
  reset();
  emit("load");
});

defineExpose({
  getValue,
  reset,
});
</script>

<style lang="less" scoped></style>
