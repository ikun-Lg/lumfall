<template>
  <a-select
    v-model="dtoValue"
    :options="enumList"
    v-bind="schema.option"
    class="select"
  />
</template>
<script setup>
import { onMounted, ref } from "vue";
import $curl from "$common/curl.js";

const { schemaKey, schema } = defineProps({
  schemaKey: String,
  schema: Object,
});

const emit = defineEmits(["load"]);

const dtoValue = ref();
const enumList = ref([]);

const getValue = () => {
  return dtoValue.value !== undefined
    ? {
        [schemaKey]: dtoValue.value,
      }
    : {};
};
const reset = () => {
  dtoValue.value = schema?.option?.default ?? enumList.value[0];
};

const fetchEnumList = async () => {
  const res = await $curl({
    method: "get",
    url: schema.option?.api,
    data: {},
  });

  if (res?.data?.length > 0) {
    enumList.value.push(...res?.data);
  }
};

onMounted(async () => {
  await fetchEnumList();
  reset();
  emit("load");
});

defineExpose({
  getValue,
  reset,
});
</script>

<style lang="less" scoped></style>
