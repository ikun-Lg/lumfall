<template>
  <a-range-picker
    v-model="dtoValue"
    v-bind="schema.option"
    class="date-range"
  />
</template>
<script setup>
import { onMounted, ref } from "vue";
import moment from "moment";

const { schemaKey, schema } = defineProps({
  schemaKey: String,
  schema: Object,
});

const emit = defineEmits(["load"]);

const dtoValue = ref([]);

const getValue = () => {
  const [start, end] = dtoValue.value ?? [];
  return start && end
    ? {
        [`${schemaKey}_start`]: moment(start).format("YYYY-MM-DD HH:mm:ss"),
        [`${schemaKey}_end`]: moment(end).format("YYYY-MM-DD HH:mm:ss"),
      }
    : {};
};

const reset = () => {
  dtoValue.value = [];
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
