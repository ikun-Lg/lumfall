<template>
  <a-input v-model="dtoValue" v-bind="schema.option" class="input" />
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
  dtoValue.value = schema?.option?.default;
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
