<template>
    <h1>page2</h1>
    <a-input :style="{width:'320px'}" v-model="content" />
    <div>{{ content }}</div>
    <a-space>
        <a-button type="primary">Primary</a-button>
        <a-button>Secondary</a-button>
        <a-button type="dashed">Dashed</a-button>
        <a-button type="outline">Outline</a-button>
        <a-button type="text">Text</a-button>
      </a-space>
</template>

<script setup>
import { ref } from "vue";
import utils from "$common/utils";

console.log(utils)

const content = ref("666");
console.log("page2 init");
</script>

<style lang="less" scoped>
h1 {
    color: blue;
}
</style>
